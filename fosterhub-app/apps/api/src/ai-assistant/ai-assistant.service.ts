import { Injectable } from '@nestjs/common';
import type { AskFosterHubAiResponse } from '@fosterhub/types';
import { PrismaService } from '../prisma/prisma.service';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'for', 'from', 'how', 'i', 'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'our', 'regarding', 'should', 'that', 'the', 'their', 'there', 'these', 'this', 'to', 'what', 'when', 'where', 'which', 'who', 'with', 'would', 'you', 'your',
]);

@Injectable()
export class AiAssistantService {
  constructor(private readonly prisma: PrismaService) {}

  private extractTerms(question: string) {
    return Array.from(new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map(term => term.trim())
        .filter(term => term.length >= 3 && !STOP_WORDS.has(term)),
    )).slice(0, 8);
  }

  private visibleSourceFilter(currentUser: any) {
    const currentOrganizationId = currentUser?.organizationId;
    const parentOrganizationId = currentUser?.organizationType === 'county_agency'
      ? currentUser?.parentOrganizationId
      : null;

    return {
      status: 'READY' as const,
      OR: [
        { organizationId: currentOrganizationId },
        ...(parentOrganizationId ? [{ organizationId: parentOrganizationId, accessScope: 'INHERIT_TO_CHILDREN' as const }] : []),
      ],
    };
  }

  private buildScore(question: string, terms: string[], section: { heading: string; sectionKey: string | null; body: string; source: { title: string; sourceType: string } }) {
    const questionLower = question.toLowerCase();
    const heading = section.heading.toLowerCase();
    const body = section.body.toLowerCase();
    const title = section.source.title.toLowerCase();
    const sourceType = section.source.sourceType.toLowerCase();
    const sectionKey = (section.sectionKey || '').toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (heading.includes(term)) score += 4;
      if (title.includes(term)) score += 3;
      if (sectionKey.includes(term)) score += 2;
      if (sourceType.includes(term)) score += 1;
      if (body.includes(term)) score += 2;
    }

    if (questionLower.includes(heading)) score += 4;
    if (questionLower.includes(title)) score += 3;

    return score;
  }

  private summarizeBody(body: string) {
    const normalized = body.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    const firstSentence = normalized.match(/.*?[.!?](\s|$)/)?.[0]?.trim() || normalized;
    return firstSentence.length > 220 ? `${firstSentence.slice(0, 217).trim()}...` : firstSentence;
  }

  async ask(question: string, currentUser: any, conversationId?: string): Promise<AskFosterHubAiResponse> {
    const organizationName = currentUser?.organizationName || 'Active organization';
    const terms = this.extractTerms(question);

    const candidateSections = await this.prisma.knowledgeDocumentSection.findMany({
      where: {
        source: this.visibleSourceFilter(currentUser),
      },
      include: {
        source: {
          include: {
            organization: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { updatedAt: 'desc' },
      ],
      take: 200,
    });

    const scored = candidateSections
      .map(section => ({
        section,
        score: this.buildScore(question, terms, section),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!scored.length) {
      return {
        conversationId: conversationId || 'ask-fosterhub-ai',
        title: 'Ask FosterHub AI',
        subtitle: 'Approved documents only',
        question,
        answer:
          'FosterHub AI could not find a clear answer in the approved documents available right now. Try rephrasing your question or asking about a more specific topic that may appear in the approved policy sources.',
        status: 'no-results',
        scopeLabel: 'Approved documents only',
        organizationLabel: organizationName,
        citations: [],
      };
    }

    const topScore = scored[0].score;
    const status = topScore >= 8 ? 'answer' : 'partial';
    const citations = scored.map(({ section }) => ({
      document: section.source.title,
      section: section.sectionKey ? `${section.heading} (${section.sectionKey})` : section.heading,
      page: section.pageNumber ? String(section.pageNumber) : 'Not listed',
      excerpt: section.body,
    }));

    const summaries = scored.map(({ section }) => this.summarizeBody(section.body)).filter(Boolean);
    const answer = status === 'answer'
      ? `FosterHub AI found relevant guidance in the approved documents. The clearest guidance is: ${summaries.join(' ')}`
      : `FosterHub AI found related guidance in the approved documents, but the answer may depend on policy context, document version, or case-specific conditions. Review the cited sections below. ${summaries.join(' ')}`;

    return {
      conversationId: conversationId || 'ask-fosterhub-ai',
      title: 'Ask FosterHub AI',
      subtitle: 'Approved documents only',
      question,
      answer,
      status,
      scopeLabel: 'Approved documents only',
      organizationLabel: organizationName,
      citations,
    };
  }
}

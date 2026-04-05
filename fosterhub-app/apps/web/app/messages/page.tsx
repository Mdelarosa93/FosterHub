'use client';

import { useMemo, useState } from 'react';
import type { AskFosterHubAiRequest, AskFosterHubAiResponse, AskFosterHubAiStatus } from '@fosterhub/types';
import { AppShell } from '../../components/AppShell';
import { authedPost } from '../../lib/api';

type Citation = AskFosterHubAiResponse['citations'][number];

type MessageItem = {
  id: string;
  role: 'user' | 'assistant' | 'human';
  body: string;
  status?: AskFosterHubAiStatus;
  citations?: Citation[];
  createdAt: string;
};

type Conversation = {
  id: string;
  kind: 'ai' | 'direct' | 'group';
  title: string;
  subtitle: string;
  badge?: string;
  pinned?: boolean;
  messages: MessageItem[];
};

const initialConversations: Conversation[] = [
  {
    id: 'ask-fosterhub-ai',
    kind: 'ai',
    title: 'Ask FosterHub AI',
    subtitle: 'Search approved policy documents',
    badge: 'AI',
    pinned: true,
    messages: [],
  },
  {
    id: 'mobile-county-leadership',
    kind: 'group',
    title: 'Mobile County Leadership',
    subtitle: '3 new messages',
    messages: [
      {
        id: 'g1',
        role: 'human',
        body: 'Please review the placement staffing agenda before 2 PM.',
        createdAt: '10:24 AM',
      },
    ],
  },
  {
    id: 'placement-coordination',
    kind: 'group',
    title: 'Placement Coordination',
    subtitle: 'Waiting on transportation confirmation',
    messages: [
      {
        id: 'g2',
        role: 'human',
        body: 'Transportation is still pending. I will update the team once the driver confirms.',
        createdAt: '9:42 AM',
      },
    ],
  },
  {
    id: 'tara-james',
    kind: 'direct',
    title: 'Tara James',
    subtitle: 'Can you send the updated checklist?',
    messages: [
      {
        id: 'd1',
        role: 'human',
        body: 'Can you send the updated checklist when you have a minute?',
        createdAt: 'Yesterday',
      },
    ],
  },
];

function buildAiResponse(input: string): { body: string; status: 'answer' | 'no-results' | 'partial'; citations?: Citation[] } {
  const normalized = input.toLowerCase();

  if (normalized.includes('error')) {
    throw new Error('demo-error');
  }

  if (normalized.includes('visitation') || normalized.includes('visit')) {
    return {
      status: 'answer',
      body:
        'Based on the approved documents, visitation expectations depend on the case plan, court direction, and agency-approved schedule. Foster parents may need to support the visitation plan, document issues that affect the child, and coordinate changes through the assigned worker rather than making informal adjustments on their own.',
      citations: [
        {
          document: 'Foster Parent Handbook',
          section: 'Section 4.2',
          page: '18',
          excerpt:
            'Foster parents are expected to support the visitation plan established for the child and to communicate any concerns through the assigned worker so that changes are documented and approved appropriately.',
        },
        {
          document: 'DHR Policy Manual',
          section: 'Visitation and Family Contact',
          page: '113',
          excerpt:
            'Visitation schedules shall follow the case plan and court requirements. Any requested change should be reviewed by the agency and documented in the case record before implementation.',
        },
      ],
    };
  }

  if (normalized.includes('medical') || normalized.includes('consent')) {
    return {
      status: 'partial',
      body:
        'FosterHub AI found related guidance on medical decision-making, but the answer may depend on whether the care is routine, urgent, or requires legal consent. Review the cited sections before acting, especially for treatment that goes beyond ordinary day-to-day care.',
      citations: [
        {
          document: 'Foster Parent Handbook',
          section: 'Section 6.1',
          page: '24',
          excerpt:
            'Routine health appointments and day-to-day care may be handled according to agency guidance, while consent for major treatment may require additional authorization depending on placement status and legal authority.',
        },
        {
          document: 'DHR Policy Manual',
          section: 'Medical and Consent Requirements',
          page: '204',
          excerpt:
            'The agency shall ensure that informed consent requirements are followed for significant medical procedures and that documentation is maintained in the child record.',
        },
      ],
    };
  }

  if (normalized.includes('travel') || normalized.includes('out of county') || normalized.includes('out of state')) {
    return {
      status: 'answer',
      body:
        'The approved guidance indicates that travel may require advance notice or agency approval depending on distance, duration, and whether the trip crosses county or state lines. The safest workflow is to confirm the approval path before the trip and document the decision in the case record.',
      citations: [
        {
          document: 'Foster Parent Handbook',
          section: 'Travel and Overnight Requirements',
          page: '31',
          excerpt:
            'Foster parents should notify the agency before travel that may affect placement supervision, school attendance, or approved visitation schedules.',
        },
        {
          document: 'DHR Policy Manual',
          section: 'Out-of-County and Out-of-State Travel',
          page: '147',
          excerpt:
            'Approval requirements vary by trip type and duration. The case record should reflect the request, decision, and any conditions placed on the travel.',
        },
      ],
    };
  }

  if (normalized.includes('placement') || normalized.includes('change')) {
    return {
      status: 'answer',
      body:
        'For placement changes, the approved documents point to a documented review process, required notifications, and clear case record updates before the transition is finalized. The exact paperwork and approvers can vary by scenario, but documentation is consistently required.',
      citations: [
        {
          document: 'DHR Policy Manual',
          section: 'Placement Change Requirements',
          page: '89',
          excerpt:
            'Before a placement change is finalized, the agency should complete the required review steps, notify involved parties as required, and document the reason for the change in the case file.',
        },
      ],
    };
  }

  return {
    status: 'no-results',
    body:
      'FosterHub AI could not find a clear answer in the approved documents available right now. Try rephrasing your question or asking about a more specific topic such as visitation, placement, travel, medical consent, or documentation requirements.',
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('ask-fosterhub-ai');
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find(conversation => conversation.id === selectedConversationId) ?? conversations[0],
    [conversations, selectedConversationId],
  );

  async function handleSend() {
    if (!draft.trim() || !selectedConversation || selectedConversation.kind !== 'ai') return;

    const prompt = draft.trim();
    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      body: prompt,
      createdAt: 'Just now',
    };

    setConversations(current => current.map(conversation => (
      conversation.id === selectedConversation.id
        ? { ...conversation, messages: [...conversation.messages, userMessage] }
        : conversation
    )));
    setDraft('');
    setSubmitting(true);
    setRequestError(null);

    try {
      const authToken = localStorage.getItem('fosterhub.dev.token') ?? '';
      if (!authToken) {
        throw new Error('Missing auth token');
      }

      const payload: AskFosterHubAiRequest = {
        question: prompt,
        conversationId: selectedConversation.id,
      };
      const result = await authedPost('/ai-assistant/ask', authToken, payload as Record<string, any>);
      const response = result.data as AskFosterHubAiResponse;

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        body: response.answer,
        citations: response.citations,
        status: response.status,
        createdAt: 'Just now',
      };

      setConversations(current => current.map(conversation => (
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              title: response.title,
              subtitle: response.scopeLabel,
              messages: [...conversation.messages, assistantMessage],
            }
          : conversation
      )));
    } catch {
      setRequestError('FosterHub AI could not complete your request right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const aiConversation = selectedConversation?.kind === 'ai';

  return (
    <AppShell title="Messages">
      <main style={{ maxWidth: 'none', paddingTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--fh-border)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Conversations</div>
              <h2 style={{ marginBottom: 8 }}>Messages</h2>
              <p style={{ marginBottom: 0 }}>Team conversations and internal AI guidance in one place.</p>
            </div>

            <div style={{ display: 'grid', gap: 8, padding: 14 }}>
              {conversations.map(conversation => {
                const active = conversation.id === selectedConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(conversation.id);
                      setRequestError(null);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 16,
                      borderRadius: 18,
                      border: active ? '1px solid rgba(16, 88, 140, 0.22)' : '1px solid transparent',
                      background: active ? 'linear-gradient(180deg, #f6fbff 0%, #f9fcff 100%)' : 'transparent',
                      boxShadow: active ? '0 12px 28px rgba(16, 88, 140, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            display: 'grid',
                            placeItems: 'center',
                            background: conversation.kind === 'ai' ? 'linear-gradient(135deg, #10588c 0%, #046307 100%)' : '#eef3ef',
                            color: conversation.kind === 'ai' ? 'white' : 'var(--fh-text)',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {conversation.kind === 'ai' ? 'AI' : conversation.kind === 'group' ? 'GR' : 'DM'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <strong style={{ color: 'var(--fh-text)' }}>{conversation.title}</strong>
                            {conversation.badge ? (
                              <span className="badge" style={{ padding: '5px 10px', fontSize: 11 }}>{conversation.badge}</span>
                            ) : null}
                            {conversation.pinned ? (
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--fh-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinned</span>
                            ) : null}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--fh-text-muted)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conversation.subtitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--fh-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <h2 style={{ marginBottom: 0 }}>{selectedConversation.title}</h2>
                  {aiConversation ? <span className="badge">AI</span> : null}
                </div>
                <p style={{ marginBottom: 0 }}>
                  {aiConversation ? 'Approved documents only' : selectedConversation.subtitle}
                </p>
              </div>
              {aiConversation ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: '#f3f8f5', border: '1px solid var(--fh-border)', color: 'var(--fh-blue)', fontWeight: 700, fontSize: 13 }}>
                  Internal docs only
                </div>
              ) : null}
            </div>

            <div style={{ padding: 24, background: 'linear-gradient(180deg, #fbfdfc 0%, #f7faf8 100%)', minHeight: 640, display: 'grid', gridTemplateRows: '1fr auto', gap: 18 }}>
              <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                {aiConversation && selectedConversation.messages.length === 0 ? (
                  <div className="empty-state" style={{ padding: 28 }}>
                    <div className="eyebrow">Ask FosterHub AI</div>
                    <h3 style={{ marginBottom: 10 }}>Get answers from approved FosterHub guidance</h3>
                    <p>
                      Ask questions about policy, process, rights, and documentation. Answers are based only on approved internal documents and include source citations.
                    </p>
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fh-blue)', marginBottom: 12 }}>
                        Try asking
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {[
                          'What are foster parent rights around visitation?',
                          'What documentation is required for a placement change?',
                          'Can a child travel out of county?',
                          'What forms are needed for medical consent?',
                        ].map(prompt => (
                          <button
                            key={prompt}
                            type="button"
                            className="button button-ghost"
                            onClick={() => setDraft(prompt)}
                            style={{ minHeight: 38, padding: '9px 12px', borderRadius: 999 }}
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {!aiConversation ? (
                  <div className="empty-state">
                    <strong>{selectedConversation.title}</strong>
                    <p style={{ marginBottom: 0 }}>
                      This thread is part of the broader messages workspace. The current build focus here is adding the dedicated Ask FosterHub AI experience alongside regular team conversations.
                    </p>
                  </div>
                ) : null}

                {selectedConversation.messages.map(message => {
                  const isUser = message.role === 'user';
                  const isAssistant = message.role === 'assistant';
                  return (
                    <div
                      key={message.id}
                      style={{
                        justifySelf: isUser ? 'end' : 'stretch',
                        maxWidth: isUser ? '70%' : '100%',
                      }}
                    >
                      <div
                        style={{
                          borderRadius: 22,
                          padding: 18,
                          border: isUser ? '1px solid rgba(16, 88, 140, 0.2)' : '1px solid var(--fh-border)',
                          background: isUser
                            ? 'linear-gradient(135deg, #eef6ff 0%, #f7fbff 100%)'
                            : isAssistant && message.status === 'no-results'
                              ? '#fff8ef'
                              : 'white',
                          boxShadow: isUser ? '0 12px 28px rgba(16, 88, 140, 0.08)' : '0 10px 22px rgba(18, 49, 34, 0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <strong style={{ color: 'var(--fh-text)' }}>
                            {isUser ? 'You' : aiConversation ? 'FosterHub AI' : selectedConversation.title}
                          </strong>
                          <span style={{ fontSize: 12, color: 'var(--fh-text-muted)' }}>{message.createdAt}</span>
                        </div>

                        {isAssistant ? <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fh-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{message.status === 'partial' ? 'Related guidance found' : message.status === 'no-results' ? 'No clear answer found' : 'Answer'}</div> : null}
                        <p style={{ marginBottom: 0, color: 'var(--fh-text)', whiteSpace: 'pre-wrap' }}>{message.body}</p>

                        {message.citations?.length ? (
                          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fh-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sources</div>
                            {message.citations.map((citation, index) => {
                              const citationId = `${message.id}-${index}`;
                              const expanded = expandedCitationId === citationId;
                              return (
                                <div key={citationId} style={{ borderRadius: 16, border: '1px solid var(--fh-border)', background: '#fbfdfc', padding: 14 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                    <div>
                                      <strong style={{ display: 'block', marginBottom: 4 }}>{citation.document}</strong>
                                      <div style={{ fontSize: 13, color: 'var(--fh-text-muted)' }}>{citation.section} • Page {citation.page}</div>
                                    </div>
                                    <button
                                      type="button"
                                      className="button button-ghost"
                                      onClick={() => setExpandedCitationId(expanded ? null : citationId)}
                                      style={{ minHeight: 34, padding: '8px 12px' }}
                                    >
                                      {expanded ? 'Hide excerpt' : 'View excerpt'}
                                    </button>
                                  </div>
                                  {expanded ? (
                                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--fh-border)' }}>
                                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--fh-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Excerpt</div>
                                      <p style={{ marginBottom: 0, color: 'var(--fh-text)' }}>{citation.excerpt}</p>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {isAssistant ? (
                          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--fh-text-muted)' }}>
                            Answers are based only on approved internal documents.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {submitting ? (
                  <div style={{ borderRadius: 20, border: '1px solid var(--fh-border)', background: 'white', padding: 18, width: 'fit-content', boxShadow: '0 10px 22px rgba(18, 49, 34, 0.04)' }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>FosterHub AI</strong>
                    <div style={{ color: 'var(--fh-text-muted)' }}>Searching approved documents...</div>
                  </div>
                ) : null}

                {requestError ? (
                  <div className="notice notice-error">
                    <strong>Something went wrong</strong>
                    <p style={{ marginBottom: 0 }}>{requestError}</p>
                  </div>
                ) : null}
              </div>

              <div style={{ borderTop: '1px solid var(--fh-border)', paddingTop: 18 }}>
                {aiConversation ? (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--fh-text-muted)', marginBottom: 10 }}>
                      Answers are based only on approved internal documents.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'end' }}>
                      <label className="field" style={{ margin: 0 }}>
                        <span className="field-label" style={{ display: 'none' }}>Ask FosterHub AI</span>
                        <textarea
                          className="textarea"
                          value={draft}
                          onChange={event => setDraft(event.target.value)}
                          placeholder="Ask a policy or handbook question"
                          style={{ minHeight: 88 }}
                        />
                      </label>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={!draft.trim() || submitting}
                        onClick={handleSend}
                      >
                        {submitting ? 'Sending…' : 'Send question'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: 18 }}>
                    <strong>Human messaging is not wired up yet in this prototype.</strong>
                    <p style={{ marginBottom: 0 }}>
                      This screen now establishes the shared Messages shell, with Ask FosterHub AI as the first complete conversation type.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

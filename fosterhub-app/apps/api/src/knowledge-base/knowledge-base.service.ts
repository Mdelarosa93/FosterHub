import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { KnowledgeDocumentAuditEventRecord, KnowledgeDocumentExtractionPreview, KnowledgeDocumentSectionDiffRecord, KnowledgeDocumentSectionDraft, KnowledgeDocumentSectionRecord, KnowledgeDocumentSectionSnapshotCompareResponse, KnowledgeDocumentSectionSnapshotRecord, KnowledgeDocumentSourceSummary } from '@fosterhub/types';
import { PDFParse } from 'pdf-parse';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKnowledgeDocumentSourceDto } from './dto/create-knowledge-document-source.dto';
import { UpdateKnowledgeDocumentSourceDto } from './dto/update-knowledge-document-source.dto';
import { ReplaceKnowledgeDocumentSectionsDto } from './dto/replace-knowledge-document-sections.dto';
import { KNOWLEDGE_DOCUMENT_AUDIT_EVENTS } from './audit-event.constants';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  private storageRoot() {
    return process.env.KNOWLEDGE_BASE_STORAGE_DIR
      ? path.resolve(process.env.KNOWLEDGE_BASE_STORAGE_DIR)
      : path.resolve(process.cwd(), 'storage', 'knowledge-base-files');
  }

  private getCurrentOrganizationId(currentUser: any) {
    if (!currentUser?.organizationId) {
      throw new ForbiddenException('Active organization context is required');
    }
    return currentUser.organizationId as string;
  }

  private async getVisibleOrganizationIds(currentUser: any) {
    const currentOrganizationId = this.getCurrentOrganizationId(currentUser);
    const ids = [currentOrganizationId];

    if (currentUser?.organizationType === 'county_agency' && currentUser?.parentOrganizationId) {
      ids.push(currentUser.parentOrganizationId);
    }

    return ids;
  }

  private async ensureManageableSource(sourceId: string, currentUser: any) {
    const currentOrganizationId = this.getCurrentOrganizationId(currentUser);
    const source = await this.prisma.knowledgeDocumentSource.findUnique({
      where: { id: sourceId },
      include: { organization: true },
    });

    if (!source) {
      throw new NotFoundException('Knowledge document source not found');
    }

    if (source.organizationId !== currentOrganizationId) {
      throw new ForbiddenException('This source is outside the active organization context');
    }

    return source;
  }

  private async ensureVisibleSource(sourceId: string, currentUser: any) {
    const currentOrganizationId = this.getCurrentOrganizationId(currentUser);
    const visibleOrganizationIds = await this.getVisibleOrganizationIds(currentUser);
    const source = await this.prisma.knowledgeDocumentSource.findUnique({
      where: { id: sourceId },
      include: { organization: true },
    });

    if (!source) {
      throw new NotFoundException('Knowledge document source not found');
    }

    const visible = source.organizationId === currentOrganizationId
      || (visibleOrganizationIds.includes(source.organizationId) && source.accessScope === 'INHERIT_TO_CHILDREN');

    if (!visible) {
      throw new ForbiddenException('This source is not visible in the active organization context');
    }

    return source;
  }

  private async recordAuditEvent(currentUser: any, source: { id?: string | null; organizationId: string; title: string; versionLabel?: string | null; status?: any; }, eventType: string, summary: string, sectionCount?: number | null) {
    return this.prisma.knowledgeDocumentAuditEvent.create({
      data: {
        knowledgeDocumentSourceId: source.id ?? null,
        organizationId: source.organizationId,
        actorUserId: currentUser?.id ?? null,
        eventType,
        summary,
        snapshotTitle: source.title,
        snapshotVersionLabel: source.versionLabel ?? null,
        snapshotStatus: source.status ?? null,
        snapshotSectionCount: sectionCount ?? null,
      },
    });
  }

  async listSources(currentUser: any): Promise<KnowledgeDocumentSourceSummary[]> {
    const currentOrganizationId = this.getCurrentOrganizationId(currentUser);
    const visibleOrganizationIds = await this.getVisibleOrganizationIds(currentUser);

    const sources = await this.prisma.knowledgeDocumentSource.findMany({
      where: {
        OR: [
          { organizationId: currentOrganizationId },
          {
            organizationId: { in: visibleOrganizationIds.filter(id => id !== currentOrganizationId) },
            accessScope: 'INHERIT_TO_CHILDREN',
          },
        ],
      },
      include: {
        organization: true,
        sections: {
          select: { id: true },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
        { title: 'asc' },
      ],
    });

    return sources.map(source => ({
      id: source.id,
      title: source.title,
      sourceType: source.sourceType,
      accessScope: source.accessScope,
      status: source.status,
      versionLabel: source.versionLabel,
      effectiveDate: source.effectiveDate?.toISOString() ?? null,
      fileName: source.fileName,
      fileContentType: source.fileContentType,
      fileSizeBytes: source.fileSizeBytes,
      lastExtractedAt: source.lastExtractedAt?.toISOString() ?? null,
      fileUrl: source.fileUrl,
      notes: source.notes,
      organizationId: source.organizationId,
      organizationName: source.organization.name,
      organizationType: source.organization.type,
      sectionCount: source.sections.length,
      canManage: source.organizationId === currentOrganizationId,
      inheritedFromOrganizationName: source.organizationId === currentOrganizationId ? null : source.organization.name,
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    }));
  }

  async createSource(currentUser: any, body: CreateKnowledgeDocumentSourceDto): Promise<KnowledgeDocumentSourceSummary> {
    const currentOrganizationId = this.getCurrentOrganizationId(currentUser);
    const user = await this.prisma.user.findUnique({ where: { email: currentUser.email } });
    if (!user) throw new NotFoundException('Authenticated user not found');

    const accessScope = body.accessScope ?? 'ORGANIZATION_ONLY';
    if (currentUser?.organizationType === 'county_agency' && accessScope === 'INHERIT_TO_CHILDREN') {
      throw new ForbiddenException('County-scoped sources cannot inherit to child organizations');
    }

    const created = await this.prisma.knowledgeDocumentSource.create({
      data: {
        organizationId: currentOrganizationId,
        title: body.title,
        sourceType: body.sourceType,
        accessScope,
        status: body.status ?? 'DRAFT',
        versionLabel: body.versionLabel,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        notes: body.notes,
        createdByUserId: user.id,
      },
      include: {
        organization: true,
        sections: { select: { id: true } },
      },
    });

    await this.recordAuditEvent(currentUser, created, KNOWLEDGE_DOCUMENT_AUDIT_EVENTS.SOURCE_CREATED, 'Created source.', created.sections.length);

    return {
      id: created.id,
      title: created.title,
      sourceType: created.sourceType,
      accessScope: created.accessScope,
      status: created.status,
      versionLabel: created.versionLabel,
      effectiveDate: created.effectiveDate?.toISOString() ?? null,
      fileName: created.fileName,
      fileContentType: created.fileContentType,
      fileSizeBytes: created.fileSizeBytes,
      lastExtractedAt: created.lastExtractedAt?.toISOString() ?? null,
      fileUrl: created.fileUrl,
      notes: created.notes,
      organizationId: created.organizationId,
      organizationName: created.organization.name,
      organizationType: created.organization.type,
      sectionCount: created.sections.length,
      canManage: true,
      inheritedFromOrganizationName: null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateSource(sourceId: string, currentUser: any, body: UpdateKnowledgeDocumentSourceDto): Promise<KnowledgeDocumentSourceSummary> {
    const existing = await this.ensureManageableSource(sourceId, currentUser);

    if (currentUser?.organizationType === 'county_agency' && body.accessScope === 'INHERIT_TO_CHILDREN') {
      throw new ForbiddenException('County-scoped sources cannot inherit to child organizations');
    }

    const updated = await this.prisma.knowledgeDocumentSource.update({
      where: { id: sourceId },
      data: {
        title: body.title ?? undefined,
        sourceType: body.sourceType ?? undefined,
        accessScope: body.accessScope ?? undefined,
        status: body.status ?? undefined,
        versionLabel: body.versionLabel === undefined ? undefined : body.versionLabel || null,
        effectiveDate: body.effectiveDate === undefined ? undefined : (body.effectiveDate ? new Date(body.effectiveDate) : null),
        fileName: body.fileName === undefined ? undefined : body.fileName || null,
        fileUrl: body.fileUrl === undefined ? undefined : body.fileUrl || null,
        notes: body.notes === undefined ? undefined : body.notes || null,
      },
      include: {
        organization: true,
        sections: { select: { id: true } },
      },
    });

    await this.recordAuditEvent(currentUser, updated, KNOWLEDGE_DOCUMENT_AUDIT_EVENTS.SOURCE_UPDATED, 'Updated source metadata.', updated.sections.length);

    return {
      id: updated.id,
      title: updated.title,
      sourceType: updated.sourceType,
      accessScope: updated.accessScope,
      status: updated.status,
      versionLabel: updated.versionLabel,
      effectiveDate: updated.effectiveDate?.toISOString() ?? null,
      fileName: updated.fileName,
      fileContentType: updated.fileContentType,
      fileSizeBytes: updated.fileSizeBytes,
      lastExtractedAt: updated.lastExtractedAt?.toISOString() ?? null,
      fileUrl: updated.fileUrl,
      notes: updated.notes,
      organizationId: updated.organizationId,
      organizationName: updated.organization.name,
      organizationType: updated.organization.type,
      sectionCount: updated.sections.length,
      canManage: updated.organizationId === existing.organizationId,
      inheritedFromOrganizationName: null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteSource(sourceId: string, currentUser: any) {
    const existing = await this.ensureManageableSource(sourceId, currentUser);
    const sectionCount = await this.prisma.knowledgeDocumentSection.count({ where: { knowledgeDocumentSourceId: sourceId } });
    await this.recordAuditEvent(currentUser, existing, KNOWLEDGE_DOCUMENT_AUDIT_EVENTS.SOURCE_DELETED, 'Deleted source.', sectionCount);
    await this.deleteStoredFile(existing.fileStoragePath);
    await this.prisma.knowledgeDocumentSource.delete({ where: { id: sourceId } });
    return { ok: true };
  }

  async listAuditEvents(sourceId: string, currentUser: any): Promise<KnowledgeDocumentAuditEventRecord[]> {
    await this.ensureVisibleSource(sourceId, currentUser);
    const events = await this.prisma.knowledgeDocumentAuditEvent.findMany({
      where: { knowledgeDocumentSourceId: sourceId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    });

    return events.map(event => ({
      id: event.id,
      knowledgeDocumentSourceId: event.knowledgeDocumentSourceId,
      eventType: event.eventType,
      summary: event.summary,
      snapshotTitle: event.snapshotTitle,
      snapshotVersionLabel: event.snapshotVersionLabel,
      snapshotStatus: event.snapshotStatus,
      snapshotSectionCount: event.snapshotSectionCount,
      actorName: event.actor ? `${event.actor.firstName} ${event.actor.lastName}`.trim() : null,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  async listSectionSnapshots(sourceId: string, currentUser: any): Promise<KnowledgeDocumentSectionSnapshotRecord[]> {
    await this.ensureVisibleSource(sourceId, currentUser);
    const snapshots = await this.prisma.knowledgeDocumentSectionSnapshot.findMany({
      where: { knowledgeDocumentSourceId: sourceId },
      orderBy: { versionNumber: 'desc' },
    });

    return snapshots.map(snapshot => ({
      id: snapshot.id,
      versionNumber: snapshot.versionNumber,
      sectionCount: snapshot.sectionCount,
      addedCount: snapshot.addedCount,
      removedCount: snapshot.removedCount,
      updatedCount: snapshot.updatedCount,
      changedHeadings: Array.isArray(snapshot.changedHeadingsJson) ? snapshot.changedHeadingsJson.map(item => String(item)) : [],
      createdAt: snapshot.createdAt.toISOString(),
    }));
  }

  async compareSnapshot(sourceId: string, snapshotId: string, currentUser: any): Promise<KnowledgeDocumentSectionSnapshotCompareResponse> {
    await this.ensureVisibleSource(sourceId, currentUser);
    const snapshot = await this.prisma.knowledgeDocumentSectionSnapshot.findFirst({
      where: { id: snapshotId, knowledgeDocumentSourceId: sourceId },
    });
    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    const previousSnapshot = await this.prisma.knowledgeDocumentSectionSnapshot.findFirst({
      where: {
        knowledgeDocumentSourceId: sourceId,
        versionNumber: { lt: snapshot.versionNumber },
      },
      orderBy: { versionNumber: 'desc' },
    });

    const currentSections = (snapshot.snapshotJson as Array<any>) || [];
    const baseSections = (previousSnapshot?.snapshotJson as Array<any>) || [];
    const previousMap = new Map(baseSections.map(section => [this.buildSectionIdentity(section), section]));
    const currentMap = new Map(currentSections.map(section => [this.buildSectionIdentity(section), section]));
    const changes: KnowledgeDocumentSectionDiffRecord[] = [];

    for (const [key, currentSection] of currentMap.entries()) {
      const previous = previousMap.get(key);
      if (!previous) {
        changes.push({
          heading: currentSection.heading,
          changeType: 'added',
          afterBody: currentSection.body,
          afterPageNumber: currentSection.pageNumber,
        });
        continue;
      }

      if (previous.body !== currentSection.body || previous.pageNumber !== currentSection.pageNumber) {
        changes.push({
          heading: currentSection.heading,
          changeType: 'updated',
          beforeBody: previous.body,
          afterBody: currentSection.body,
          beforePageNumber: previous.pageNumber,
          afterPageNumber: currentSection.pageNumber,
        });
      }
    }

    for (const [key, previousSection] of previousMap.entries()) {
      if (!currentMap.has(key)) {
        changes.push({
          heading: previousSection.heading,
          changeType: 'removed',
          beforeBody: previousSection.body,
          beforePageNumber: previousSection.pageNumber,
        });
      }
    }

    return {
      snapshotId: snapshot.id,
      snapshotVersionNumber: snapshot.versionNumber,
      againstVersionNumber: previousSnapshot?.versionNumber ?? null,
      changes,
    };
  }

  async restoreSnapshot(sourceId: string, snapshotId: string, currentUser: any) {
    const source = await this.ensureManageableSource(sourceId, currentUser);
    const snapshot = await this.prisma.knowledgeDocumentSectionSnapshot.findFirst({
      where: { id: snapshotId, knowledgeDocumentSourceId: sourceId },
    });
    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    const snapshotSections = ((snapshot.snapshotJson as Array<any>) || []).map((section, index) => ({
      heading: section.heading,
      sectionKey: section.sectionKey || null,
      pageNumber: section.pageNumber ?? null,
      sortOrder: section.sortOrder ?? index,
      body: section.body,
    }));

    const previousSections = await this.prisma.knowledgeDocumentSection.findMany({
      where: { knowledgeDocumentSourceId: sourceId },
      orderBy: { sortOrder: 'asc' },
      select: {
        heading: true,
        sectionKey: true,
        pageNumber: true,
        sortOrder: true,
        body: true,
      },
    });

    await this.prisma.$transaction(async tx => {
      await tx.knowledgeDocumentSection.deleteMany({ where: { knowledgeDocumentSourceId: sourceId } });
      if (snapshotSections.length) {
        await tx.knowledgeDocumentSection.createMany({
          data: snapshotSections.map(section => ({
            knowledgeDocumentSourceId: sourceId,
            heading: section.heading,
            sectionKey: section.sectionKey,
            pageNumber: section.pageNumber,
            sortOrder: section.sortOrder,
            body: section.body,
          })),
        });
      }
    });

    const diff = this.calculateSectionDiff(previousSections, snapshotSections);
    const auditEvent = await this.recordAuditEvent(
      currentUser,
      source,
      KNOWLEDGE_DOCUMENT_AUDIT_EVENTS.SNAPSHOT_RESTORED,
      `Restored snapshot version ${snapshot.versionNumber}. ${diff.addedCount} added, ${diff.updatedCount} updated, ${diff.removedCount} removed.`,
      snapshotSections.length,
    );
    await this.createSectionSnapshot(sourceId, auditEvent.id, snapshotSections, diff);

    return { ok: true };
  }

  async listSections(sourceId: string, currentUser: any): Promise<KnowledgeDocumentSectionRecord[]> {
    await this.ensureVisibleSource(sourceId, currentUser);

    const sections = await this.prisma.knowledgeDocumentSection.findMany({
      where: { knowledgeDocumentSourceId: sourceId },
      orderBy: [
        { sortOrder: 'asc' },
        { pageNumber: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return sections.map(section => ({
      id: section.id,
      knowledgeDocumentSourceId: section.knowledgeDocumentSourceId,
      heading: section.heading,
      sectionKey: section.sectionKey,
      pageNumber: section.pageNumber,
      sortOrder: section.sortOrder,
      body: section.body,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    }));
  }

  private async deleteStoredFile(fileStoragePath?: string | null) {
    if (!fileStoragePath) return;
    try {
      await fs.unlink(fileStoragePath);
    } catch {
      // ignore missing files
    }
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  }

  private async storeUploadedFile(sourceId: string, file: { buffer: Buffer; originalname?: string }) {
    const sourceDir = path.join(this.storageRoot(), sourceId);
    await fs.mkdir(sourceDir, { recursive: true });
    const safeName = this.sanitizeFileName(file.originalname || 'uploaded-file');
    const storedFilePath = path.join(sourceDir, `${Date.now()}-${safeName}`);
    await fs.writeFile(storedFilePath, file.buffer);
    return storedFilePath;
  }

  private buildSectionIdentity(section: { heading: string; sectionKey?: string | null }) {
    return `${(section.sectionKey || '').trim().toLowerCase()}::${section.heading.trim().toLowerCase()}`;
  }

  private calculateSectionDiff(previousSections: Array<{ heading: string; sectionKey?: string | null; pageNumber?: number | null; body: string }>, nextSections: Array<{ heading: string; sectionKey?: string | null; pageNumber?: number | null; body: string }>) {
    const previousMap = new Map(previousSections.map(section => [this.buildSectionIdentity(section), section]));
    const nextMap = new Map(nextSections.map(section => [this.buildSectionIdentity(section), section]));

    let addedCount = 0;
    let removedCount = 0;
    let updatedCount = 0;
    const changedHeadings = new Set<string>();

    for (const [key, nextSection] of nextMap.entries()) {
      const previous = previousMap.get(key);
      if (!previous) {
        addedCount += 1;
        changedHeadings.add(nextSection.heading);
        continue;
      }

      if (previous.body !== nextSection.body || previous.pageNumber !== nextSection.pageNumber) {
        updatedCount += 1;
        changedHeadings.add(nextSection.heading);
      }
    }

    for (const [key, previousSection] of previousMap.entries()) {
      if (!nextMap.has(key)) {
        removedCount += 1;
        changedHeadings.add(previousSection.heading);
      }
    }

    return {
      addedCount,
      removedCount,
      updatedCount,
      changedHeadings: Array.from(changedHeadings).slice(0, 12),
    };
  }

  private async createSectionSnapshot(sourceId: string, auditEventId: string | null, sections: Array<{ heading: string; sectionKey?: string | null; pageNumber?: number | null; sortOrder: number; body: string }>, diff: { addedCount: number; removedCount: number; updatedCount: number; changedHeadings: string[] }) {
    const latest = await this.prisma.knowledgeDocumentSectionSnapshot.findFirst({
      where: { knowledgeDocumentSourceId: sourceId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return this.prisma.knowledgeDocumentSectionSnapshot.create({
      data: {
        knowledgeDocumentSourceId: sourceId,
        auditEventId,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        sectionCount: sections.length,
        addedCount: diff.addedCount,
        removedCount: diff.removedCount,
        updatedCount: diff.updatedCount,
        snapshotJson: sections,
        changedHeadingsJson: diff.changedHeadings,
      },
    });
  }

  private looksLikeHeading(line: string) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return false;
    if (/^[0-9]+(\.[0-9]+)*\s+/.test(trimmed)) return true;
    if (/^[A-Z][A-Z\s\-/&]{4,}$/.test(trimmed)) return true;
    if (/^(Section|SECTION|Policy|POLICY|Chapter|CHAPTER)\b/.test(trimmed)) return true;
    if (!/[.!?]$/.test(trimmed) && trimmed.split(/\s+/).length <= 10) return true;
    return false;
  }

  private parseImportedSections(rawText: string): KnowledgeDocumentSectionDraft[] {
    const normalized = rawText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();

    if (!normalized) return [];

    const blocks = normalized
      .split(/\n\s*\n+/)
      .map(block => block.trim())
      .filter(Boolean);

    return blocks.map((block, index) => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      const firstLine = lines[0] || '';
      const headingFromFirstLine = this.looksLikeHeading(firstLine) && lines.length > 1;
      const sectionKeyMatch = firstLine.match(/^([0-9]+(?:\.[0-9]+)*)\s+/);
      const pageMatch = block.match(/(?:^|\s)page\s+(\d{1,4})(?:\s|$)/i);

      return {
        heading: headingFromFirstLine ? firstLine.replace(/^([0-9]+(?:\.[0-9]+)*)\s+/, '').trim() : `Imported Section ${index + 1}`,
        sectionKey: headingFromFirstLine && sectionKeyMatch ? sectionKeyMatch[1] : undefined,
        pageNumber: pageMatch ? Number(pageMatch[1]) : undefined,
        sortOrder: index,
        body: headingFromFirstLine ? lines.slice(1).join('\n').trim() : block,
      };
    }).filter(section => section.body.trim().length > 0);
  }

  previewImportedSections(sourceId: string, currentUser: any, rawText: string): Promise<KnowledgeDocumentSectionDraft[]> {
    return this.ensureManageableSource(sourceId, currentUser).then(() => this.parseImportedSections(rawText));
  }

  async previewExtractedSectionsFromFile(sourceId: string, currentUser: any, file: { buffer: Buffer; mimetype?: string; originalname?: string } | undefined): Promise<KnowledgeDocumentExtractionPreview> {
    await this.ensureManageableSource(sourceId, currentUser);

    if (!file) {
      throw new BadRequestException('A file is required');
    }

    const source = await this.ensureManageableSource(sourceId, currentUser);
    const mimeType = file.mimetype || '';
    const fileName = file.originalname || 'uploaded-file';
    let extractedText = '';

    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      extractedText = parsed.text || '';
      await parser.destroy();
    } else if (
      mimeType.startsWith('text/')
      || /\.(txt|md|markdown|csv|json)$/i.test(fileName)
    ) {
      extractedText = file.buffer.toString('utf8');
    } else {
      throw new BadRequestException('Unsupported file type. Upload a PDF or text-based file.');
    }

    const storedFilePath = await this.storeUploadedFile(sourceId, file);
    await this.deleteStoredFile(source.fileStoragePath);

    const updatedSource = await this.prisma.knowledgeDocumentSource.update({
      where: { id: sourceId },
      data: {
        fileName,
        fileContentType: mimeType || null,
        fileSizeBytes: file.buffer.length,
        fileStoragePath: storedFilePath,
        fileUrl: `/knowledge-base/sources/${sourceId}/file`,
        lastExtractedAt: new Date(),
      },
    });

    const sections = this.parseImportedSections(extractedText);
    await this.recordAuditEvent(currentUser, updatedSource, KNOWLEDGE_DOCUMENT_AUDIT_EVENTS.FILE_UPLOADED, `Uploaded source file ${fileName}.`, sections.length);

    return {
      fileName,
      extractedText,
      sections,
    };
  }

  async getStoredFileForSource(sourceId: string, currentUser: any) {
    const source = await this.ensureVisibleSource(sourceId, currentUser);
    if (!source.fileStoragePath || !source.fileName) {
      throw new NotFoundException('No stored file found for this source');
    }

    return {
      path: source.fileStoragePath,
      fileName: source.fileName,
      contentType: source.fileContentType || 'application/octet-stream',
    };
  }

  async replaceSections(sourceId: string, currentUser: any, body: ReplaceKnowledgeDocumentSectionsDto): Promise<KnowledgeDocumentSectionRecord[]> {
    const source = await this.ensureManageableSource(sourceId, currentUser);
    const previousSections = await this.prisma.knowledgeDocumentSection.findMany({
      where: { knowledgeDocumentSourceId: sourceId },
      orderBy: { sortOrder: 'asc' },
      select: {
        heading: true,
        sectionKey: true,
        pageNumber: true,
        sortOrder: true,
        body: true,
      },
    });

    const normalizedNextSections = body.sections.map((section, index) => ({
      heading: section.heading,
      sectionKey: section.sectionKey,
      pageNumber: section.pageNumber,
      sortOrder: section.sortOrder ?? index,
      body: section.body,
    }));

    await this.prisma.$transaction(async tx => {
      await tx.knowledgeDocumentSection.deleteMany({ where: { knowledgeDocumentSourceId: sourceId } });

      if (normalizedNextSections.length) {
        await tx.knowledgeDocumentSection.createMany({
          data: normalizedNextSections.map(section => ({
            knowledgeDocumentSourceId: sourceId,
            heading: section.heading,
            sectionKey: section.sectionKey,
            pageNumber: section.pageNumber,
            sortOrder: section.sortOrder,
            body: section.body,
          })),
        });
      }
    });

    const diff = this.calculateSectionDiff(previousSections, normalizedNextSections);
    const auditEvent = await this.recordAuditEvent(
      currentUser,
      source,
      KNOWLEDGE_DOCUMENT_AUDIT_EVENTS.SECTIONS_REPLACED,
      `Saved section version with ${normalizedNextSections.length} section${normalizedNextSections.length === 1 ? '' : 's'}. ${diff.addedCount} added, ${diff.updatedCount} updated, ${diff.removedCount} removed.`,
      normalizedNextSections.length,
    );
    await this.createSectionSnapshot(sourceId, auditEvent.id, normalizedNextSections, diff);

    return this.listSections(sourceId, currentUser);
  }
}

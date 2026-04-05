import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const defaultChecklistTemplate = [
  { label: 'Application submitted', requiresDocument: false, requiredDocumentLabel: null },
  { label: 'References collected', requiresDocument: true, requiredDocumentLabel: 'Reference letters' },
  { label: 'Background checks started', requiresDocument: true, requiredDocumentLabel: 'Background check authorization' },
  { label: 'Training scheduled', requiresDocument: false, requiredDocumentLabel: null },
  { label: 'Training completed', requiresDocument: true, requiredDocumentLabel: 'Training certificate' },
  { label: 'Home study started', requiresDocument: false, requiredDocumentLabel: null },
  { label: 'Home study completed', requiresDocument: true, requiredDocumentLabel: 'Home study report' },
  { label: 'Licensing packet reviewed', requiresDocument: true, requiredDocumentLabel: 'Licensing packet' },
];

@Injectable()
export class FosterApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveScopedOrganizationIds(currentUser: any) {
    const organizationId = currentUser.organizationId as string | undefined;
    if (!organizationId) return [] as string[];

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { childOrganizations: true },
    });

    if (!organization) return [] as string[];
    if (organization.type === 'STATE_AGENCY') {
      return organization.childOrganizations.map(item => item.id);
    }

    return [organization.id];
  }

  private normalizeChecklist(items: Array<{ id: string; label: string; requiresDocument: boolean; requiredDocumentLabel: string | null; completed: boolean; sortOrder: number; completedAt: Date | null; documents?: Array<{ id: string; title: string; fileName: string; notes: string | null; contentType: string | null; createdAt: Date }> }> = []) {
    if (items.length) {
      return items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(item => ({
          id: item.id,
          label: item.label,
          requiresDocument: item.requiresDocument,
          requiredDocumentLabel: item.requiredDocumentLabel,
          completed: item.completed,
          sortOrder: item.sortOrder,
          completedAt: item.completedAt,
          documents: (item.documents || []).map(document => ({
            id: document.id,
            title: document.title,
            fileName: document.fileName,
            notes: document.notes,
            contentType: document.contentType,
            createdAt: document.createdAt,
          })),
        }));
    }

    return defaultChecklistTemplate.map((item, index) => ({
      id: `virtual-${index + 1}`,
      label: item.label,
      requiresDocument: item.requiresDocument,
      requiredDocumentLabel: item.requiredDocumentLabel,
      completed: index === 0,
      sortOrder: index,
      completedAt: null,
      documents: [],
    }));
  }

  private calculateChecklistProgress(items: Array<{ completed: boolean }>) {
    if (!items.length) return 0;
    return Math.round((items.filter(item => item.completed).length / items.length) * 100);
  }

  private async resolveCurrentUserId(currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { email: currentUser.email } });
    return user?.id ?? null;
  }

  async list(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);

    const applications = await this.prisma.fosterParentApplication.findMany({
      where: organizationIds.length ? { organizationId: { in: organizationIds } } : undefined,
      include: {
        organization: true,
        assignedToUser: true,
        checklistItems: {
          include: { documents: true },
        },
        timelineEvents: {
          include: { createdBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return applications.map(item => {
      const checklistItems = this.normalizeChecklist(item.checklistItems);
      return {
        id: item.id,
        organizationId: item.organizationId,
        organizationName: item.organization.name,
        householdName: item.householdName,
        primaryApplicant: item.primaryApplicant,
        email: item.email,
        phone: item.phone,
        assignedToUserId: item.assignedToUserId,
        assignedToUserName: item.assignedToUser ? `${item.assignedToUser.firstName} ${item.assignedToUser.lastName}`.trim() : null,
        stage: item.stage,
        checklistProgress: this.calculateChecklistProgress(checklistItems),
        checklistItems,
        timelineEvents: item.timelineEvents.map(event => ({
          id: event.id,
          eventType: event.eventType,
          message: event.message,
          createdAt: event.createdAt,
          createdByName: event.createdBy ? `${event.createdBy.firstName} ${event.createdBy.lastName}`.trim() : null,
        })),
        convertedToUserId: item.convertedToUserId,
        convertedAt: item.convertedAt,
        onboardingStatus: item.onboardingStatus,
        onboardingStatusUpdatedAt: item.onboardingStatusUpdatedAt,
        submittedAt: item.submittedAt,
      };
    });
  }

  async assignableUsers(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const users = await this.prisma.user.findMany({
      where: {
        organizationId: { in: organizationIds },
      },
      include: {
        roleAssignments: {
          where: { active: true },
          include: { roleTemplate: true },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roleAssignments.map(assignment => assignment.roleTemplate.key),
    }));
  }

  async queueSummary(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const applications = await this.prisma.fosterParentApplication.findMany({
      where: organizationIds.length ? { organizationId: { in: organizationIds } } : undefined,
      include: {
        organization: true,
        assignedToUser: true,
      },
    });

    const ageInDays = (submittedAt: Date) => Math.max(0, Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)));
    const slaStatus = (daysOpen: number) => daysOpen > 14 ? 'OVERDUE' : daysOpen >= 7 ? 'WATCH' : 'ON_TRACK';

    const byCountyMap = new Map<string, { organizationId: string; organizationName: string; total: number; approvalReady: number; approved: number; unassigned: number; overdue: number; averageAgeDays: number; totalAgeDays: number; invited: number; activated: number; profileCompleted: number }>();
    const byOwnerMap = new Map<string, { ownerId: string | null; ownerName: string; total: number; approvalReady: number; approved: number; countyCount: number; overdue: number; averageAgeDays: number; totalAgeDays: number; invited: number; activated: number; profileCompleted: number }>();

    for (const application of applications) {
      const daysOpen = ageInDays(application.submittedAt);
      const currentSlaStatus = slaStatus(daysOpen);

      const countyEntry = byCountyMap.get(application.organizationId) ?? {
        organizationId: application.organizationId,
        organizationName: application.organization.name,
        total: 0,
        approvalReady: 0,
        approved: 0,
        unassigned: 0,
        overdue: 0,
        averageAgeDays: 0,
        totalAgeDays: 0,
        invited: 0,
        activated: 0,
        profileCompleted: 0,
      };
      countyEntry.total += 1;
      countyEntry.totalAgeDays += daysOpen;
      if (application.stage === 'READY_FOR_APPROVAL') countyEntry.approvalReady += 1;
      if (application.stage === 'APPROVED') countyEntry.approved += 1;
      if (!application.assignedToUserId) countyEntry.unassigned += 1;
      if (currentSlaStatus === 'OVERDUE') countyEntry.overdue += 1;
      if (application.onboardingStatus === 'INVITED') countyEntry.invited += 1;
      if (application.onboardingStatus === 'ACCOUNT_ACTIVATED') countyEntry.activated += 1;
      if (application.onboardingStatus === 'PROFILE_COMPLETED') countyEntry.profileCompleted += 1;
      byCountyMap.set(application.organizationId, countyEntry);

      const ownerKey = application.assignedToUserId ?? 'unassigned';
      const ownerName = application.assignedToUser
        ? `${application.assignedToUser.firstName} ${application.assignedToUser.lastName}`.trim()
        : 'Unassigned';
      const ownerEntry = byOwnerMap.get(ownerKey) ?? {
        ownerId: application.assignedToUserId ?? null,
        ownerName,
        total: 0,
        approvalReady: 0,
        approved: 0,
        countyCount: 0,
        overdue: 0,
        averageAgeDays: 0,
        totalAgeDays: 0,
        invited: 0,
        activated: 0,
        profileCompleted: 0,
      };
      ownerEntry.total += 1;
      ownerEntry.totalAgeDays += daysOpen;
      if (application.stage === 'READY_FOR_APPROVAL') ownerEntry.approvalReady += 1;
      if (application.stage === 'APPROVED') ownerEntry.approved += 1;
      if (currentSlaStatus === 'OVERDUE') ownerEntry.overdue += 1;
      if (application.onboardingStatus === 'INVITED') ownerEntry.invited += 1;
      if (application.onboardingStatus === 'ACCOUNT_ACTIVATED') ownerEntry.activated += 1;
      if (application.onboardingStatus === 'PROFILE_COMPLETED') ownerEntry.profileCompleted += 1;
      byOwnerMap.set(ownerKey, ownerEntry);
    }

    const byCounty = Array.from(byCountyMap.values())
      .map(item => ({ ...item, averageAgeDays: item.total ? Math.round(item.totalAgeDays / item.total) : 0 }))
      .sort((a, b) => b.total - a.total);
    const byOwner = Array.from(byOwnerMap.values())
      .map(item => ({ ...item, averageAgeDays: item.total ? Math.round(item.totalAgeDays / item.total) : 0 }))
      .sort((a, b) => b.total - a.total);

    const totalOverdue = applications.filter(item => slaStatus(ageInDays(item.submittedAt)) === 'OVERDUE').length;
    const totalWatch = applications.filter(item => slaStatus(ageInDays(item.submittedAt)) === 'WATCH').length;
    const averageAgeDays = applications.length
      ? Math.round(applications.reduce((sum, item) => sum + ageInDays(item.submittedAt), 0) / applications.length)
      : 0;

    return {
      totals: {
        total: applications.length,
        approvalReady: applications.filter(item => item.stage === 'READY_FOR_APPROVAL').length,
        approved: applications.filter(item => item.stage === 'APPROVED').length,
        unassigned: applications.filter(item => !item.assignedToUserId).length,
        overdue: totalOverdue,
        watch: totalWatch,
        averageAgeDays,
        invited: applications.filter(item => item.onboardingStatus === 'INVITED').length,
        activated: applications.filter(item => item.onboardingStatus === 'ACCOUNT_ACTIVATED').length,
        profileCompleted: applications.filter(item => item.onboardingStatus === 'PROFILE_COMPLETED').length,
      },
      byCounty,
      byOwner,
    };
  }

  async syncReminders(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const applications = await this.prisma.fosterParentApplication.findMany({
      where: {
        organizationId: { in: organizationIds },
      },
    });

    const ageInDays = (submittedAt: Date) => Math.max(0, Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24)));
    const reminderTypeForAge = (application: { stage: string; submittedAt: Date }) => {
      if (application.stage === 'APPROVED') return null;
      const daysOpen = ageInDays(application.submittedAt);
      return daysOpen > 14 ? 'OVERDUE' : daysOpen >= 7 ? 'WATCH' : null;
    };

    const openReminders = await this.prisma.fosterApplicationReminder.findMany({
      where: {
        status: 'OPEN',
        reminderType: { in: ['WATCH', 'OVERDUE'] },
        fosterParentApplication: {
          organizationId: { in: organizationIds },
        },
      },
    });

    const applicationMap = new Map(applications.map(application => [application.id, application]));

    for (const reminder of openReminders) {
      const application = applicationMap.get(reminder.fosterParentApplicationId);
      const expectedType = application ? reminderTypeForAge(application) : null;
      if (!expectedType || expectedType !== reminder.reminderType) {
        await this.prisma.fosterApplicationReminder.update({
          where: { id: reminder.id },
          data: { status: 'DISMISSED' },
        });
      }
    }

    for (const application of applications) {
      const reminderType = reminderTypeForAge(application);
      if (!reminderType) continue;

      const existingReminder = await this.prisma.fosterApplicationReminder.findFirst({
        where: {
          fosterParentApplicationId: application.id,
          reminderType,
          status: 'OPEN',
        },
      });

      if (!existingReminder) {
        await this.prisma.fosterApplicationReminder.create({
          data: {
            fosterParentApplicationId: application.id,
            reminderType,
            recipientUserId: application.assignedToUserId,
            message: reminderType === 'OVERDUE'
              ? `${application.householdName} is overdue and needs attention.`
              : `${application.householdName} is approaching the SLA threshold.`,
          },
        });
      }
    }

    return this.listReminders(currentUser);
  }

  async listReminders(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const reminders = await this.prisma.fosterApplicationReminder.findMany({
      where: {
        status: 'OPEN',
        fosterParentApplication: {
          organizationId: { in: organizationIds },
        },
      },
      include: {
        fosterParentApplication: { include: { organization: true } },
        recipientUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reminders.map(reminder => ({
      id: reminder.id,
      reminderType: reminder.reminderType,
      message: reminder.message,
      createdAt: reminder.createdAt,
      householdName: reminder.fosterParentApplication.householdName,
      organizationName: reminder.fosterParentApplication.organization.name,
      applicationId: reminder.fosterParentApplicationId,
      recipientName: reminder.recipientUser ? `${reminder.recipientUser.firstName} ${reminder.recipientUser.lastName}`.trim() : 'Unassigned',
    }));
  }

  async dismissReminder(currentUser: any, reminderId: string) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const reminder = await this.prisma.fosterApplicationReminder.findFirst({
      where: {
        id: reminderId,
        fosterParentApplication: {
          organizationId: { in: organizationIds },
        },
      },
    });

    if (!reminder) throw new Error('Reminder not found in the active organization scope');

    return this.prisma.fosterApplicationReminder.update({
      where: { id: reminderId },
      data: { status: 'DISMISSED' },
    });
  }

  async create(currentUser: any, body: { organizationId?: string; assignedToUserId?: string; householdName: string; primaryApplicant: string; email?: string; phone?: string; checklistProgress?: number; stage?: string }) {
    const allowedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const targetOrganizationId = currentUser.organizationType === 'state_agency'
      ? (body.organizationId || allowedOrganizationIds[0])
      : currentUser.organizationId;

    if (!targetOrganizationId || !allowedOrganizationIds.includes(targetOrganizationId)) {
      throw new Error('Organization is outside the active scope');
    }

    if (body.assignedToUserId) {
      const assignedUser = await this.prisma.user.findFirst({
        where: {
          id: body.assignedToUserId,
          organizationId: targetOrganizationId,
        },
      });
      if (!assignedUser) {
        throw new Error('Assigned owner is outside the active organization scope');
      }
    }

    const initialChecklist = defaultChecklistTemplate.map((item, index) => ({
      label: item.label,
      requiresDocument: item.requiresDocument,
      requiredDocumentLabel: item.requiredDocumentLabel,
      sortOrder: index,
      completed: index === 0,
      completedAt: index === 0 ? new Date() : null,
    }));

    const currentUserId = await this.resolveCurrentUserId(currentUser);

    return this.prisma.$transaction(async tx => {
      const application = await tx.fosterParentApplication.create({
        data: {
          organizationId: targetOrganizationId,
          householdName: body.householdName,
          primaryApplicant: body.primaryApplicant,
          email: body.email,
          phone: body.phone,
          assignedToUserId: body.assignedToUserId,
          checklistProgress: this.calculateChecklistProgress(initialChecklist),
          stage: (body.stage as any) ?? 'SUBMITTED',
          checklistItems: {
            create: initialChecklist,
          },
        },
        include: { organization: true, checklistItems: true },
      });

      await tx.fosterApplicationTimelineEvent.create({
        data: {
          fosterParentApplicationId: application.id,
          eventType: 'APPLICATION_CREATED',
          message: `Application created for ${body.householdName}.`,
          createdByUserId: currentUserId,
        },
      });

      if (body.assignedToUserId) {
        await tx.fosterApplicationReminder.create({
          data: {
            fosterParentApplicationId: application.id,
            reminderType: 'ASSIGNMENT',
            recipientUserId: body.assignedToUserId,
            message: `${body.householdName} has been assigned to you.`,
          },
        });
      }

      return application;
    });
  }

  async update(currentUser: any, id: string, body: { householdName?: string; primaryApplicant?: string; email?: string; phone?: string; assignedToUserId?: string | null; onboardingStatus?: string; checklistProgress?: number; stage?: string; checklistItems?: Array<{ id?: string; label: string; completed: boolean; requiresDocument?: boolean; requiredDocumentLabel?: string | null }> }) {
    const allowedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const existing = await this.prisma.fosterParentApplication.findFirst({
      where: {
        id,
        organizationId: { in: allowedOrganizationIds },
      },
    });

    if (!existing) {
      throw new Error('Application not found in the active organization scope');
    }

    if (body.assignedToUserId) {
      const assignedUser = await this.prisma.user.findFirst({
        where: {
          id: body.assignedToUserId,
          organizationId: existing.organizationId,
        },
      });
      if (!assignedUser) {
        throw new Error('Assigned owner is outside the active organization scope');
      }
    }

    const existingChecklistRecords = await this.prisma.fosterApplicationChecklistItem.findMany({
      where: { fosterParentApplicationId: id },
      include: { documents: true },
      orderBy: { sortOrder: 'asc' },
    });

    const nextChecklistItems = body.checklistItems?.length
      ? body.checklistItems.map((item, index) => ({
          id: item.id,
          label: item.label,
          requiresDocument: Boolean(item.requiresDocument),
          requiredDocumentLabel: item.requiredDocumentLabel ?? null,
          completed: item.completed,
          sortOrder: index,
          completedAt: item.completed ? new Date() : null,
          documents: existingChecklistRecords.find(record => record.id === item.id)?.documents || [],
        }))
      : this.normalizeChecklist(existingChecklistRecords.map(item => ({
          id: item.id,
          label: item.label,
          requiresDocument: item.requiresDocument,
          requiredDocumentLabel: item.requiredDocumentLabel,
          completed: item.completed,
          sortOrder: item.sortOrder,
          completedAt: item.completedAt,
          documents: item.documents,
        })));

    const currentUserId = await this.resolveCurrentUserId(currentUser);

    return this.prisma.$transaction(async tx => {
      if (body.checklistItems?.length) {
        for (const item of nextChecklistItems) {
          const attachedDocumentCount = item.documents?.length || 0;
          if (item.completed && item.requiresDocument && attachedDocumentCount === 0) {
            throw new Error(`${item.label} requires an attached document before it can be marked complete`);
          }

          if (item.id) {
            await tx.fosterApplicationChecklistItem.update({
              where: { id: item.id },
              data: {
                label: item.label,
                requiresDocument: item.requiresDocument,
                requiredDocumentLabel: item.requiredDocumentLabel,
                completed: item.completed,
                sortOrder: item.sortOrder,
                completedAt: item.completedAt,
              },
            });
          } else {
            await tx.fosterApplicationChecklistItem.create({
              data: {
                fosterParentApplicationId: id,
                label: item.label,
                requiresDocument: item.requiresDocument,
                requiredDocumentLabel: item.requiredDocumentLabel,
                completed: item.completed,
                sortOrder: item.sortOrder,
                completedAt: item.completedAt,
              },
            });
          }
        }
      }

      const updated = await tx.fosterParentApplication.update({
        where: { id },
        data: {
          householdName: body.householdName,
          primaryApplicant: body.primaryApplicant,
          email: body.email,
          phone: body.phone,
          assignedToUserId: body.assignedToUserId,
          onboardingStatus: body.onboardingStatus ? (body.onboardingStatus as any) : undefined,
          onboardingStatusUpdatedAt: body.onboardingStatus ? new Date() : undefined,
          checklistProgress: this.calculateChecklistProgress(nextChecklistItems),
          stage: body.stage ? (body.stage as any) : undefined,
        },
        include: { organization: true, checklistItems: true },
      });

      const completedCount = nextChecklistItems.filter(item => item.completed).length;
      const totalCount = nextChecklistItems.length;
      const nextAssignedUser = body.assignedToUserId
        ? await tx.user.findUnique({ where: { id: body.assignedToUserId } })
        : null;
      const ownershipChanged = body.assignedToUserId !== undefined && body.assignedToUserId !== existing.assignedToUserId;
      const onboardingChanged = body.onboardingStatus !== undefined && body.onboardingStatus !== existing.onboardingStatus;
      const stageMessage = body.stage && body.stage !== existing.stage
        ? `Stage changed from ${existing.stage.replace(/_/g, ' ')} to ${body.stage.replace(/_/g, ' ')}.`
        : ownershipChanged
          ? `Ownership changed to ${nextAssignedUser ? `${nextAssignedUser.firstName} ${nextAssignedUser.lastName}`.trim() : 'Unassigned'}.`
          : onboardingChanged
            ? `Onboarding status changed from ${existing.onboardingStatus.replace(/_/g, ' ')} to ${body.onboardingStatus?.replace(/_/g, ' ')}.`
            : `Checklist updated. ${completedCount} of ${totalCount} items completed.`;

      await tx.fosterApplicationTimelineEvent.create({
        data: {
          fosterParentApplicationId: id,
          eventType: body.stage && body.stage !== existing.stage ? 'STAGE_UPDATED' : ownershipChanged ? 'OWNERSHIP_UPDATED' : onboardingChanged ? 'ONBOARDING_UPDATED' : 'CHECKLIST_UPDATED',
          message: stageMessage,
          createdByUserId: currentUserId,
        },
      });

      if (ownershipChanged) {
        await tx.fosterApplicationReminder.updateMany({
          where: {
            fosterParentApplicationId: id,
            reminderType: 'ASSIGNMENT',
            status: 'OPEN',
          },
          data: { status: 'DISMISSED' },
        });
      }

      if (ownershipChanged && body.assignedToUserId) {
        await tx.fosterApplicationReminder.create({
          data: {
            fosterParentApplicationId: id,
            reminderType: 'ASSIGNMENT',
            recipientUserId: body.assignedToUserId,
            message: `${updated.householdName} has been assigned to you.`,
          },
        });
      }

      return updated;
    });
  }

  async bulkUpdate(currentUser: any, body: { ids: string[]; stage?: string; assignedToUserId?: string | null; onboardingStatus?: string }) {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length) {
      throw new Error('At least one application id is required for bulk update');
    }

    const results = [] as any[];
    for (const id of ids) {
      const updated = await this.update(currentUser, id, {
        stage: body.stage,
        assignedToUserId: body.assignedToUserId,
        onboardingStatus: body.onboardingStatus,
      });
      results.push(updated);
    }

    return results;
  }

  async attachChecklistDocument(currentUser: any, checklistItemId: string, body: { title: string; fileName: string; notes?: string; contentType?: string }) {
    const allowedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const user = await this.prisma.user.findUnique({ where: { email: currentUser.email } });
    if (!user) throw new Error('Authenticated user not found');

    const checklistItem = await this.prisma.fosterApplicationChecklistItem.findFirst({
      where: {
        id: checklistItemId,
        fosterParentApplication: {
          organizationId: { in: allowedOrganizationIds },
        },
      },
    });

    if (!checklistItem) {
      throw new Error('Checklist item not found in the active organization scope');
    }

    return this.prisma.$transaction(async tx => {
      const document = await tx.fosterApplicationChecklistDocument.create({
        data: {
          fosterApplicationChecklistItemId: checklistItemId,
          title: body.title,
          fileName: body.fileName,
          notes: body.notes,
          contentType: body.contentType,
          uploadedByUserId: user.id,
        },
      });

      await tx.fosterApplicationTimelineEvent.create({
        data: {
          fosterParentApplicationId: checklistItem.fosterParentApplicationId,
          eventType: 'CHECKLIST_DOCUMENT_ATTACHED',
          message: `Attached ${body.fileName} to checklist item ${checklistItem.label}.`,
          createdByUserId: user.id,
        },
      });

      return document;
    });
  }

  async convertToFosterParent(currentUser: any, id: string) {
    const allowedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const application = await this.prisma.fosterParentApplication.findFirst({
      where: {
        id,
        organizationId: { in: allowedOrganizationIds },
      },
    });

    if (!application) {
      throw new Error('Application not found in the active organization scope');
    }

    if (application.stage !== 'APPROVED') {
      throw new Error('Only approved applications can be converted');
    }

    if (!application.email) {
      throw new Error('An email address is required before conversion to foster parent portal access');
    }

    if (application.convertedToUserId) {
      return this.prisma.user.findUnique({ where: { id: application.convertedToUserId } });
    }

    const [firstName, ...rest] = application.primaryApplicant.trim().split(/\s+/);
    const lastName = rest.join(' ') || application.householdName;
    const roleTemplate = await this.prisma.roleTemplate.findUnique({ where: { key: 'resource_parent' } });
    if (!roleTemplate) {
      throw new Error('Resource parent role template not found');
    }

    return this.prisma.$transaction(async tx => {
      const existingUser = await tx.user.findUnique({ where: { email: application.email! } });
      const fosterParentUser = existingUser ?? await tx.user.create({
        data: {
          organizationId: application.organizationId,
          firstName: firstName || application.householdName,
          lastName,
          email: application.email!,
          phone: application.phone,
          status: 'INVITED',
        },
      });

      await tx.userRoleAssignment.upsert({
        where: {
          userId_roleTemplateId: {
            userId: fosterParentUser.id,
            roleTemplateId: roleTemplate.id,
          },
        },
        update: { active: true },
        create: {
          userId: fosterParentUser.id,
          roleTemplateId: roleTemplate.id,
          active: true,
        },
      });

      await tx.fosterParentApplication.update({
        where: { id },
        data: {
          convertedToUserId: fosterParentUser.id,
          convertedAt: new Date(),
          onboardingStatus: 'INVITED',
          onboardingStatusUpdatedAt: new Date(),
        },
      });

      await tx.fosterApplicationTimelineEvent.create({
        data: {
          fosterParentApplicationId: id,
          eventType: 'CONVERTED_TO_FOSTER_PARENT',
          message: `Application converted to foster parent portal access for ${fosterParentUser.email}.`,
          createdByUserId: currentUser.id,
        },
      });

      return fosterParentUser;
    });
  }
}

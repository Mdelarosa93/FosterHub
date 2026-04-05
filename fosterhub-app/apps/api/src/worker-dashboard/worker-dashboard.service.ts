import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkerDashboardService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  private async resolveScopedOrganizationIds(currentUser: any) {
    const organizationId = currentUser.organizationId as string | undefined;
    if (!organizationId) return [] as string[];

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { childOrganizations: true },
    });

    if (!organization) return [] as string[];

    if (organization.type === 'STATE_AGENCY') {
      return [organization.id, ...organization.childOrganizations.map(item => item.id)];
    }

    return [organization.id];
  }

  async summary(currentUser: any) {
    const email = currentUser.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Authenticated user not found');

    const role = String(currentUser.role || 'worker');
    const scopedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const hasOrganizationScope = ['state_super_admin', 'county_admin', 'admin', 'manager'].includes(role);

    const [assignedCases, intakeRecords, pendingRequests] = await Promise.all([
      hasOrganizationScope
        ? this.prisma.case.count({ where: { organizationId: { in: scopedOrganizationIds } } })
        : this.prisma.caseAssignment.count({ where: { userId: user.id } }),
      hasOrganizationScope
        ? this.prisma.intakeRecord.count({ where: { organizationId: { in: scopedOrganizationIds } } })
        : this.prisma.intakeRecord.count({ where: { assignedWorkerUserId: user.id } }),
      this.prisma.serviceRequest.count({
        where: hasOrganizationScope
          ? { status: 'SUBMITTED', case: { organizationId: { in: scopedOrganizationIds } } }
          : { status: 'SUBMITTED' },
      }),
    ]);

    return {
      assignedCases,
      assignedIntakeRecords: intakeRecords,
      pendingRequests,
      organizationScope: scopedOrganizationIds.length,
      organizationType: currentUser.organizationType ?? null,
      organizationName: currentUser.organizationName ?? null,
    };
  }

  async myCases(currentUser: any) {
    const email = currentUser.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Authenticated user not found');

    const role = String(currentUser.role || 'worker');
    const scopedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const hasOrganizationScope = ['state_super_admin', 'county_admin', 'admin', 'manager'].includes(role);

    if (hasOrganizationScope) {
      const cases = await this.prisma.case.findMany({
        where: { organizationId: { in: scopedOrganizationIds } },
        include: { child: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return cases.map(item => ({
        assignmentId: `org-scope-${item.id}`,
        roleLabel: role === 'state_super_admin' ? 'State oversight' : 'County oversight',
        caseId: item.id,
        caseStatus: item.status,
        childFirstName: item.child.firstName,
        childLastName: item.child.lastName,
      }));
    }

    const assignments = await this.prisma.caseAssignment.findMany({
      where: { userId: user.id },
      include: {
        case: {
          include: {
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map(assignment => ({
      assignmentId: assignment.id,
      roleLabel: assignment.roleLabel,
      caseId: assignment.case.id,
      caseStatus: assignment.case.status,
      childFirstName: assignment.case.child.firstName,
      childLastName: assignment.case.child.lastName,
    }));
  }

  async pendingRequests(currentUser?: any) {
    const scopedOrganizationIds = currentUser ? await this.resolveScopedOrganizationIds(currentUser) : [];
    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        status: 'SUBMITTED',
        ...(scopedOrganizationIds.length ? { case: { organizationId: { in: scopedOrganizationIds } } } : {}),
      },
      include: {
        case: {
          include: {
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(request => ({
      id: request.id,
      title: request.title,
      status: request.status,
      caseId: request.caseId,
      childFirstName: request.case.child.firstName,
      childLastName: request.case.child.lastName,
    }));
  }
}

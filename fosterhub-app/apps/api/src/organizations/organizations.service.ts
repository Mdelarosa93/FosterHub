import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async tree(currentUser: any) {
    const currentOrganizationId = currentUser.organizationId as string | undefined;
    const currentOrganization = currentOrganizationId
      ? await this.prisma.organization.findUnique({
          where: { id: currentOrganizationId },
          include: {
            parentOrganization: true,
            childOrganizations: true,
          },
        })
      : null;

    const scopeRootId = currentOrganization?.type === 'COUNTY_AGENCY'
      ? currentOrganization.parentOrganizationId ?? currentOrganization.id
      : currentOrganization?.id;

    const organizations = await this.prisma.organization.findMany({
      where: scopeRootId
        ? {
            OR: [
              { id: scopeRootId },
              { parentOrganizationId: scopeRootId },
            ],
          }
        : undefined,
      include: {
        childOrganizations: true,
        _count: {
          select: {
            users: true,
            cases: true,
            fosterParentApplications: true,
            vendors: true,
            travelApprovals: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return organizations.map(organization => ({
      id: organization.id,
      name: organization.name,
      type: organization.type,
      code: organization.code,
      parentOrganizationId: organization.parentOrganizationId,
      childOrganizationCount: organization.childOrganizations.length,
      totalUsers: organization._count.users,
      totalCases: organization._count.cases,
      fosterParentApplications: organization._count.fosterParentApplications,
      approvedVendors: organization._count.vendors,
      travelApprovalsPending: organization._count.travelApprovals,
    }));
  }

  async currentContext(currentUser: any) {
    if (!currentUser.organizationId) {
      return null;
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      include: {
        parentOrganization: true,
        childOrganizations: true,
      },
    });

    if (!organization) return null;

    return {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      code: organization.code,
      parentOrganization: organization.parentOrganization
        ? {
            id: organization.parentOrganization.id,
            name: organization.parentOrganization.name,
            type: organization.parentOrganization.type,
          }
        : null,
      childOrganizations: organization.childOrganizations.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
      })),
    };
  }
}

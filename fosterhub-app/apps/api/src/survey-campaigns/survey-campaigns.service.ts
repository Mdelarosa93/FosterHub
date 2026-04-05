import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SurveyCampaignsService {
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
      return [organization.id, ...organization.childOrganizations.map(item => item.id)];
    }

    return [organization.id];
  }

  async list(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);

    const campaigns = await this.prisma.surveyCampaign.findMany({
      where: organizationIds.length ? { organizationId: { in: organizationIds } } : undefined,
      include: { organization: true, responses: true },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map(item => ({
      id: item.id,
      organizationId: item.organizationId,
      organizationName: item.organization.name,
      name: item.name,
      audience: item.audience,
      cadence: item.cadence,
      baseline: item.baseline,
      status: item.status,
      responseRate: item.responses.length ? 100 : 0,
      averageScore: item.responses.length
        ? Math.round(item.responses.reduce((sum, response) => sum + (response.rating ?? 0), 0) / item.responses.length)
        : 0,
    }));
  }

  async create(currentUser: any, body: { organizationId?: string; name: string; audience: string; cadence?: string; baseline?: boolean; status?: string }) {
    const allowedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const targetOrganizationId = currentUser.organizationType === 'state_agency'
      ? (body.organizationId || currentUser.organizationId)
      : currentUser.organizationId;

    if (!targetOrganizationId || !allowedOrganizationIds.includes(targetOrganizationId)) {
      throw new Error('Organization is outside the active scope');
    }

    return this.prisma.surveyCampaign.create({
      data: {
        organizationId: targetOrganizationId,
        name: body.name,
        audience: body.audience,
        cadence: body.cadence,
        baseline: Boolean(body.baseline),
        status: (body.status as any) ?? 'DRAFT',
      },
      include: { organization: true, responses: true },
    });
  }
}

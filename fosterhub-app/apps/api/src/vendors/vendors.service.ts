import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
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

  async list(currentUser: any) {
    const organizationIds = await this.resolveScopedOrganizationIds(currentUser);

    const vendors = await this.prisma.vendor.findMany({
      where: organizationIds.length ? { organizationId: { in: organizationIds } } : undefined,
      include: { organization: true, invoices: true },
      orderBy: { createdAt: 'desc' },
    });

    return vendors.map(item => ({
      id: item.id,
      organizationId: item.organizationId,
      organizationName: item.organization.name,
      name: item.name,
      category: item.category,
      city: item.city,
      status: item.status,
      referredBy: item.referredBy,
      invoiceCount: item.invoices.length,
      paymentStatus: item.invoices[0]?.status ?? 'SUBMITTED',
    }));
  }

  async create(currentUser: any, body: { organizationId?: string; name: string; category: string; city?: string; referredBy?: string; status?: string }) {
    const allowedOrganizationIds = await this.resolveScopedOrganizationIds(currentUser);
    const targetOrganizationId = currentUser.organizationType === 'state_agency'
      ? (body.organizationId || allowedOrganizationIds[0])
      : currentUser.organizationId;

    if (!targetOrganizationId || !allowedOrganizationIds.includes(targetOrganizationId)) {
      throw new Error('Organization is outside the active scope');
    }

    return this.prisma.vendor.create({
      data: {
        organizationId: targetOrganizationId,
        name: body.name,
        category: body.category,
        city: body.city,
        referredBy: body.referredBy,
        status: (body.status as any) ?? 'RECOMMENDED',
      },
      include: { organization: true, invoices: true },
    });
  }
}

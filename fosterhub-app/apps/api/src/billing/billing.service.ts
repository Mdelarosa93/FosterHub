import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { BillingPortalResponse } from '@fosterhub/types';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBillingContactDto } from './dto/update-billing-contact.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { ChangeBillingPlanDto } from './dto/change-billing-plan.dto';
import { UpdateCountyAllocationDto } from './dto/update-county-allocation.dto';
import { UpdateSubscriptionModuleDto } from './dto/update-subscription-module.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private buildPlanRecord(plan: any, allModules: any[]) {
    const includedModules = plan.planModules
      .filter((item: any) => item.included)
      .map((item: any) => ({
        id: item.billingModule.id,
        code: item.billingModule.code,
        name: item.billingModule.name,
        description: item.billingModule.description,
        category: item.billingModule.category,
      }));

    const includedModuleIds = new Set(includedModules.map((item: any) => item.id));
    const optionalModules = allModules
      .filter((moduleRecord: any) => !includedModuleIds.has(moduleRecord.id))
      .map((moduleRecord: any) => ({
        id: moduleRecord.id,
        code: moduleRecord.code,
        name: moduleRecord.name,
        description: moduleRecord.description,
        category: moduleRecord.category,
      }));

    return {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      description: plan.description,
      billingInterval: plan.billingInterval,
      basePriceCents: plan.basePriceCents,
      perSeatPriceCents: plan.perSeatPriceCents,
      countyIncludedCount: plan.countyIncludedCount,
      additionalCountyPriceCents: plan.additionalCountyPriceCents,
      active: plan.active,
      includedModules,
      optionalModules,
    };
  }

  private async getStateManagedSubscription(currentUser: any) {
    const currentOrganizationId = currentUser?.organizationId;
    if (!currentOrganizationId) throw new NotFoundException('Active organization context is required');

    if (currentUser?.organizationType === 'county_agency') {
      const allocation = await this.prisma.subscriptionCountyAllocation.findFirst({
        where: { countyOrganizationId: currentOrganizationId, status: { in: ['ACTIVE', 'PENDING'] } },
        include: { organizationSubscription: true },
      });
      if (!allocation) throw new NotFoundException('No billing allocation found for this county');
      return allocation.organizationSubscription;
    }

    const subscription = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId: currentOrganizationId, status: { in: ['TRIALING', 'ACTIVE', 'PAST_DUE'] } },
    });
    if (!subscription) throw new NotFoundException('No subscription found for this organization');
    return subscription;
  }

  private async getManageableSubscription(currentUser: any) {
    if (currentUser?.organizationType === 'county_agency') {
      throw new ForbiddenException('Billing changes are managed at the state level');
    }
    return this.getStateManagedSubscription(currentUser);
  }

  private async loadSubscriptionGraph(subscriptionId: string) {
    return this.prisma.organizationSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: true,
        billingPlan: { include: { planModules: { include: { billingModule: true } } } },
        modules: { include: { billingModule: true } },
        paymentMethods: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
        invoices: { orderBy: { issuedAt: 'desc' }, take: 12 },
        countyAllocations: { include: { countyOrganization: true }, orderBy: { createdAt: 'asc' } },
        auditEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  private async recordAuditEvent(currentUser: any, subscriptionId: string, eventType: any, summary: string, metadataJson?: object) {
    const subscription = await this.prisma.organizationSubscription.findUnique({
      where: { id: subscriptionId },
      include: { billingPlan: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    await this.prisma.billingAuditEvent.create({
      data: {
        organizationSubscriptionId: subscription.id,
        organizationId: subscription.organizationId,
        actorUserId: currentUser?.id ?? null,
        eventType,
        summary,
        snapshotPlanName: subscription.billingPlan.name,
        snapshotStatus: subscription.status,
        snapshotTotalCents: subscription.totalCents,
        metadataJson,
      },
    });
  }

  private buildPlanChangeAuditMetadata(subscription: any, currentPlan: any, targetPlan: any) {
    const delta = targetPlan.basePriceCents - currentPlan.basePriceCents;
    const countyCoverageDelta = targetPlan.countyIncludedCount - currentPlan.countyIncludedCount;
    const seatPriceDelta = targetPlan.perSeatPriceCents - currentPlan.perSeatPriceCents;
    const currentCoveredCounties = subscription.countyCountCovered;
    const currentPurchasedSeats = subscription.seatCountPurchased;
    const currentCountyOverage = Math.max(0, currentCoveredCounties - currentPlan.countyIncludedCount);
    const targetCountyOverage = Math.max(0, currentCoveredCounties - targetPlan.countyIncludedCount);
    const currentEstimatedRecurringCents = currentPlan.basePriceCents + (currentPurchasedSeats * currentPlan.perSeatPriceCents) + (currentCountyOverage * currentPlan.additionalCountyPriceCents);
    const targetEstimatedRecurringCents = targetPlan.basePriceCents + (currentPurchasedSeats * targetPlan.perSeatPriceCents) + (targetCountyOverage * targetPlan.additionalCountyPriceCents);
    const estimatedRecurringDelta = targetEstimatedRecurringCents - currentEstimatedRecurringCents;
    const currentIncludedIds = new Set(currentPlan.includedModules.map((item: any) => item.id));
    const targetIncludedIds = new Set(targetPlan.includedModules.map((item: any) => item.id));
    const addedModules = targetPlan.includedModules.filter((item: any) => !currentIncludedIds.has(item.id)).map((item: any) => item.name);
    const removedModules = currentPlan.includedModules.filter((item: any) => !targetIncludedIds.has(item.id)).map((item: any) => item.name);
    const retainedModules = targetPlan.includedModules.filter((item: any) => currentIncludedIds.has(item.id)).map((item: any) => item.name);

    const moduleChangeSummary = addedModules.length
      ? `adds ${addedModules.join(', ')}`
      : removedModules.length
        ? `removes ${removedModules.join(', ')}`
        : 'keeps the same included module set';
    const countyChangeSummary = countyCoverageDelta === 0
      ? 'keeps county coverage the same'
      : countyCoverageDelta > 0
        ? `adds ${countyCoverageDelta} included ${countyCoverageDelta === 1 ? 'county' : 'counties'}`
        : `reduces included county coverage by ${Math.abs(countyCoverageDelta)}`;
    const seatChangeSummary = seatPriceDelta === 0
      ? 'keeps seat pricing the same'
      : seatPriceDelta > 0
        ? `raises seat pricing by $${(seatPriceDelta / 100).toFixed(2)}`
        : `lowers seat pricing by $${(Math.abs(seatPriceDelta) / 100).toFixed(2)}`;
    const estimateSummary = estimatedRecurringDelta === 0
      ? 'with no estimated recurring cost change at current usage.'
      : `${estimatedRecurringDelta > 0 ? 'and increases' : 'and lowers'} estimated recurring cost by $${(Math.abs(estimatedRecurringDelta) / 100).toFixed(2)} at current usage.`;

    return {
      reviewSummary: `Switching to ${targetPlan.name} ${moduleChangeSummary}, ${countyChangeSummary}, ${seatChangeSummary}, ${estimateSummary}`,
      currentPlan: {
        id: currentPlan.id,
        name: currentPlan.name,
        basePriceCents: currentPlan.basePriceCents,
        perSeatPriceCents: currentPlan.perSeatPriceCents,
        countyIncludedCount: currentPlan.countyIncludedCount,
        additionalCountyPriceCents: currentPlan.additionalCountyPriceCents,
      },
      targetPlan: {
        id: targetPlan.id,
        name: targetPlan.name,
        basePriceCents: targetPlan.basePriceCents,
        perSeatPriceCents: targetPlan.perSeatPriceCents,
        countyIncludedCount: targetPlan.countyIncludedCount,
        additionalCountyPriceCents: targetPlan.additionalCountyPriceCents,
      },
      usageSnapshot: {
        seatCountPurchased: currentPurchasedSeats,
        countyCountCovered: currentCoveredCounties,
      },
      deltas: {
        basePriceDeltaCents: delta,
        countyCoverageDelta,
        seatPriceDeltaCents: seatPriceDelta,
        currentEstimatedRecurringCents,
        targetEstimatedRecurringCents,
        estimatedRecurringDeltaCents: estimatedRecurringDelta,
        addedModules,
        retainedModules,
        removedModules,
      },
    };
  }

  private async buildPortalFromSubscription(subscriptionId: string, scope: 'state' | 'county', organizationName: string, managedByOrganizationName: string | null): Promise<BillingPortalResponse> {
    const subscription = await this.loadSubscriptionGraph(subscriptionId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    const plans = await this.prisma.billingPlan.findMany({
      where: { active: true },
      include: { planModules: { include: { billingModule: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const allModules = await this.prisma.billingModule.findMany({
      where: { active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const paymentMethod = subscription.paymentMethods[0] || null;

    return {
      scope,
      organizationName,
      managedByOrganizationName,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        renewalDate: subscription.renewalDate?.toISOString() ?? null,
        seatCountPurchased: subscription.seatCountPurchased,
        seatCountInUse: subscription.seatCountInUse,
        countyCountCovered: subscription.countyCountCovered,
        billingContactName: subscription.billingContactName,
        billingContactEmail: subscription.billingContactEmail,
        billingContactPhone: subscription.billingContactPhone,
        currency: subscription.currency,
        subtotalCents: subscription.subtotalCents,
        discountCents: subscription.discountCents,
        taxCents: subscription.taxCents,
        totalCents: subscription.totalCents,
        notes: subscription.notes,
        plan: this.buildPlanRecord(subscription.billingPlan, allModules),
        enabledModules: subscription.modules.map(item => ({ id: item.billingModuleId, name: item.billingModule.name, description: item.billingModule.description, category: item.billingModule.category, enabled: item.enabled })),
        paymentMethod: paymentMethod ? {
          brand: paymentMethod.brand,
          last4: paymentMethod.last4,
          expMonth: paymentMethod.expMonth,
          expYear: paymentMethod.expYear,
          billingName: paymentMethod.billingName,
          billingEmail: paymentMethod.billingEmail,
        } : null,
      },
      plans: plans.map(plan => this.buildPlanRecord(plan, allModules)),
      invoices: subscription.invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issuedAt: invoice.issuedAt.toISOString(),
        dueAt: invoice.dueAt?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        totalCents: invoice.totalCents,
        currency: invoice.currency,
      })),
      countyAllocations: subscription.countyAllocations.map(allocation => ({
        id: allocation.id,
        countyOrganizationId: allocation.countyOrganizationId,
        countyOrganizationName: allocation.countyOrganization.name,
        status: allocation.status,
        seatLimit: allocation.seatLimit,
        seatInUse: allocation.seatInUse,
        startsAt: allocation.startsAt.toISOString(),
        endsAt: allocation.endsAt?.toISOString() ?? null,
      })),
      auditEvents: subscription.auditEvents.map(event => ({
        id: event.id,
        eventType: event.eventType,
        summary: event.summary,
        snapshotPlanName: event.snapshotPlanName,
        snapshotStatus: event.snapshotStatus,
        snapshotTotalCents: event.snapshotTotalCents,
        actorName: event.actor ? `${event.actor.firstName} ${event.actor.lastName}`.trim() : null,
        metadataJson: (event.metadataJson as any) ?? null,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

  async getPortal(currentUser: any): Promise<BillingPortalResponse> {
    const currentOrganizationId = currentUser?.organizationId;
    if (!currentOrganizationId) throw new NotFoundException('Active organization context is required');

    if (currentUser?.organizationType === 'county_agency') {
      const allocation = await this.prisma.subscriptionCountyAllocation.findFirst({
        where: { countyOrganizationId: currentOrganizationId, status: { in: ['ACTIVE', 'PENDING'] } },
        include: { countyOrganization: true, organizationSubscription: { include: { organization: true } } },
      });
      if (!allocation) throw new NotFoundException('No billing allocation found for this county');
      return this.buildPortalFromSubscription(
        allocation.organizationSubscriptionId,
        'county',
        allocation.countyOrganization.name,
        allocation.organizationSubscription.organization.name,
      );
    }

    const subscription = await this.getStateManagedSubscription(currentUser);
    const organization = await this.prisma.organization.findUnique({ where: { id: subscription.organizationId } });
    return this.buildPortalFromSubscription(subscription.id, 'state', organization?.name || 'State organization', null);
  }

  async updateBillingContact(currentUser: any, body: UpdateBillingContactDto) {
    const subscription = await this.getManageableSubscription(currentUser);
    const previousContact = {
      billingContactName: subscription.billingContactName ?? null,
      billingContactEmail: subscription.billingContactEmail ?? null,
      billingContactPhone: subscription.billingContactPhone ?? null,
    };
    const nextContact = {
      billingContactName: body.billingContactName ?? null,
      billingContactEmail: body.billingContactEmail ?? null,
      billingContactPhone: body.billingContactPhone ?? null,
    };

    await this.prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: nextContact,
    });
    await this.recordAuditEvent(currentUser, subscription.id, 'CONTACT_UPDATED', 'Updated billing contact information.', {
      previousBillingContactName: previousContact.billingContactName,
      newBillingContactName: nextContact.billingContactName,
      previousBillingContactEmail: previousContact.billingContactEmail,
      newBillingContactEmail: nextContact.billingContactEmail,
      previousBillingContactPhone: previousContact.billingContactPhone,
      newBillingContactPhone: nextContact.billingContactPhone,
    });
    return this.getPortal(currentUser);
  }

  async updatePaymentMethod(currentUser: any, body: UpdatePaymentMethodDto) {
    const subscription = await this.getManageableSubscription(currentUser);
    const existingDefault = await this.prisma.paymentMethod.findFirst({
      where: { organizationSubscriptionId: subscription.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    const previousPayment = {
      brand: existingDefault?.brand ?? null,
      last4: existingDefault?.last4 ?? null,
      expMonth: existingDefault?.expMonth ?? null,
      expYear: existingDefault?.expYear ?? null,
      billingName: existingDefault?.billingName ?? null,
      billingEmail: existingDefault?.billingEmail ?? null,
    };
    const nextPayment = {
      provider: (body.provider?.toUpperCase() as any) || existingDefault?.provider || 'STRIPE',
      brand: body.brand ?? null,
      last4: body.last4 ?? null,
      expMonth: body.expMonth ?? null,
      expYear: body.expYear ?? null,
      isDefault: body.isDefault ?? true,
      billingName: body.billingName ?? null,
      billingEmail: body.billingEmail ?? null,
    };

    if (existingDefault) {
      await this.prisma.paymentMethod.update({
        where: { id: existingDefault.id },
        data: nextPayment,
      });
    } else {
      await this.prisma.paymentMethod.create({
        data: {
          organizationSubscriptionId: subscription.id,
          ...nextPayment,
        },
      });
    }

    await this.recordAuditEvent(currentUser, subscription.id, 'PAYMENT_METHOD_UPDATED', 'Updated default payment method metadata.', {
      previousPaymentBrand: previousPayment.brand,
      newPaymentBrand: nextPayment.brand,
      previousPaymentLast4: previousPayment.last4,
      newPaymentLast4: nextPayment.last4,
      previousPaymentExpMonth: previousPayment.expMonth,
      newPaymentExpMonth: nextPayment.expMonth,
      previousPaymentExpYear: previousPayment.expYear,
      newPaymentExpYear: nextPayment.expYear,
      previousBillingName: previousPayment.billingName,
      newBillingName: nextPayment.billingName,
      previousBillingEmail: previousPayment.billingEmail,
      newBillingEmail: nextPayment.billingEmail,
    });
    return this.getPortal(currentUser);
  }

  async changePlan(currentUser: any, body: ChangeBillingPlanDto) {
    const subscription = await this.getManageableSubscription(currentUser);
    const [currentPlanWithModules, targetPlanWithModules, allModules] = await Promise.all([
      this.prisma.billingPlan.findUnique({
        where: { id: subscription.billingPlanId },
        include: { planModules: { include: { billingModule: true } } },
      }),
      this.prisma.billingPlan.findUnique({
        where: { id: body.billingPlanId },
        include: { planModules: { include: { billingModule: true } } },
      }),
      this.prisma.billingModule.findMany({
        where: { active: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
    ]);

    if (!currentPlanWithModules) throw new NotFoundException('Current billing plan not found');
    if (!targetPlanWithModules) throw new NotFoundException('Billing plan not found');

    const currentPlan = this.buildPlanRecord(currentPlanWithModules, allModules);
    const targetPlan = this.buildPlanRecord(targetPlanWithModules, allModules);
    const reviewMetadata = this.buildPlanChangeAuditMetadata(subscription, currentPlan, targetPlan);

    await this.prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        billingPlanId: targetPlanWithModules.id,
        subtotalCents: targetPlanWithModules.basePriceCents,
        totalCents: targetPlanWithModules.basePriceCents + subscription.taxCents - subscription.discountCents,
      },
    });

    await this.recordAuditEvent(currentUser, subscription.id, 'PLAN_CHANGED', `Changed billing plan to ${targetPlanWithModules.name}.`, reviewMetadata);
    return this.getPortal(currentUser);
  }

  async updateCountyAllocation(currentUser: any, countyOrganizationId: string, body: UpdateCountyAllocationDto) {
    const subscription = await this.getManageableSubscription(currentUser);
    const countyOrg = await this.prisma.organization.findUnique({ where: { id: countyOrganizationId } });
    const existingAllocation = await this.prisma.subscriptionCountyAllocation.findUnique({
      where: { organizationSubscriptionId_countyOrganizationId: { organizationSubscriptionId: subscription.id, countyOrganizationId } },
    });

    const nextStatus = body.status || existingAllocation?.status || 'PENDING';
    const nextSeatLimit = body.seatLimit ?? existingAllocation?.seatLimit ?? null;
    const nextNotes = body.notes ?? existingAllocation?.notes ?? null;

    await this.prisma.subscriptionCountyAllocation.upsert({
      where: { organizationSubscriptionId_countyOrganizationId: { organizationSubscriptionId: subscription.id, countyOrganizationId } },
      update: {
        status: body.status ?? undefined,
        seatLimit: body.seatLimit ?? undefined,
        notes: body.notes ?? undefined,
      },
      create: {
        organizationSubscriptionId: subscription.id,
        countyOrganizationId,
        status: nextStatus,
        seatLimit: body.seatLimit,
        notes: body.notes,
      },
    });

    await this.recordAuditEvent(currentUser, subscription.id, 'COUNTY_ALLOCATION_UPDATED', `Updated county allocation for ${countyOrg?.name || 'county organization'}.`, {
      countyOrganizationId,
      countyOrganizationName: countyOrg?.name || null,
      status: nextStatus,
      seatLimit: nextSeatLimit,
      notes: nextNotes,
      previousStatus: existingAllocation?.status ?? null,
      newStatus: nextStatus,
      previousSeatLimit: existingAllocation?.seatLimit ?? null,
      newSeatLimit: nextSeatLimit,
      previousNotes: existingAllocation?.notes ?? null,
      newNotes: nextNotes,
    });
    return this.getPortal(currentUser);
  }

  async updateSubscriptionModule(currentUser: any, billingModuleId: string, body: UpdateSubscriptionModuleDto) {
    const subscription = await this.getManageableSubscription(currentUser);
    const moduleRecord = await this.prisma.billingModule.findUnique({ where: { id: billingModuleId } });
    const existingModuleState = await this.prisma.organizationSubscriptionModule.findUnique({
      where: { organizationSubscriptionId_billingModuleId: { organizationSubscriptionId: subscription.id, billingModuleId } },
    });
    const nextEnabled = body.enabled ?? true;

    await this.prisma.organizationSubscriptionModule.upsert({
      where: { organizationSubscriptionId_billingModuleId: { organizationSubscriptionId: subscription.id, billingModuleId } },
      update: { enabled: nextEnabled },
      create: {
        organizationSubscriptionId: subscription.id,
        billingModuleId,
        enabled: nextEnabled,
      },
    });

    await this.recordAuditEvent(currentUser, subscription.id, 'MODULE_UPDATED', `${nextEnabled ? 'Enabled' : 'Disabled'} module ${moduleRecord?.name || 'module'}.`, {
      billingModuleId,
      billingModuleName: moduleRecord?.name || null,
      billingModuleCode: moduleRecord?.code || null,
      previousEnabled: existingModuleState?.enabled ?? null,
      newEnabled: nextEnabled,
    });
    return this.getPortal(currentUser);
  }
}

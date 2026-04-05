import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

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

const email = process.env.DEV_ADMIN_EMAIL || 'mike@fosterhub.biz';
const password = process.env.DEV_ADMIN_PASSWORD || 'FosterHub!Dev2026';
const firstName = process.env.DEV_ADMIN_FIRST_NAME || 'Mike';
const lastName = process.env.DEV_ADMIN_LAST_NAME || 'De La Rosa Garcia';

async function main() {
  let organization = await prisma.organization.findFirst({ where: { code: 'AL-DHR' } });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Alabama Department of Human Resources',
        code: 'AL-DHR',
        type: 'STATE_AGENCY',
        timezone: 'America/New_York',
      },
    });
  }

  await prisma.organization.upsert({
    where: { id: 'mobile-county-dhr-dev-seed' },
    update: {
      name: 'Mobile County DHR',
      code: 'MOB-DHR',
      type: 'COUNTY_AGENCY',
      parentOrganizationId: organization.id,
      timezone: 'America/New_York',
    },
    create: {
      id: 'mobile-county-dhr-dev-seed',
      name: 'Mobile County DHR',
      code: 'MOB-DHR',
      type: 'COUNTY_AGENCY',
      parentOrganizationId: organization.id,
      timezone: 'America/New_York',
    },
  });

  await prisma.organization.upsert({
    where: { id: 'baldwin-county-dhr-dev-seed' },
    update: {
      name: 'Baldwin County DHR',
      code: 'BAL-DHR',
      type: 'COUNTY_AGENCY',
      parentOrganizationId: organization.id,
      timezone: 'America/New_York',
    },
    create: {
      id: 'baldwin-county-dhr-dev-seed',
      name: 'Baldwin County DHR',
      code: 'BAL-DHR',
      type: 'COUNTY_AGENCY',
      parentOrganizationId: organization.id,
      timezone: 'America/New_York',
    },
  });

  const adminRole = await prisma.roleTemplate.findUnique({ where: { key: 'state_super_admin' } })
    ?? await prisma.roleTemplate.findUnique({ where: { key: 'admin' } });
  if (!adminRole) {
    throw new Error('State super admin role template not found. Run the base seed first.');
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      organizationId: organization.id,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      firstName,
      lastName,
      email,
      passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleTemplateId: {
        userId: user.id,
        roleTemplateId: adminRole.id,
      },
    },
    update: {
      active: true,
    },
    create: {
      userId: user.id,
      roleTemplateId: adminRole.id,
      active: true,
    },
  });

  const mobileCounty = await prisma.organization.findUnique({ where: { id: 'mobile-county-dhr-dev-seed' } });
  const baldwinCounty = await prisma.organization.findUnique({ where: { id: 'baldwin-county-dhr-dev-seed' } });
  const licensingWorkerRole = await prisma.roleTemplate.findUnique({ where: { key: 'licensing_worker' } });

  if (mobileCounty) {
    const mobileWorker = await prisma.user.upsert({
      where: { email: 'keisha.thomas@mobiledhr.gov' },
      update: {
        organizationId: mobileCounty.id,
        firstName: 'Keisha',
        lastName: 'Thomas',
        status: 'ACTIVE',
      },
      create: {
        organizationId: mobileCounty.id,
        firstName: 'Keisha',
        lastName: 'Thomas',
        email: 'keisha.thomas@mobiledhr.gov',
        status: 'ACTIVE',
      },
    });

    if (licensingWorkerRole) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_roleTemplateId: { userId: mobileWorker.id, roleTemplateId: licensingWorkerRole.id } },
        update: { active: true },
        create: { userId: mobileWorker.id, roleTemplateId: licensingWorkerRole.id, active: true },
      });
    }

    await prisma.fosterParentApplication.createMany({
      data: [
        {
          organizationId: mobileCounty.id,
          householdName: 'Bryant Family',
          primaryApplicant: 'Kendra Bryant',
          email: 'bryants@example.com',
          phone: '251-555-1101',
          stage: 'MISSING_DOCUMENTS',
          checklistProgress: 68,
          assignedToUserId: mobileWorker.id,
        },
      ],
      skipDuplicates: true,
    }).catch(() => undefined);

    await prisma.vendor.createMany({
      data: [
        {
          organizationId: mobileCounty.id,
          name: 'Sunrise Family Services',
          category: 'Counseling',
          city: 'Mobile',
          referredBy: 'Sarah Hall',
          status: 'APPROVED',
        },
      ],
      skipDuplicates: true,
    }).catch(() => undefined);
  }

  if (baldwinCounty) {
    const baldwinWorker = await prisma.user.upsert({
      where: { email: 'jordan.kim@baldwindhr.gov' },
      update: {
        organizationId: baldwinCounty.id,
        firstName: 'Jordan',
        lastName: 'Kim',
        status: 'ACTIVE',
      },
      create: {
        organizationId: baldwinCounty.id,
        firstName: 'Jordan',
        lastName: 'Kim',
        email: 'jordan.kim@baldwindhr.gov',
        status: 'ACTIVE',
      },
    });

    if (licensingWorkerRole) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_roleTemplateId: { userId: baldwinWorker.id, roleTemplateId: licensingWorkerRole.id } },
        update: { active: true },
        create: { userId: baldwinWorker.id, roleTemplateId: licensingWorkerRole.id, active: true },
      });
    }

    await prisma.fosterParentApplication.createMany({
      data: [
        {
          organizationId: baldwinCounty.id,
          householdName: 'Carter Family',
          primaryApplicant: 'Renee Carter',
          email: 'carters@example.com',
          phone: '251-555-2202',
          stage: 'READY_FOR_APPROVAL',
          checklistProgress: 96,
          assignedToUserId: baldwinWorker.id,
        },
      ],
      skipDuplicates: true,
    }).catch(() => undefined);

    await prisma.vendor.createMany({
      data: [
        {
          organizationId: baldwinCounty.id,
          name: 'Baldwin Therapy Group',
          category: 'Therapy',
          city: 'Fairhope',
          referredBy: 'Jasmine Cole',
          status: 'APPROVED',
        },
      ],
      skipDuplicates: true,
    }).catch(() => undefined);
  }

  await prisma.surveyCampaign.createMany({
    data: [
      {
        organizationId: organization.id,
        name: 'New License Baseline Survey',
        audience: 'New foster homes',
        cadence: 'At licensure',
        baseline: true,
        status: 'LIVE',
      },
      {
        organizationId: organization.id,
        name: '90 Day FosterHub Follow-up',
        audience: 'Licensed foster homes',
        cadence: '90 days post launch',
        baseline: false,
        status: 'SCHEDULED',
      },
    ],
    skipDuplicates: true,
  }).catch(() => undefined);

  const countyStarterPlan = await prisma.billingPlan.upsert({
    where: { code: 'county-starter' },
    update: {
      name: 'County Starter',
      description: 'Single-county starter plan for core workflow management.',
      billingInterval: 'MONTHLY',
      basePriceCents: 49900,
      perSeatPriceCents: 1500,
      countyIncludedCount: 1,
      additionalCountyPriceCents: 0,
      active: true,
      sortOrder: 1,
    },
    create: {
      code: 'county-starter',
      name: 'County Starter',
      description: 'Single-county starter plan for core workflow management.',
      billingInterval: 'MONTHLY',
      basePriceCents: 49900,
      perSeatPriceCents: 1500,
      countyIncludedCount: 1,
      additionalCountyPriceCents: 0,
      active: true,
      sortOrder: 1,
    },
  });

  const statePlatformPlan = await prisma.billingPlan.upsert({
    where: { code: 'state-platform' },
    update: {
      name: 'State Platform',
      description: 'State-managed billing, county coverage, and shared licensing.',
      billingInterval: 'MONTHLY',
      basePriceCents: 250000,
      perSeatPriceCents: 1200,
      countyIncludedCount: 2,
      additionalCountyPriceCents: 25000,
      active: true,
      sortOrder: 2,
    },
    create: {
      code: 'state-platform',
      name: 'State Platform',
      description: 'State-managed billing, county coverage, and shared licensing.',
      billingInterval: 'MONTHLY',
      basePriceCents: 250000,
      perSeatPriceCents: 1200,
      countyIncludedCount: 2,
      additionalCountyPriceCents: 25000,
      active: true,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.billingPlan.upsert({
    where: { code: 'enterprise-plus' },
    update: {
      name: 'Enterprise+',
      description: 'Advanced statewide licensing with expanded modules and support.',
      billingInterval: 'CUSTOM',
      basePriceCents: 0,
      perSeatPriceCents: 0,
      countyIncludedCount: 0,
      additionalCountyPriceCents: 0,
      active: true,
      sortOrder: 3,
    },
    create: {
      code: 'enterprise-plus',
      name: 'Enterprise+',
      description: 'Advanced statewide licensing with expanded modules and support.',
      billingInterval: 'CUSTOM',
      basePriceCents: 0,
      perSeatPriceCents: 0,
      countyIncludedCount: 0,
      additionalCountyPriceCents: 0,
      active: true,
      sortOrder: 3,
    },
  });

  const billingModuleSeeds = [
    { code: 'cases', name: 'Cases', description: 'Case workflow and child record management.', category: 'CORE' },
    { code: 'applications', name: 'Applications', description: 'Foster parent application pipeline.', category: 'CORE' },
    { code: 'calendar', name: 'Calendar', description: 'Events, reminders, and scheduling.', category: 'CORE' },
    { code: 'knowledge-base-ai', name: 'Knowledge Base AI', description: 'Policy search and citation assistant.', category: 'ADD_ON' },
    { code: 'vendor-portal', name: 'Vendor Portal', description: 'Vendor directory, invoicing, and status tracking.', category: 'ADD_ON' },
    { code: 'analytics', name: 'Analytics', description: 'Cross-county and state reporting.', category: 'ADD_ON' },
  ];

  const seededModules = [] as Array<{ id: string; code: string }>;
  for (const moduleSeed of billingModuleSeeds) {
    const moduleRecord = await prisma.billingModule.upsert({
      where: { code: moduleSeed.code },
      update: {
        name: moduleSeed.name,
        description: moduleSeed.description,
        category: moduleSeed.category as any,
        active: true,
      },
      create: {
        code: moduleSeed.code,
        name: moduleSeed.name,
        description: moduleSeed.description,
        category: moduleSeed.category as any,
        active: true,
      },
    });
    seededModules.push({ id: moduleRecord.id, code: moduleRecord.code });
  }

  await prisma.billingPlanModule.deleteMany({ where: { billingPlanId: { in: [countyStarterPlan.id, statePlatformPlan.id, enterprisePlan.id] } } });
  await prisma.billingPlanModule.createMany({
    data: [
      ...seededModules.filter(moduleSeed => ['cases', 'applications', 'calendar'].includes(moduleSeed.code)).map(moduleSeed => ({
        billingPlanId: countyStarterPlan.id,
        billingModuleId: moduleSeed.id,
        included: true,
      })),
      ...seededModules.filter(moduleSeed => ['cases', 'applications', 'calendar', 'knowledge-base-ai', 'analytics'].includes(moduleSeed.code)).map(moduleSeed => ({
        billingPlanId: statePlatformPlan.id,
        billingModuleId: moduleSeed.id,
        included: true,
      })),
      ...seededModules.map(moduleSeed => ({
        billingPlanId: enterprisePlan.id,
        billingModuleId: moduleSeed.id,
        included: true,
      })),
    ],
  });

  const stateSubscription = await prisma.organizationSubscription.upsert({
    where: { id: 'alabama-dhr-state-subscription-seed' },
    update: {
      organizationId: organization.id,
      billingPlanId: statePlatformPlan.id,
      status: 'ACTIVE',
      renewalDate: new Date('2026-05-01T00:00:00.000Z'),
      seatCountPurchased: 75,
      seatCountInUse: 61,
      countyCountCovered: 2,
      billingContactName: 'Finance Office',
      billingContactEmail: 'finance@aldhr.gov',
      billingContactPhone: '251-555-0184',
      currency: 'USD',
      subtotalCents: 250000,
      discountCents: 0,
      taxCents: 0,
      totalCents: 250000,
      notes: 'Seeded state subscription for billing portal development.',
    },
    create: {
      id: 'alabama-dhr-state-subscription-seed',
      organizationId: organization.id,
      billingPlanId: statePlatformPlan.id,
      status: 'ACTIVE',
      renewalDate: new Date('2026-05-01T00:00:00.000Z'),
      seatCountPurchased: 75,
      seatCountInUse: 61,
      countyCountCovered: 2,
      billingContactName: 'Finance Office',
      billingContactEmail: 'finance@aldhr.gov',
      billingContactPhone: '251-555-0184',
      currency: 'USD',
      subtotalCents: 250000,
      discountCents: 0,
      taxCents: 0,
      totalCents: 250000,
      notes: 'Seeded state subscription for billing portal development.',
    },
  });

  await prisma.organizationSubscriptionModule.deleteMany({ where: { organizationSubscriptionId: stateSubscription.id } });
  await prisma.organizationSubscriptionModule.createMany({
    data: seededModules.filter(moduleSeed => ['cases', 'applications', 'calendar', 'knowledge-base-ai', 'analytics'].includes(moduleSeed.code)).map(moduleSeed => ({
      organizationSubscriptionId: stateSubscription.id,
      billingModuleId: moduleSeed.id,
      enabled: true,
    })),
  });

  await prisma.paymentMethod.deleteMany({ where: { organizationSubscriptionId: stateSubscription.id } });
  await prisma.paymentMethod.create({
    data: {
      organizationSubscriptionId: stateSubscription.id,
      provider: 'STRIPE',
      brand: 'Visa',
      last4: '1842',
      expMonth: 5,
      expYear: 2028,
      isDefault: true,
      billingName: 'Alabama DHR Finance',
      billingEmail: 'finance@aldhr.gov',
    },
  });

  await prisma.billingInvoice.deleteMany({ where: { organizationSubscriptionId: stateSubscription.id } });
  const invoiceOne = await prisma.billingInvoice.create({
    data: {
      organizationSubscriptionId: stateSubscription.id,
      invoiceNumber: 'INV-2026-004',
      status: 'PAID',
      issuedAt: new Date('2026-04-01T00:00:00.000Z'),
      dueAt: new Date('2026-04-15T00:00:00.000Z'),
      paidAt: new Date('2026-04-03T00:00:00.000Z'),
      subtotalCents: 250000,
      taxCents: 0,
      totalCents: 250000,
      currency: 'USD',
    },
  });
  await prisma.billingInvoiceLineItem.create({
    data: {
      billingInvoiceId: invoiceOne.id,
      description: 'State Platform monthly subscription',
      quantity: 1,
      unitPriceCents: 250000,
      totalCents: 250000,
      lineType: 'BASE_PLAN',
    },
  });

  if (mobileCounty) {
    await prisma.subscriptionCountyAllocation.upsert({
      where: { organizationSubscriptionId_countyOrganizationId: { organizationSubscriptionId: stateSubscription.id, countyOrganizationId: mobileCounty.id } },
      update: {
        status: 'ACTIVE',
        seatLimit: 42,
        seatInUse: 34,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      create: {
        organizationSubscriptionId: stateSubscription.id,
        countyOrganizationId: mobileCounty.id,
        status: 'ACTIVE',
        seatLimit: 42,
        seatInUse: 34,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  }

  if (baldwinCounty) {
    await prisma.subscriptionCountyAllocation.upsert({
      where: { organizationSubscriptionId_countyOrganizationId: { organizationSubscriptionId: stateSubscription.id, countyOrganizationId: baldwinCounty.id } },
      update: {
        status: 'ACTIVE',
        seatLimit: 20,
        seatInUse: 15,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      create: {
        organizationSubscriptionId: stateSubscription.id,
        countyOrganizationId: baldwinCounty.id,
        status: 'ACTIVE',
        seatLimit: 20,
        seatInUse: 15,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  }

  const statePolicySource = await prisma.knowledgeDocumentSource.upsert({
    where: { id: 'state-policy-manual-dev-seed' },
    update: {
      organizationId: organization.id,
      title: 'Alabama DHR Policy Manual',
      sourceType: 'POLICY_MANUAL',
      accessScope: 'INHERIT_TO_CHILDREN',
      status: 'READY',
      versionLabel: '2026.1',
      fileName: 'alabama-dhr-policy-manual.pdf',
      notes: 'Seeded state-level policy source for Ask FosterHub AI.',
      createdByUserId: user.id,
    },
    create: {
      id: 'state-policy-manual-dev-seed',
      organizationId: organization.id,
      title: 'Alabama DHR Policy Manual',
      sourceType: 'POLICY_MANUAL',
      accessScope: 'INHERIT_TO_CHILDREN',
      status: 'READY',
      versionLabel: '2026.1',
      fileName: 'alabama-dhr-policy-manual.pdf',
      notes: 'Seeded state-level policy source for Ask FosterHub AI.',
      createdByUserId: user.id,
    },
  });

  await prisma.knowledgeDocumentSection.deleteMany({ where: { knowledgeDocumentSourceId: statePolicySource.id } });
  await prisma.knowledgeDocumentSection.createMany({
    data: [
      {
        knowledgeDocumentSourceId: statePolicySource.id,
        heading: 'Visitation and Family Contact',
        sectionKey: '4.2',
        pageNumber: 113,
        sortOrder: 0,
        body: 'Visitation schedules shall follow the case plan and court requirements. Any requested change should be reviewed by the agency and documented in the case record before implementation.',
      },
      {
        knowledgeDocumentSourceId: statePolicySource.id,
        heading: 'Placement Change Requirements',
        sectionKey: '7.1',
        pageNumber: 89,
        sortOrder: 1,
        body: 'Before a placement change is finalized, the agency should complete the required review steps, notify involved parties as required, and document the reason for the change in the case file.',
      },
    ],
  }).catch(() => undefined);

  if (mobileCounty) {
    const countyPolicySource = await prisma.knowledgeDocumentSource.upsert({
      where: { id: 'mobile-county-guidance-dev-seed' },
      update: {
        organizationId: mobileCounty.id,
        title: 'Mobile County Foster Parent Guidance',
        sourceType: 'COUNTY_GUIDANCE',
        accessScope: 'ORGANIZATION_ONLY',
        status: 'READY',
        versionLabel: 'Spring 2026',
        fileName: 'mobile-county-foster-parent-guidance.pdf',
        notes: 'Seeded county-level guidance source for Ask FosterHub AI.',
        createdByUserId: user.id,
      },
      create: {
        id: 'mobile-county-guidance-dev-seed',
        organizationId: mobileCounty.id,
        title: 'Mobile County Foster Parent Guidance',
        sourceType: 'COUNTY_GUIDANCE',
        accessScope: 'ORGANIZATION_ONLY',
        status: 'READY',
        versionLabel: 'Spring 2026',
        fileName: 'mobile-county-foster-parent-guidance.pdf',
        notes: 'Seeded county-level guidance source for Ask FosterHub AI.',
        createdByUserId: user.id,
      },
    });

    await prisma.knowledgeDocumentSection.deleteMany({ where: { knowledgeDocumentSourceId: countyPolicySource.id } });
    await prisma.knowledgeDocumentSection.createMany({
      data: [
        {
          knowledgeDocumentSourceId: countyPolicySource.id,
          heading: 'After-Hours Escalation',
          sectionKey: 'MC-2',
          pageNumber: 6,
          sortOrder: 0,
          body: 'After-hours placement concerns should be routed through the county on-call workflow and documented in the case record on the next business day.',
        },
      ],
    }).catch(() => undefined);
  }

  const applicationsNeedingChecklist = await prisma.fosterParentApplication.findMany({
    include: { checklistItems: true },
  });

  for (const application of applicationsNeedingChecklist) {
    if (!application.checklistItems.length) {
      await prisma.fosterApplicationChecklistItem.createMany({
        data: defaultChecklistTemplate.map((item, index) => ({
          fosterParentApplicationId: application.id,
          label: item.label,
          requiresDocument: item.requiresDocument,
          requiredDocumentLabel: item.requiredDocumentLabel,
          sortOrder: index,
          completed: index === 0,
          completedAt: index === 0 ? new Date() : null,
        })),
      });

      await prisma.fosterParentApplication.update({
        where: { id: application.id },
        data: { checklistProgress: 13 },
      });
    } else {
      for (const checklistItem of application.checklistItems) {
        const template = defaultChecklistTemplate.find(item => item.label === checklistItem.label);
        if (!template) continue;
        await prisma.fosterApplicationChecklistItem.update({
          where: { id: checklistItem.id },
          data: {
            requiresDocument: template.requiresDocument,
            requiredDocumentLabel: template.requiredDocumentLabel,
          },
        });
      }
    }

    const existingTimeline = await prisma.fosterApplicationTimelineEvent.findFirst({
      where: { fosterParentApplicationId: application.id },
    });

    if (!existingTimeline) {
      await prisma.fosterApplicationTimelineEvent.create({
        data: {
          fosterParentApplicationId: application.id,
          eventType: 'APPLICATION_CREATED',
          message: `Application created for ${application.householdName}.`,
          createdByUserId: user.id,
        },
      });
    }
  }

  console.log(JSON.stringify({
    ok: true,
    email,
    role: adminRole.key,
    organization: organization.name,
  }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

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

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const email = process.env.DEV_ADMIN_EMAIL || 'mike@fosterhub.biz';
const password = process.env.DEV_ADMIN_PASSWORD || 'FosterHub!Dev2026';
const firstName = process.env.DEV_ADMIN_FIRST_NAME || 'Mike';
const lastName = process.env.DEV_ADMIN_LAST_NAME || 'De La Rosa Garcia';

async function main() {
  let organization = await prisma.organization.findFirst({ where: { name: 'FosterHub Dev Org' } });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'FosterHub Dev Org',
        timezone: 'America/New_York',
      },
    });
  }

  const adminRole = await prisma.roleTemplate.findUnique({ where: { key: 'admin' } });
  if (!adminRole) {
    throw new Error('Admin role template not found. Run the base seed first.');
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

  console.log(JSON.stringify({
    ok: true,
    email,
    role: 'admin',
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

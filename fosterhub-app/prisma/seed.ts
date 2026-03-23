import { PrismaClient } from '@prisma/client';
import { permissionKeys, rolePermissionMap } from '../packages/auth/src/permissions';

const prisma = new PrismaClient();

const roleSeed = [
  { name: 'Administrator', key: 'admin', description: 'Full access to FosterHub.' },
  { name: 'Manager', key: 'manager', description: 'Team and workflow oversight.' },
  { name: 'Worker', key: 'worker', description: 'Assigned case and request management.' },
  { name: 'Resource Parent', key: 'resource_parent', description: 'Resource parent portal access.' },
  { name: 'Vendor', key: 'vendor', description: 'Vendor onboarding and communication access.' },
  { name: 'Birth Parent', key: 'birth_parent', description: 'Scoped child and communication access.' },
  { name: 'Youth', key: 'youth', description: 'Age-appropriate communication and request access.' }
] as const;

const categoryForPermission = (key: string) => key.split('.')[0] || 'general';

async function main() {
  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {
        label: key,
        category: categoryForPermission(key)
      },
      create: {
        key,
        label: key,
        category: categoryForPermission(key)
      }
    });
  }

  const permissions = await prisma.permission.findMany();
  const permissionByKey = new Map(permissions.map(permission => [permission.key, permission.id]));

  for (const role of roleSeed) {
    const template = await prisma.roleTemplate.upsert({
      where: { key: role.key },
      update: {
        name: role.name,
        description: role.description,
        isSystemDefault: true
      },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystemDefault: true
      }
    });

    for (const permissionKey of rolePermissionMap[role.key]) {
      const permissionId = permissionByKey.get(permissionKey);
      if (!permissionId) continue;

      await prisma.roleTemplatePermission.upsert({
        where: {
          roleTemplateId_permissionId: {
            roleTemplateId: template.id,
            permissionId
          }
        },
        update: {},
        create: {
          roleTemplateId: template.id,
          permissionId
        }
      });
    }
  }
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

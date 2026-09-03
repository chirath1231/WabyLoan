import { prisma } from '../db/prisma.js';
import { diffFields, recordAudit } from './auditService.js';

function toAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  return users.map(toAdminUser);
}

export async function updateUser(id, data, adminUserId) {
  const before = await prisma.user.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.user.update({ where: { id }, data });
  await recordAudit(adminUserId, 'user', id, diffFields(before, data));
  return toAdminUser(updated);
}

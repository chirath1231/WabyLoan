import { prisma } from '../db/prisma.js';
import { diffFields, recordAudit } from './auditService.js';

export function listOccupations() {
  return prisma.occupation.findMany({ orderBy: { label: 'asc' } });
}

export function createOccupation(data) {
  return prisma.occupation.create({ data });
}

export async function updateOccupation(id, data, adminUserId) {
  const before = await prisma.occupation.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.occupation.update({ where: { id }, data });
  await recordAudit(adminUserId, 'occupation', id, diffFields(before, data));
  return updated;
}

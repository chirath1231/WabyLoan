import { prisma } from '../db/prisma.js';
import { diffFields, recordAudit } from './auditService.js';

export function listActiveBanks() {
  return prisma.bank.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
}

export function listAllBanks() {
  return prisma.bank.findMany({ orderBy: { name: 'asc' } });
}

export function getBank(id) {
  return prisma.bank.findUnique({ where: { id } });
}

export function createBank(data) {
  return prisma.bank.create({ data });
}

export async function updateBank(id, data, adminUserId) {
  const before = await prisma.bank.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.bank.update({ where: { id }, data });
  await recordAudit(adminUserId, 'bank', id, diffFields(before, data));
  return updated;
}

/** No delete endpoint exists — Active/Inactive toggle only, a deliberate SRS decision (Appendix C.6). */
export async function setBankActive(id, active, adminUserId) {
  return updateBank(id, { active }, adminUserId);
}

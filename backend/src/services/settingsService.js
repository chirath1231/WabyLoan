import { prisma } from '../db/prisma.js';
import { diffFields, recordAudit } from './auditService.js';

export const DEFAULT_SETTINGS = {
  dtiGovernment: 70,
  dtiSemiGovernment: 65,
  dtiPrivate: 60,
  dtiSelfEmployed: 55,
  specialOccupationDiscount: 0.75,
  specialOccupationEnabled: true,
  professionalSchemeDiscount: 1.5,
  professionalSchemeEnabled: true,
  loanRoundingStep: 50000,
  businessLoanEnabled: false,
};

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: 1, ...DEFAULT_SETTINGS } });
}

export async function updateSettings(update, adminUserId) {
  const before = await getSettings();
  const updated = await prisma.settings.update({ where: { id: 1 }, data: update });
  await recordAudit(adminUserId, 'settings', 'global', diffFields(before, update));
  return updated;
}

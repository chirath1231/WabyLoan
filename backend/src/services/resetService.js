import { prisma } from '../db/prisma.js';
import { BANKS_DEFAULT, OCCUPATIONS_DEFAULT } from '../data/defaultData.js';
import { DEFAULT_SETTINGS } from './settingsService.js';
import { recordAudit } from './auditService.js';

/**
 * Restores all bank records, the occupation list, DTI thresholds, discount percentages, and
 * feature flags to their shipped baseline (SRS §5.3). The prototype has no confirmation step
 * for this — production must require one client-side before calling this endpoint, given the
 * blast radius of the action.
 */
export async function resetAllToDefaults(adminUserId) {
  await prisma.$transaction(async (tx) => {
    await tx.settings.upsert({ where: { id: 1 }, update: DEFAULT_SETTINGS, create: { id: 1, ...DEFAULT_SETTINGS } });

    for (const occ of OCCUPATIONS_DEFAULT) {
      await tx.occupation.upsert({
        where: { slug: occ.slug },
        update: { label: occ.label, isSpecialSchemeEligible: occ.isSpecialSchemeEligible },
        create: occ,
      });
    }

    for (const bank of BANKS_DEFAULT) {
      const data = {
        name: bank.name,
        shortName: bank.shortName,
        type: bank.type,
        active: bank.active,
        sponsored: bank.sponsored,
        baseRate: bank.baseRate,
        docChargePct: bank.docChargePct,
        docChargeMin: bank.docChargeMin,
        docChargeCap: bank.docChargeCap,
        maxTermPersonal: bank.maxTermPersonal,
        maxTermProfessional: bank.maxTermProfessional,
        maxTermHousing: bank.maxTermHousing,
        maxTermVehicle: bank.maxTermVehicle,
        maxTermBusiness: bank.maxTermBusiness,
        specialRate: bank.specialRate,
        specialDocChargePct: bank.specialDocChargePct,
        specialMaxTermYears: bank.specialMaxTermYears,
        allowedSectors: bank.allowedSectors,
        targetOccupation: bank.targetOccupation,
        remarks: bank.remarks,
        specialSchemeRemarks: bank.specialSchemeRemarks,
        color: bank.color,
        updatedDate: new Date(bank.updatedDate),
      };
      const existing = await tx.bank.findFirst({ where: { name: bank.name } });
      if (existing) {
        await tx.bank.update({ where: { id: existing.id }, data });
      } else {
        await tx.bank.create({ data });
      }
    }
  });

  await recordAudit(adminUserId, 'system', 'all', [
    { field: 'reset_to_defaults', oldValue: null, newValue: new Date().toISOString() },
  ]);
}

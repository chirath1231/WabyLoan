import { BANKS_DEFAULT, OCCUPATIONS_DEFAULT } from '../data/defaultData.js';
import { DEFAULT_SETTINGS } from './settingsService.js';
import { newId } from '../lib/id.js';

/** Upserts the single settings row (id=1) to the shipped baseline. `db` is a pool or transaction client. */
export async function applyDefaultSettings(db) {
  await db.query(
    `INSERT INTO settings (id, "dtiGovernment", "dtiSemiGovernment", "dtiPrivate", "dtiSelfEmployed",
       "specialOccupationDiscount", "specialOccupationEnabled", "professionalSchemeDiscount",
       "professionalSchemeEnabled", "loanRoundingStep", "businessLoanEnabled")
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       "dtiGovernment" = EXCLUDED."dtiGovernment", "dtiSemiGovernment" = EXCLUDED."dtiSemiGovernment",
       "dtiPrivate" = EXCLUDED."dtiPrivate", "dtiSelfEmployed" = EXCLUDED."dtiSelfEmployed",
       "specialOccupationDiscount" = EXCLUDED."specialOccupationDiscount",
       "specialOccupationEnabled" = EXCLUDED."specialOccupationEnabled",
       "professionalSchemeDiscount" = EXCLUDED."professionalSchemeDiscount",
       "professionalSchemeEnabled" = EXCLUDED."professionalSchemeEnabled",
       "loanRoundingStep" = EXCLUDED."loanRoundingStep", "businessLoanEnabled" = EXCLUDED."businessLoanEnabled",
       "updatedAt" = now()`,
    [
      DEFAULT_SETTINGS.dtiGovernment,
      DEFAULT_SETTINGS.dtiSemiGovernment,
      DEFAULT_SETTINGS.dtiPrivate,
      DEFAULT_SETTINGS.dtiSelfEmployed,
      DEFAULT_SETTINGS.specialOccupationDiscount,
      DEFAULT_SETTINGS.specialOccupationEnabled,
      DEFAULT_SETTINGS.professionalSchemeDiscount,
      DEFAULT_SETTINGS.professionalSchemeEnabled,
      DEFAULT_SETTINGS.loanRoundingStep,
      DEFAULT_SETTINGS.businessLoanEnabled,
    ],
  );
}

/** Upserts (by slug) the shipped occupation list. `db` is a pool or transaction client. */
export async function applyDefaultOccupations(db) {
  for (const occ of OCCUPATIONS_DEFAULT) {
    await db.query(
      `INSERT INTO occupations (id, slug, label, "isSpecialSchemeEligible")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET
         label = EXCLUDED.label, "isSpecialSchemeEligible" = EXCLUDED."isSpecialSchemeEligible", "updatedAt" = now()`,
      [newId(), occ.slug, occ.label, occ.isSpecialSchemeEligible],
    );
  }
}

/** Upserts (by name) the shipped bank list. `db` is a pool or transaction client. */
export async function applyDefaultBanks(db) {
  for (const bank of BANKS_DEFAULT) {
    const { rows } = await db.query('SELECT id FROM banks WHERE name = $1', [bank.name]);
    const bankId = rows[0]?.id ?? newId();
    await db.query(
      `INSERT INTO banks (id, name, "shortName", type, active, sponsored, "baseRate", "docChargePct",
         "docChargeMin", "docChargeCap", "maxTermPersonal", "maxTermProfessional", "maxTermHousing",
         "maxTermVehicle", "maxTermBusiness", "specialRate", "specialDocChargePct", "specialMaxTermYears",
         "allowedSectors", "targetOccupation", remarks, "specialSchemeRemarks", color, "updatedDate")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, "shortName" = EXCLUDED."shortName", type = EXCLUDED.type,
         active = EXCLUDED.active, sponsored = EXCLUDED.sponsored, "baseRate" = EXCLUDED."baseRate",
         "docChargePct" = EXCLUDED."docChargePct", "docChargeMin" = EXCLUDED."docChargeMin",
         "docChargeCap" = EXCLUDED."docChargeCap", "maxTermPersonal" = EXCLUDED."maxTermPersonal",
         "maxTermProfessional" = EXCLUDED."maxTermProfessional", "maxTermHousing" = EXCLUDED."maxTermHousing",
         "maxTermVehicle" = EXCLUDED."maxTermVehicle", "maxTermBusiness" = EXCLUDED."maxTermBusiness",
         "specialRate" = EXCLUDED."specialRate", "specialDocChargePct" = EXCLUDED."specialDocChargePct",
         "specialMaxTermYears" = EXCLUDED."specialMaxTermYears", "allowedSectors" = EXCLUDED."allowedSectors",
         "targetOccupation" = EXCLUDED."targetOccupation", remarks = EXCLUDED.remarks,
         "specialSchemeRemarks" = EXCLUDED."specialSchemeRemarks", color = EXCLUDED.color,
         "updatedDate" = EXCLUDED."updatedDate", "updatedAt" = now()`,
      [
        bankId,
        bank.name,
        bank.shortName,
        bank.type,
        bank.active,
        bank.sponsored,
        bank.baseRate,
        bank.docChargePct,
        bank.docChargeMin,
        bank.docChargeCap,
        bank.maxTermPersonal,
        bank.maxTermProfessional,
        bank.maxTermHousing,
        bank.maxTermVehicle,
        bank.maxTermBusiness,
        bank.specialRate,
        bank.specialDocChargePct,
        bank.specialMaxTermYears,
        bank.allowedSectors,
        bank.targetOccupation,
        bank.remarks,
        bank.specialSchemeRemarks,
        bank.color,
        bank.updatedDate,
      ],
    );
  }
}

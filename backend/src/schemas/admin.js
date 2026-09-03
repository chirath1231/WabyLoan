import { z } from 'zod';
import { sectorSchema } from './eligibility.js';

const targetOccupationSchema = z.enum(['all', 'doctor', 'engineer', 'gov_exec']).nullable();

export const bankWriteSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  type: z.enum(['bank', 'finance']),
  active: z.boolean(),
  sponsored: z.boolean(),
  baseRate: z.number().min(1).max(50),
  docChargePct: z.number().min(0.5).max(1),
  docChargeMin: z.number().int().min(0),
  docChargeCap: z.number().int().min(0),
  maxTermPersonal: z.number().int().min(0).max(30),
  maxTermProfessional: z.number().int().min(0).max(30),
  maxTermHousing: z.number().int().min(0).max(30),
  maxTermVehicle: z.number().int().min(0).max(30),
  maxTermBusiness: z.number().int().min(0).max(30),
  specialRate: z.number().min(1).max(50).nullable().optional(),
  specialDocChargePct: z.number().min(0).max(5).nullable().optional(),
  specialMaxTermYears: z.number().int().min(0).max(30).nullable().optional(),
  allowedSectors: z.array(sectorSchema).min(1, 'At least one sector must remain checked.'),
  targetOccupation: targetOccupationSchema.optional(),
  remarks: z.array(z.string()),
  specialSchemeRemarks: z.array(z.string()),
  color: z.string().nullable().optional(),
  updatedDate: z.string(), // ISO date
});

export const bankUpdateSchema = bankWriteSchema.partial();

export const occupationWriteSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  isSpecialSchemeEligible: z.boolean(),
});

export const occupationUpdateSchema = occupationWriteSchema.partial();

export const userUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  active: z.boolean().optional(),
});

export const settingsUpdateSchema = z.object({
  dtiGovernment: z.number().int().min(10).max(90).optional(),
  dtiSemiGovernment: z.number().int().min(10).max(90).optional(),
  dtiPrivate: z.number().int().min(10).max(90).optional(),
  dtiSelfEmployed: z.number().int().min(10).max(90).optional(),
  specialOccupationDiscount: z.number().min(0).max(10).optional(),
  specialOccupationEnabled: z.boolean().optional(),
  professionalSchemeDiscount: z.number().min(0).max(10).optional(),
  professionalSchemeEnabled: z.boolean().optional(),
  loanRoundingStep: z.number().int().min(0).optional(),
  businessLoanEnabled: z.boolean().optional(),
});

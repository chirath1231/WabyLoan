import { runEligibilityEngine } from '@wabyloan/engine';
import { prisma } from '../db/prisma.js';
import { mapBank, mapOccupation, mapSettings } from '../lib/mappers.js';
import { listActiveBanks } from './bankService.js';
import { listOccupations } from './occupationService.js';
import { getSettings } from './settingsService.js';

/**
 * Runs the shared eligibility engine against the current bank/occupation/settings dataset.
 * Guest callers (SRS §6.2) receive only the single top-ranked result — the full result set is
 * never sent to the client, so it can't be recovered from network inspection, not just hidden.
 */
export async function evaluateEligibility(input, user) {
  const [banks, occupations, settings] = await Promise.all([listActiveBanks(), listOccupations(), getSettings()]);

  const engineResult = runEligibilityEngine(input, banks.map(mapBank), occupations.map(mapOccupation), mapSettings(settings));

  const restricted = !user;
  const outputResult = restricted ? { ...engineResult, results: engineResult.results.slice(0, 1) } : engineResult;

  let applicationId = null;
  if (user) {
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        loanCategory: input.applicant.loanCategory,
        sector: input.applicant.sector,
        occupationId: input.applicant.occupationId,
        age: input.applicant.age,
        retirementAge: input.applicant.retirementAge,
        incomeProfile: input.income,
        categoryDetails: input.categoryDetails,
        resultsSnapshot: outputResult,
      },
    });
    applicationId = application.id;
  }

  return { restricted, engineResult: outputResult, applicationId };
}

import { Router } from 'express';
import { runEligibilityEngine, balanceAfterPayments, getMaxTermAcrossBanks } from '../services/eligibilityEngine.js';
import { loadEngineAdminData } from '../services/adminData.js';
import { optionalAuth } from '../middleware/auth.js';

export const eligibilityRouter = Router();

// Strip heavy/internal fields (nested products list, admin-only bank metadata)
// out of each result's embedded `bank` before it goes to the client.
function serializeResult(r) {
  const bank = r.bank
    ? { id: r.bank.id, name: r.bank.name, short: r.bank.short, color: r.bank.color, sponsored: r.bank.sponsored, type: r.bank.type }
    : null;
  return { ...r, bank };
}

eligibilityRouter.post('/compute', optionalAuth, async (req, res) => {
  const input = req.body || {};
  if (!input.loanCategory) return res.status(400).json({ error: 'loanCategory is required.' });

  const adminData = await loadEngineAdminData();
  const engineOutput = runEligibilityEngine(input, adminData);
  res.json({
    ...engineOutput,
    results: engineOutput.results.map(serializeResult),
    maxTermAcrossBanks: getMaxTermAcrossBanks(adminData.banks, input.loanCategory),
  });
});

eligibilityRouter.post('/amortization', optionalAuth, (req, res) => {
  const { principal, annualRatePct, months, k } = req.body || {};
  if ([principal, annualRatePct, months, k].some((v) => v == null)) {
    return res.status(400).json({ error: 'principal, annualRatePct, months, and k are required.' });
  }
  res.json({ balance: balanceAfterPayments(Number(principal), Number(annualRatePct), Number(months), Number(k)) });
});

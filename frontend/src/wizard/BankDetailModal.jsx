import { useMemo, useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { fmt } from '../utils/money.js';

function emiFromPrincipal(principal, annualRatePct, months, isFlatRate) {
  if (months <= 0) return 0;
  if (isFlatRate) {
    const years = months / 12;
    return (principal * (1 + (annualRatePct / 100) * years)) / months;
  }
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

function buildSchedule(result) {
  const { maxLoan: principal, rate, months, isFlatRate } = result;
  const emi = emiFromPrincipal(principal, rate, months, isFlatRate);
  const rows = [];
  let balance = principal;
  const monthlyFlatInterest = isFlatRate ? (principal * (rate / 100)) / 12 : null;
  const r = rate / 100 / 12;

  for (let k = 1; k <= months; k++) {
    const interest = isFlatRate ? monthlyFlatInterest : balance * r;
    const principalPortion = emi - interest;
    balance = Math.max(balance - principalPortion, 0);
    rows.push({ month: k, emi, interest, principalPortion, balance });
  }
  return rows;
}

export default function BankDetailModal({ result, category, applicantSnapshot, onClose }) {
  const { t } = useLang();
  const { isAuthenticated, openAuthPanel } = useAuth();
  const [tab, setTab] = useState('overview');
  const [scheduleView, setScheduleView] = useState('yearly');
  const [milestoneMonth, setMilestoneMonth] = useState(12);
  const [milestoneBalance, setMilestoneBalance] = useState(null);
  const [applyStatus, setApplyStatus] = useState('idle');

  const schedule = useMemo(() => buildSchedule(result), [result]);
  const yearlyRows = useMemo(() => {
    const years = [];
    for (let y = 0; y < result.termYears; y++) {
      const row = schedule[Math.min((y + 1) * 12 - 1, schedule.length - 1)];
      years.push({ year: y + 1, balance: row.balance });
    }
    return years;
  }, [schedule, result.termYears]);

  const checkMilestone = async () => {
    const { data } = await api.post('/eligibility/amortization', {
      principal: result.maxLoan, annualRatePct: result.rate, months: result.months, k: milestoneMonth,
    });
    setMilestoneBalance(data.balance);
  };

  const applyNow = async () => {
    if (!isAuthenticated) return openAuthPanel('signup');
    setApplyStatus('sending');
    try {
      await api.post('/applications', {
        bankId: result.bank.id, category, requestedAmount: result.maxLoan,
        applicantSnapshot, computedResult: result,
      });
      setApplyStatus('sent');
    } catch {
      setApplyStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card fade-in w-full max-w-2xl max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-lg">{result.bank.name}</h2>
            <p className="hint">{result.variantLabel || 'General Facility'}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--color-text-400)' }}>&times;</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('overview')} className={`btn-ghost rounded-lg h-9 px-4 text-sm ${tab === 'overview' ? 'selected' : ''}`}>Overview</button>
          <button onClick={() => setTab('schedule')} className={`btn-ghost rounded-lg h-9 px-4 text-sm ${tab === 'schedule' ? 'selected' : ''}`}>Amortization Schedule</button>
        </div>

        {tab === 'overview' ? (
          <div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><div className="hint">{t('interestRate')}</div><div className="font-mono font-semibold">{result.rate}%</div></div>
              <div><div className="hint">Term</div><div className="font-mono font-semibold">{result.termYears} yrs{result.termCapReason ? ` (capped: ${result.termCapReason})` : ''}</div></div>
              <div><div className="hint">{t('monthlyEmi')}</div><div className="font-mono font-semibold">{fmt(result.emi)}</div></div>
              <div><div className="hint">{t('docCharge')}</div><div className="font-mono font-semibold">{fmt(result.docCharge)}</div></div>
              {result.legalFee > 0 && <div><div className="hint">Legal Fee</div><div className="font-mono font-semibold">{fmt(result.legalFee)}</div></div>}
              <div><div className="hint">{t('totalCost')}</div><div className="font-mono font-semibold">{fmt(result.totalCostOfCredit)}</div></div>
              <div><div className="hint">EMI at rate +1%</div><div className="font-mono font-semibold">{fmt(result.emiPlus1)}</div></div>
              <div><div className="hint">EMI at rate +2%</div><div className="font-mono font-semibold">{fmt(result.emiPlus2)}</div></div>
            </div>

            {result.remarks?.length > 0 && (
              <ul className="list-disc pl-5 text-sm space-y-1 mb-4" style={{ color: 'var(--color-text-600)' }}>
                {result.remarks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}

            <button
              type="button" onClick={applyNow} disabled={applyStatus === 'sending' || applyStatus === 'sent'}
              className="btn-primary rounded-lg h-11 px-6"
            >
              {applyStatus === 'sent' ? 'Application submitted ✓' : applyStatus === 'sending' ? 'Submitting…' : 'Apply Now'}
            </button>
            {applyStatus === 'error' && <p className="hint mt-2" style={{ color: 'var(--color-danger)' }}>Could not submit. Please try again.</p>}
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-3 mb-4">
              <div>
                <label className="field-label">Balance after month</label>
                <input type="number" min={0} max={result.months} value={milestoneMonth} onChange={(e) => setMilestoneMonth(Number(e.target.value))} className="!w-32" />
              </div>
              <button type="button" onClick={checkMilestone} className="btn-ghost rounded-lg h-[42px] px-4">Check</button>
              {milestoneBalance != null && <span className="font-mono font-semibold">{fmt(milestoneBalance)}</span>}
            </div>

            <div className="flex gap-2 mb-3">
              <button onClick={() => setScheduleView('yearly')} className={`btn-ghost rounded-lg h-8 px-3 text-xs ${scheduleView === 'yearly' ? 'selected' : ''}`}>Yearly</button>
              <button onClick={() => setScheduleView('monthly')} className={`btn-ghost rounded-lg h-8 px-3 text-xs ${scheduleView === 'monthly' ? 'selected' : ''}`}>Monthly</button>
              <button onClick={() => window.print()} className="btn-ghost rounded-lg h-8 px-3 text-xs ml-auto"><i className="fa-solid fa-print mr-1" />Print</button>
            </div>

            <div id="printArea" className="overflow-auto max-h-96 border rounded-lg" style={{ borderColor: 'var(--color-line)' }}>
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ background: 'var(--color-card)' }}>
                  <tr>
                    <th className="text-left p-2">{scheduleView === 'yearly' ? 'Year' : 'Month'}</th>
                    {scheduleView === 'monthly' && <><th className="text-right p-2">EMI</th><th className="text-right p-2">Interest</th><th className="text-right p-2">Principal</th></>}
                    <th className="text-right p-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(scheduleView === 'yearly' ? yearlyRows : schedule).map((row) => (
                    <tr key={row.year || row.month} className="border-t" style={{ borderColor: 'var(--color-line)' }}>
                      <td className="p-2">{row.year || row.month}</td>
                      {scheduleView === 'monthly' && (
                        <>
                          <td className="text-right p-2 font-mono">{fmt(row.emi)}</td>
                          <td className="text-right p-2 font-mono">{fmt(row.interest)}</td>
                          <td className="text-right p-2 font-mono">{fmt(row.principalPortion)}</td>
                        </>
                      )}
                      <td className="text-right p-2 font-mono">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

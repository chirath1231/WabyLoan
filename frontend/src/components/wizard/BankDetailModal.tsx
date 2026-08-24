'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { balanceAfterPayments, buildAmortizationSchedule, type EligibilityResult, type LoanCategory } from '@wabyloan/engine';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { StatTile } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextInput, Label, Hint } from '@/components/ui/Field';
import { fmtLkr } from '@/lib/format';
import { api } from '@/lib/apiClient';

const PHONE_RE = /^0\d{9}$/;

export function BankDetailModal({
  result,
  loanCategory,
  applicationId,
  onClose,
}: {
  result: EligibilityResult;
  loanCategory: LoanCategory;
  applicationId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('overview');
  const [milestone, setMilestone] = useState<number>(1);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', city: '', branch: '' });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const schedule = useMemo(
    () => (result.maxLoan && result.rate && result.termYears ? buildAmortizationSchedule(result.maxLoan, result.rate, result.termYears) : []),
    [result],
  );

  const milestoneBalance =
    result.maxLoan && result.rate && result.termYears ? balanceAfterPayments(result.maxLoan, result.rate, result.termYears * 12, milestone * 12) : 0;

  const shortfall = result.netCashInHand != null && result.netCashInHand < 0;

  const whatsappText = encodeURIComponent(
    `${result.bankName}${result.variantLabel ? ` (${result.variantLabel})` : ''}: ${fmtLkr(result.maxLoan)} at ${result.rate}% — est. EMI ${fmtLkr(result.emi)}/mo. Compared on Waby Loan.`,
  );

  const leadValid = leadForm.name.trim().length > 0 && PHONE_RE.test(leadForm.phone);

  async function submitLead() {
    if (!leadValid) return;
    setLeadStatus('sending');
    try {
      await api.post('/leads', {
        ...leadForm,
        bankId: result.bankId,
        variantKey: result.variantKey,
        loanCategory,
        requestedAmount: result.maxLoan,
        applicationId: applicationId ?? undefined,
      });
      setLeadStatus('sent');
    } catch {
      setLeadStatus('error');
    }
  }

  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title={result.bankName} wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {result.variantLabel && <Badge tone="grey">{result.variantLabel.toUpperCase()}</Badge>}
        <Badge tone="teal">{t('ratesEffective')}: {result.updatedDate} (Live)</Badge>
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'amortization', label: 'Amortization Schedule' },
          { value: 'guarantor', label: 'Guarantor Conditions' },
        ]}
      >
        <TabPanel value="overview" className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Principal" value={fmtLkr(result.maxLoan)} />
            <StatTile label={t('totalCost')} value={fmtLkr(result.totalCostOfCredit)} />
            <StatTile label={t('docCharge')} value={fmtLkr(result.docCharge)} />
            <StatTile label={t('monthlyEmi')} value={fmtLkr(result.emi)} />
            <StatTile label="Total Cost (all-in)" value={fmtLkr(result.totalOutlay)} />
            {!!result.downPayment && <StatTile label="Down Payment" value={fmtLkr(result.downPayment)} />}
            {!!result.legalFee && <StatTile label="Legal & Valuation Fee" value={fmtLkr(result.legalFee)} />}
            {result.netCashInHand != null && (
              <StatTile label="Net Cash In Hand" value={fmtLkr(result.netCashInHand)} hint={shortfall ? 'Shortfall — loan amount is smaller than balance to settle' : undefined} />
            )}
          </div>
          {shortfall && <Hint tone="danger">This loan amount does not fully cover your outstanding balance to settle.</Hint>}

          <div>
            <p className="mb-2 text-sm font-semibold text-text-900">Variable-rate stress test</p>
            <div className="grid grid-cols-3 gap-3">
              <StatTile label={`At ${result.rate}%`} value={fmtLkr(result.emi)} />
              <StatTile label={`At ${(result.rate ?? 0) + 1}%`} value={fmtLkr(result.emiPlus1)} />
              <StatTile label={`At ${(result.rate ?? 0) + 2}%`} value={fmtLkr(result.emiPlus2)} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-text-900">Milestone balance checker</p>
            <div className="flex flex-wrap items-center gap-2">
              {[1, 3, 5].map((y) => (
                <button
                  key={y}
                  onClick={() => setMilestone(y)}
                  className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold ${milestone === y ? 'border-teal-700 bg-teal-700 text-white' : 'border-line text-text-600'}`}
                >
                  {y}yr
                </button>
              ))}
              <TextInput
                type="number"
                className="w-24"
                value={milestone}
                onChange={(e) => setMilestone(Number(e.target.value) || 0)}
              />
            </div>
            <div className="mt-2">
              <StatTile label={`Outstanding balance after ${milestone} year(s)`} value={fmtLkr(milestoneBalance)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1EBE59]"
            >
              <MessageCircle size={15} /> {t('sendWhatsapp')}
            </a>
          </div>

          <div className="space-y-2 border-t border-line pt-4">
            <p className="text-sm font-semibold text-text-900">{t('requestConsultation')}</p>
            {leadStatus === 'sent' ? (
              <p className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm font-semibold text-teal-800">
                Thanks — a consultant will reach out about this {result.bankName} offer.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <TextInput placeholder="Name" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
                <TextInput placeholder="07XXXXXXXX" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
                <TextInput placeholder="City (optional)" value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })} />
                <TextInput placeholder="Preferred branch (optional)" value={leadForm.branch} onChange={(e) => setLeadForm({ ...leadForm, branch: e.target.value })} />
                <Button className="sm:col-span-2" onClick={submitLead} disabled={!leadValid || leadStatus === 'sending'}>
                  {t('requestConsultation')}
                </Button>
                {leadStatus === 'error' && <Hint tone="danger">Something went wrong — try again.</Hint>}
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel value="amortization">
          <div className="max-h-[50vh] overflow-auto rounded-xl2 border border-line">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead className="sticky top-0 bg-teal-50 text-[11px] uppercase text-text-600">
                <tr>
                  <th className="px-3 py-2 text-center">Year</th>
                  <th className="px-3 py-2 text-right">Monthly Payment</th>
                  <th className="px-3 py-2 text-right">Interest Paid</th>
                  <th className="px-3 py-2 text-right">Principal Paid</th>
                  <th className="px-3 py-2 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {schedule.map((row) => (
                  <tr key={row.year} className="border-t border-line">
                    <td className="px-3 py-2 text-center">{row.year}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{fmtLkr(row.monthlyPayment)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{fmtLkr(row.interestPaid)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">{fmtLkr(row.principalPaid)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{fmtLkr(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabPanel>

        <TabPanel value="guarantor" className="space-y-2">
          {result.remarks && result.remarks.length > 0 ? (
            result.remarks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-line p-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-teal-700" />
                <span className="text-sm text-text-900">{r}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-600">No special guarantor conditions — standard credit assessment applies.</p>
          )}
          <p className="pt-2 text-[12px] text-text-400">This facility remains subject to the bank&apos;s standard credit and verification process.</p>
        </TabPanel>
      </Tabs>
    </Modal>
  );
}

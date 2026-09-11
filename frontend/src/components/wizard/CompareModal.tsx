'use client';

import type { EligibilityResult } from '@wabyloan/engine';
import { Modal } from '@/components/ui/Modal';
import { fmtLkr } from '@/lib/format';

const ROWS: { label: string; render: (r: EligibilityResult) => React.ReactNode }[] = [
  { label: 'Max Loan', render: (r) => fmtLkr(r.maxLoan) },
  { label: 'Monthly EMI', render: (r) => fmtLkr(r.emi) },
  { label: 'Interest Rate', render: (r) => `${r.rate}%` },
  { label: 'Total Cost of Credit', render: (r) => fmtLkr(r.totalCostOfCredit) },
  {
    label: 'Guarantors / Remarks',
    render: (r) => (r.remarks.length > 0 ? r.remarks.join('; ') : 'Standard credit assessment applies.'),
  },
];

export function CompareModal({ results, onClose }: { results: EligibilityResult[]; onClose: () => void }) {
  return (
    <Modal open onOpenChange={(v) => !v && onClose()} title="Compare Offers" wide>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-40 px-2 py-2 text-left text-[11px] font-semibold uppercase text-text-400" />
              {results.map((r) => (
                <th key={r.variantKey} className="border-b border-line px-3 py-2 text-left">
                  <p className="font-display text-[13px] font-semibold text-text-900">{r.bankName}</p>
                  {r.variantLabel && <p className="text-[11px] text-text-400">{r.variantLabel}</p>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-b-0">
                <td className="px-2 py-2.5 text-[12.5px] font-semibold text-text-600">{row.label}</td>
                {results.map((r) => (
                  <td key={r.variantKey} className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-text-900">
                    {row.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

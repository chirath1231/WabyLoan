import { useLang } from '../context/LangContext.jsx';
import { fmt } from '../utils/money.js';

const ROWS = [
  ['maxLoan', 'maxLoan'],
  ['interestRate', 'rate', '%'],
  ['monthlyEmi', 'emi'],
  ['docCharge', 'docCharge'],
  ['totalCost', 'totalCostOfCredit'],
];

export default function CompareModal({ results, onClose }) {
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4" onClick={onClose}>
      <div className="card modal-panel w-full max-w-3xl max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">{t('compareSelected')}</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--color-text-400)' }}>&times;</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2" style={{ color: 'var(--color-text-400)' }}>Bank</th>
                {results.map((r) => (
                  <th key={r.variantKey} className="text-left py-2 px-3 font-semibold">{r.bank.name}<div className="hint font-normal">{r.variantLabel || 'General'}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([labelKey, field, suffix]) => (
                <tr key={field} className="border-t" style={{ borderColor: 'var(--color-line)' }}>
                  <td className="py-2 font-semibold" style={{ color: 'var(--color-text-600)' }}>{t(labelKey)}</td>
                  {results.map((r) => (
                    <td key={r.variantKey} className="py-2 px-3 font-mono">
                      {suffix ? `${r[field]}${suffix}` : fmt(r[field])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

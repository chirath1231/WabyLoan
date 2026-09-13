import { useRef, useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { api, apiErrorMessage } from '../api/client.js';
import MoneyInput from '../components/MoneyInput.jsx';
import { fmt } from '../utils/money.js';

function ItemRow({ item, onToggle, onAmountChange }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--color-line)' }}>
      <input type="checkbox" className="w-4 h-4" checked={item.checked} onChange={() => onToggle()} />
      <span className="flex-1 text-sm">{item.label}</span>
      <span className={`badge ${item.type === 'earning' ? 'badge-teal' : 'badge-danger'}`}>{item.type === 'earning' ? '+' : '-'}</span>
      <MoneyInput value={item.amount} onChange={onAmountChange} className="!w-32 !h-9" />
    </div>
  );
}

function SummaryBox({ items }) {
  const checked = items.filter((i) => i.checked);
  const gross = checked.filter((i) => i.type === 'earning').reduce((s, i) => s + Number(i.amount || 0), 0);
  const deductions = checked.filter((i) => i.type === 'deduction').reduce((s, i) => s + Number(i.amount || 0), 0);
  return (
    <div className="card p-4 grid grid-cols-3 gap-3 text-center">
      <div><div className="hint">Gross</div><div className="font-mono font-bold">{fmt(gross)}</div></div>
      <div><div className="hint">Deductions</div><div className="font-mono font-bold">{fmt(deductions)}</div></div>
      <div><div className="hint">Net</div><div className="font-mono font-bold" style={{ color: 'var(--color-teal-700)' }}>{fmt(gross - deductions)}</div></div>
    </div>
  );
}

export default function Step3Payslip({ wizard, setWizard, onBack, onContinue }) {
  const { t } = useLang();
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const payslip = wizard.payslip;
  const setPayslip = (patch) => setWizard((w) => ({ ...w, payslip: { ...w.payslip, ...patch } }));
  const setManual = (patch) => setWizard((w) => ({ ...w, payslip: { ...w.payslip, manual: { ...w.payslip.manual, ...patch } } }));

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/ocr/payslip', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const items = data.items.map((it, i) => ({ id: `item_${i}`, label: it.label, type: it.type, amount: it.amount, checked: true }));
      setPayslip({ employee: data.employee, items });
    } catch (err) {
      setUploadError(apiErrorMessage(err, 'Could not read this payslip. Try a clearer photo or switch to manual entry.'));
    } finally {
      setUploading(false);
    }
  };

  const toggleItem = (id) => {
    setPayslip({ items: payslip.items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)) });
  };
  const changeItemAmount = (id, amount) => {
    setPayslip({ items: payslip.items.map((it) => (it.id === id ? { ...it, amount } : it)) });
  };

  const canContinue = payslip.mode === 'upload'
    ? payslip.items.length > 0
    : payslip.manual.simpleMode ? payslip.manual.simpleNetSalary > 0 : payslip.manual.basic > 0;

  return (
    <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1">{t('step3Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>{t('step3Sub')}</p>

      <div className="flex gap-2 mb-5">
        <button
          type="button"
          className={`btn-ghost rounded-lg h-10 px-4 ${payslip.mode === 'upload' ? 'selected' : ''}`}
          style={payslip.mode === 'upload' ? { background: 'var(--color-teal-50)', borderColor: 'var(--color-teal-700)', color: 'var(--color-teal-700)' } : {}}
          onClick={() => setPayslip({ mode: 'upload' })}
        >
          Upload Payslip
        </button>
        <button
          type="button"
          className="btn-ghost rounded-lg h-10 px-4"
          style={payslip.mode === 'manual' ? { background: 'var(--color-teal-50)', borderColor: 'var(--color-teal-700)', color: 'var(--color-teal-700)' } : {}}
          onClick={() => setPayslip({ mode: 'manual' })}
        >
          Manual Entry
        </button>
      </div>

      {payslip.mode === 'upload' ? (
        <div className="mb-6">
          {!payslip.employee && !uploading && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="choice-card w-full py-10 flex flex-col items-center gap-2"
            >
              <i className="fa-solid fa-cloud-arrow-up text-2xl" style={{ color: 'var(--color-teal-700)' }} />
              <span className="font-semibold text-sm">Click to upload a photo of your payslip</span>
              <span className="hint">PNG, JPG, or WEBP — up to 8MB</span>
            </button>
          )}
          <input
            ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading && (
            <div className="choice-card w-full py-10 flex flex-col items-center gap-2">
              <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: 'var(--color-teal-700)' }} />
              <span className="text-sm">Reading your payslip…</span>
            </div>
          )}
          {uploadError && <p className="hint mb-3" style={{ color: 'var(--color-danger)' }}>{uploadError}</p>}

          {payslip.employee && (
            <div className="mt-4">
              <div className="card p-4 mb-4 grid sm:grid-cols-2 gap-2 text-sm">
                <div><span className="hint">Name</span><div className="font-semibold">{payslip.employee.name}</div></div>
                <div><span className="hint">Employer</span><div className="font-semibold">{payslip.employee.employer}</div></div>
                <div><span className="hint">Designation</span><div className="font-semibold">{payslip.employee.designation}</div></div>
                <div><span className="hint">Period</span><div className="font-semibold">{payslip.employee.period}</div></div>
              </div>
              <div className="card p-4 mb-4">
                {payslip.items.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} onAmountChange={(v) => changeItemAmount(item.id, v)} />
                ))}
              </div>
              <SummaryBox items={payslip.items} />
              <button type="button" className="hint underline mt-3" onClick={() => setPayslip({ employee: null, items: [] })}>Upload a different payslip</button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4">
            <input type="checkbox" className="w-4 h-4" checked={payslip.manual.simpleMode} onChange={(e) => setManual({ simpleMode: e.target.checked })} />
            <span className="text-sm font-semibold">Simple mode (just my net salary)</span>
          </label>

          {payslip.manual.simpleMode ? (
            <div className="max-w-sm">
              <label className="field-label">Net monthly salary</label>
              <MoneyInput value={payslip.manual.simpleNetSalary} onChange={(v) => setManual({ simpleNetSalary: v })} />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Basic salary</label>
                <MoneyInput value={payslip.manual.basic} onChange={(v) => setManual({ basic: v })} />
              </div>
              <div>
                <label className="field-label">Total allowances</label>
                <MoneyInput value={payslip.manual.allowances} onChange={(v) => setManual({ allowances: v })} />
              </div>
              <div>
                <label className="field-label">Total deductions</label>
                <MoneyInput value={payslip.manual.deductions} onChange={(v) => setManual({ deductions: v })} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="field-label">Average monthly OT (optional)</label>
          <MoneyInput value={wizard.otMonthlyAverage} onChange={(v) => setWizard((w) => ({ ...w, otMonthlyAverage: v }))} />
        </div>
        <div>
          <label className="field-label">Other monthly income (optional)</label>
          <MoneyInput value={wizard.otherIncomeMonthly} onChange={(v) => setWizard((w) => ({ ...w, otherIncomeMonthly: v }))} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-ghost rounded-lg h-12 px-6">{t('back')}</button>
        <button type="button" disabled={!canContinue} onClick={onContinue} className="btn-primary rounded-lg h-12 px-8">{t('continue')}</button>
      </div>
    </div>
  );
}

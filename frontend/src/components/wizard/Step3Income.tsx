'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { suggestEpf } from '@wabyloan/engine';
import { Lock, Plus, Trash2, UploadCloud } from 'lucide-react';
import { useWizardStore, type IncomeItemState } from '@/store/wizardStore';
import { deriveIncomeProfile } from '@/lib/deriveIncome';
import { nextId } from '@/lib/idGen';
import { Label, Hint, TextInput, MoneyInput } from '@/components/ui/Field';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function ItemRow({ item, onToggle, onAmountChange, onRemove }: { item: IncomeItemState; onToggle: () => void; onAmountChange: (v: number) => void; onRemove?: () => void }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-line px-3 py-2.5 first:border-t-0">
      <input type="checkbox" checked={item.checked} disabled={item.locked} onChange={onToggle} className="h-4 w-4 accent-teal-700" />
      <div className="flex items-center gap-2 truncate">
        <span className="truncate text-sm text-text-900">{item.label}</span>
        {item.locked && <Lock size={12} className="flex-shrink-0 text-text-400" />}
        <Badge tone={item.fixed ? 'teal' : 'grey'} className="hidden sm:inline-block">
          {item.fixed ? 'Fixed' : 'Non-Fixed'}
        </Badge>
      </div>
      <div className="w-32">
        <MoneyInput value={item.amount} onChange={onAmountChange} />
      </div>
      {onRemove ? (
        <button onClick={onRemove} className="text-text-400 hover:text-danger">
          <Trash2 size={15} />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

export function Step3Income({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const { t } = useTranslation();
  const state = useWizardStore();
  const setField = useWizardStore((s) => s.setField);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const skipsPayslip = state.loanCategory === 'business' || state.sector === 'self_employed';

  const resolved = useMemo(() => deriveIncomeProfile(state), [state]);
  const grossExDeductions = resolved.grossMonthlyIncome;
  const totalDeductions = resolved.deductionsTotal;
  const net = grossExDeductions - totalDeductions;
  const deductionsExceedGross = totalDeductions > grossExDeductions && grossExDeductions > 0;
  const allowanceOverBasic =
    state.incomeMode === 'manual' && !state.manualItemized && state.manualBasic > 0 && state.manualAllowances > 1.5 * state.manualBasic;

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/proxy/ocr/extract', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed.');
      setField('ocrEmployee', { name: data.employeeName, employer: data.employer, designation: data.designation, payPeriod: data.payPeriod });
      setField(
        'ocrItems',
        data.items.map((i: { id: string; label: string; type: 'earning' | 'deduction'; fixed: boolean; amount: number }) => ({
          ...i,
          checked: true,
          locked: i.fixed && i.type === 'deduction',
        })),
      );
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Extraction failed.');
    } finally {
      setUploading(false);
    }
  }

  function toggleItemized(on: boolean) {
    setField('manualItemized', on);
    if (on && state.manualDeductionItems.length === 0) {
      setField('manualDeductionItems', [
        { id: 'epf', label: 'EPF (Employee 8%)', type: 'deduction', fixed: true, amount: suggestEpf(state.manualBasic), checked: true, locked: true },
      ]);
    }
  }

  function updateBasic(v: number) {
    setField('manualBasic', v);
    if (state.manualItemized && !state.epfManuallyEdited) {
      setField(
        'manualDeductionItems',
        state.manualDeductionItems.map((i) => (i.id === 'epf' ? { ...i, amount: suggestEpf(v) } : i)),
      );
    }
  }

  function updateDeductionAmount(id: string, v: number) {
    if (id === 'epf') setField('epfManuallyEdited', true);
    setField(
      'manualDeductionItems',
      state.manualDeductionItems.map((i) => (i.id === id ? { ...i, amount: v } : i)),
    );
  }

  const canContinue = !skipsPayslip ? net >= 0 && !deductionsExceedGross && grossExDeductions > 0 : true;

  if (skipsPayslip) {
    return (
      <div className="fade-in space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-900">{t('step3Title')}</h1>
          <p className="mt-1 text-[14px] text-text-600">
            {state.loanCategory === 'business'
              ? 'Provide your average monthly revenue and expenses.'
              : 'Provide your average monthly income.'}
          </p>
        </div>
        {state.loanCategory === 'business' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Average Monthly Revenue</Label>
              <MoneyInput value={state.businessRevenue} onChange={(v) => setField('businessRevenue', v)} />
            </div>
            <div>
              <Label>Average Monthly Expenses</Label>
              <MoneyInput value={state.businessExpenses} onChange={(v) => setField('businessExpenses', v)} />
            </div>
          </div>
        ) : (
          <div className="max-w-sm">
            <Label>Average Monthly Income</Label>
            <MoneyInput value={state.selfEmployedIncome} onChange={(v) => setField('selfEmployedIncome', v)} />
          </div>
        )}
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            {t('back')}
          </Button>
          <Button onClick={onContinue}>{t('continue')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-900">{t('step3Title')}</h1>
        <p className="mt-1 text-[14px] text-text-600">{t('step3Sub')}</p>
      </div>

      <Tabs
        value={state.incomeMode}
        onValueChange={(v) => setField('incomeMode', v as 'ocr' | 'manual')}
        tabs={[
          { value: 'ocr', label: 'Upload Slip (AI OCR)' },
          { value: 'manual', label: 'Enter Manually' },
        ]}
      >
        <TabPanel value="ocr" className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center gap-2 rounded-xl2 border-2 border-dashed border-line bg-white py-8 text-text-600 hover:border-teal-600"
          >
            <UploadCloud size={24} className="text-teal-700" />
            <span className="text-sm font-semibold">{uploading ? 'Extracting…' : 'Click to upload a payslip photo or PDF'}</span>
          </button>
          {uploadError && <Hint tone="danger">{uploadError}</Hint>}
          <Hint>Your payslip is processed securely to extract figures — the document itself is not retained after this session.</Hint>

          {state.ocrItems.length > 0 && (
            <div className="overflow-hidden rounded-xl2 border border-line bg-white">
              {state.ocrEmployee && (
                <div className="border-b border-line bg-teal-50 px-3 py-2 text-[12.5px] text-text-600">
                  {state.ocrEmployee.name} · {state.ocrEmployee.employer} · {state.ocrEmployee.designation} · {state.ocrEmployee.payPeriod}
                </div>
              )}
              {state.ocrItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() =>
                    setField(
                      'ocrItems',
                      state.ocrItems.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
                    )
                  }
                  onAmountChange={(v) =>
                    setField(
                      'ocrItems',
                      state.ocrItems.map((i) => (i.id === item.id ? { ...i, amount: v } : i)),
                    )
                  }
                />
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel value="manual" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Basic Salary</Label>
              <MoneyInput value={state.manualBasic} onChange={updateBasic} />
            </div>
            {!state.manualItemized && (
              <>
                <div>
                  <Label>Allowances</Label>
                  <MoneyInput value={state.manualAllowances} onChange={(v) => setField('manualAllowances', v)} />
                  {allowanceOverBasic && <Hint tone="amber">Allowances over 150% of Basic Salary — worth double-checking.</Hint>}
                </div>
                <div>
                  <Label>Deductions</Label>
                  <MoneyInput value={state.manualDeductions} onChange={(v) => setField('manualDeductions', v)} />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Switch checked={state.manualItemized} onCheckedChange={toggleItemized} />
            <span className="text-sm font-semibold text-text-900">Add itemized breakdown</span>
          </div>

          {state.manualItemized && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Allowances</Label>
                  <button
                    className="text-[12px] font-semibold text-teal-700"
                    onClick={() =>
                      setField('manualAllowanceItems', [
                        ...state.manualAllowanceItems,
                        { id: nextId('allow'), label: 'Allowance', type: 'earning', fixed: false, amount: 0, checked: true },
                      ])
                    }
                  >
                    <Plus size={13} className="mr-1 inline" /> Add
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl2 border border-line bg-white">
                  {state.manualAllowanceItems.length === 0 && <p className="p-3 text-[13px] text-text-400">No allowance rows yet.</p>}
                  {state.manualAllowanceItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() =>
                        setField('manualAllowanceItems', state.manualAllowanceItems.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)))
                      }
                      onAmountChange={(v) => setField('manualAllowanceItems', state.manualAllowanceItems.map((i) => (i.id === item.id ? { ...i, amount: v } : i)))}
                      onRemove={() => setField('manualAllowanceItems', state.manualAllowanceItems.filter((i) => i.id !== item.id))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Deductions</Label>
                  <button
                    className="text-[12px] font-semibold text-teal-700"
                    onClick={() =>
                      setField('manualDeductionItems', [
                        ...state.manualDeductionItems,
                        { id: nextId('ded'), label: 'Deduction', type: 'deduction', fixed: false, amount: 0, checked: true },
                      ])
                    }
                  >
                    <Plus size={13} className="mr-1 inline" /> Add
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl2 border border-line bg-white">
                  {state.manualDeductionItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() =>
                        setField('manualDeductionItems', state.manualDeductionItems.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)))
                      }
                      onAmountChange={(v) => updateDeductionAmount(item.id, v)}
                      onRemove={item.id === 'epf' ? undefined : () => setField('manualDeductionItems', state.manualDeductionItems.filter((i) => i.id !== item.id))}
                    />
                  ))}
                </div>
                <Hint>APIT/tax is not auto-calculated — check your payslip or current IRD tables.</Hint>
              </div>
            </div>
          )}
        </TabPanel>
      </Tabs>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Gross Salary" value={`LKR ${grossExDeductions.toLocaleString('en-LK')}`} />
        <StatTile label="Total Deductions" value={`LKR ${totalDeductions.toLocaleString('en-LK')}`} />
        <StatTile label="Net Salary" value={`LKR ${net.toLocaleString('en-LK')}`} />
      </div>
      {deductionsExceedGross && <Hint tone="danger">Total deductions cannot exceed gross salary.</Hint>}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          {t('back')}
        </Button>
        <Button onClick={onContinue} disabled={!canContinue}>
          {t('continue')}
        </Button>
      </div>
    </div>
  );
}

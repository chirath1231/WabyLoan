import { useLang } from '../context/LangContext.jsx';
import MoneyInput from '../components/MoneyInput.jsx';

function Slider({ label, value, onChange, min, max, step = 1, suffix = '' }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="field-label !mb-0">{label}</label>
        <span className="font-mono font-semibold text-sm">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

export default function Step4LoanDetails({ wizard, setWizard, onBack, onContinue, busy }) {
  const { t } = useLang();
  const cat = wizard.loanCategory;
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - Number(wizard.vehicle.year || currentYear);
  const vehicleTooOld = cat === 'vehicle' && vehicleAge > 15;

  const setVehicle = (patch) => setWizard((w) => ({ ...w, vehicle: { ...w.vehicle, ...patch } }));
  const setHousing = (patch) => setWizard((w) => ({ ...w, housing: { ...w.housing, ...patch } }));

  let canContinue = true;
  if (cat === 'vehicle') canContinue = wizard.vehicle.valuation > 0 && !vehicleTooOld;
  if (cat === 'housing') canContinue = wizard.housing.propertyValue > 0;
  if (wizard.hasExistingObligations && wizard.existingObligations <= 0) canContinue = false;
  if (wizard.hasExistingObligations && wizard.settleExistingLoans && wizard.existingLoanBalance <= 0) canContinue = false;

  return (
    <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1 capitalize">{t('step4Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>{t('step4Sub')}</p>

      {cat === 'vehicle' && (
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="field-label">Vehicle valuation</label>
            <MoneyInput value={wizard.vehicle.valuation} onChange={(v) => setVehicle({ valuation: v })} />
          </div>
          <div>
            <label className="field-label">Manufacture year</label>
            <input
              type="number" min={1980} max={currentYear} value={wizard.vehicle.year}
              onChange={(e) => setVehicle({ year: Number(e.target.value) })}
              className={vehicleTooOld ? 'invalid' : ''}
            />
            {vehicleTooOld && <p className="hint" style={{ color: 'var(--color-danger)' }}>Vehicles over 15 years old aren't eligible for leasing.</p>}
          </div>
          <Slider label="Down payment" value={wizard.vehicle.downPaymentPct} onChange={(v) => setVehicle({ downPaymentPct: v })} min={10} max={50} suffix="%" />
          <Slider label="Preferred term" value={wizard.termYears} onChange={(v) => setWizard((w) => ({ ...w, termYears: v }))} min={1} max={7} suffix=" yrs" />
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" className="w-4 h-4" checked={wizard.vehicle.balloon} onChange={(e) => setVehicle({ balloon: e.target.checked })} />
            <span className="text-sm font-semibold">Include a balloon payment</span>
          </label>
        </div>
      )}

      {cat === 'housing' && (
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="field-label">Property value</label>
            <MoneyInput value={wizard.housing.propertyValue} onChange={(v) => setHousing({ propertyValue: v })} />
          </div>
          <Slider label="Down payment" value={wizard.housing.downPaymentPct} onChange={(v) => setHousing({ downPaymentPct: v })} min={10} max={50} suffix="%" />
          <Slider label="Loan term" value={wizard.housing.term} onChange={(v) => setHousing({ term: v })} min={5} max={30} suffix=" yrs" />
        </div>
      )}

      {(cat === 'personal' || cat === 'business' || cat === 'pension') && (
        <div className="max-w-sm mb-5">
          <Slider label="Preferred term" value={wizard.termYears} onChange={(v) => setWizard((w) => ({ ...w, termYears: v }))} min={1} max={7} suffix=" yrs" />
        </div>
      )}

      <div className="mb-6">
        <label className="field-label">Do you have existing loan obligations?</label>
        <div className="flex gap-2 max-w-xs mb-3">
          {[['yes', true], ['no', false]].map(([label, val]) => (
            <button
              key={label}
              type="button"
              onClick={() => setWizard((w) => ({ ...w, hasExistingObligations: val }))}
              className={`obligations-answer-btn px-4 h-[42px] flex-1 capitalize ${wizard.hasExistingObligations === val ? 'selected' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {wizard.hasExistingObligations && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Total monthly obligations</label>
              <MoneyInput value={wizard.existingObligations} onChange={(v) => setWizard((w) => ({ ...w, existingObligations: v }))} />
            </div>
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox" className="w-4 h-4"
                  checked={wizard.settleExistingLoans}
                  onChange={(e) => setWizard((w) => ({ ...w, settleExistingLoans: e.target.checked }))}
                />
                <span className="text-sm font-semibold">Settle these from this loan</span>
              </label>
              {wizard.settleExistingLoans && (
                <MoneyInput
                  value={wizard.existingLoanBalance}
                  onChange={(v) => setWizard((w) => ({ ...w, existingLoanBalance: v }))}
                  placeholder="Outstanding balance to settle"
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-ghost rounded-lg h-12 px-6">{t('back')}</button>
        <button type="button" disabled={!canContinue || busy} onClick={onContinue} className="btn-primary rounded-lg h-12 px-8">
          {busy ? 'Calculating…' : t('seeEligibleBanks')}
        </button>
      </div>
    </div>
  );
}

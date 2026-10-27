import { useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { SECTORS, defaultRetirementAge, isValidAge, maxValidApplicantAge } from './constants.js';

export default function Step2Profile({ wizard, setWizard, settings, masterData, onBack, onContinue }) {
  const { t } = useLang();
  const [ageError, setAgeError] = useState('');
  // Sectors and occupations come from master_sectors / master_occupations; SECTORS is only the fallback while loading.
  const occupations = masterData?.occupations || [];
  const sectors = masterData?.sectors?.length ? masterData.sectors : SECTORS;

  const isPension = wizard.loanCategory === 'pension';
  const isHousing = wizard.loanCategory === 'housing';

  const selectSector = (id) => {
    setWizard((w) => ({
      ...w,
      sector: id,
      applicant: { ...w.applicant, retirementAge: w.applicant.retirementAge || defaultRetirementAge(id) },
    }));
  };

  const setApplicant = (patch) => setWizard((w) => ({ ...w, applicant: { ...w.applicant, ...patch } }));

  const ageCapLabel = isPension ? `Max age for this loan (default ${settings?.pensionMaxAge ?? 80})` : 'Expected retirement age';

  const canContinue = wizard.sector && wizard.occupation && isValidAge(wizard.applicant.age, wizard.loanCategory) &&
    (wizard.occupation !== 'general' || wizard.customOccupation.trim());

  const validateAge = (age) => {
    if (age != null && !isValidAge(age, wizard.loanCategory)) {
      setAgeError(`Age must be between 18 and ${maxValidApplicantAge(wizard.loanCategory)}.`);
    } else {
      setAgeError('');
    }
  };

  const retirementCapYears = wizard.applicant.age != null && wizard.applicant.retirementAge != null
    ? Math.max(wizard.applicant.retirementAge - wizard.applicant.age, 0)
    : null;

  return (
    <div className="fade-in">
      <h1 className="font-display font-bold text-2xl mb-1">{t('step2Title')}</h1>
      <p className="mb-6" style={{ color: 'var(--color-text-600)' }}>{t('step2Sub')}</p>

      <label className="field-label">Employment sector</label>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {sectors.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectSector(s.id)}
            className={`choice-card p-3 text-sm font-semibold ${wizard.sector === s.id ? 'selected' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="field-label">Occupation</label>
          <select value={wizard.occupation || ''} onChange={(e) => setWizard((w) => ({ ...w, occupation: e.target.value || null }))}>
            <option value="">Select occupation</option>
            {occupations.map((o) => (
              <option key={o.id} value={o.id}>{o.label}{o.special ? ' ★' : ''}</option>
            ))}
          </select>
          {wizard.occupation === 'general' && (
            <input
              type="text" placeholder="Enter your job title" className="mt-2"
              value={wizard.customOccupation}
              onChange={(e) => setWizard((w) => ({ ...w, customOccupation: e.target.value }))}
            />
          )}
        </div>

        <div>
          <label className="field-label">Gender (optional)</label>
          <div className="flex gap-2">
            {['male', 'female'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setApplicant({ gender: wizard.applicant.gender === g ? null : g })}
                className={`obligations-answer-btn px-4 h-[42px] flex-1 capitalize ${wizard.applicant.gender === g ? 'selected' : ''}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="field-label">Employer name (optional)</label>
          <input type="text" value={wizard.employerName} onChange={(e) => setWizard((w) => ({ ...w, employerName: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Time in current job, months (optional)</label>
          <input
            type="number" value={wizard.employmentMonths ?? ''}
            onChange={(e) => setWizard((w) => ({ ...w, employmentMonths: e.target.value === '' ? null : Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-2">
        <div>
          <label className="field-label">Your age</label>
          <input
            type="number" value={wizard.applicant.age ?? ''}
            className={ageError ? 'invalid' : ''}
            onChange={(e) => {
              const age = e.target.value === '' ? null : Number(e.target.value);
              setApplicant({ age });
              validateAge(age);
            }}
          />
          {ageError && <p className="hint" style={{ color: 'var(--color-danger)' }}>{ageError}</p>}
        </div>
        <div>
          <label className="field-label">{ageCapLabel}</label>
          <input
            type="number" value={wizard.applicant.retirementAge ?? ''}
            onChange={(e) => setApplicant({ retirementAge: e.target.value === '' ? null : Number(e.target.value) })}
          />
          {retirementCapYears != null && (
            <p className="hint">Max tenure from age alone: ~{retirementCapYears} years</p>
          )}
        </div>
      </div>

      {isHousing && (
        <div className="mb-5">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox" className="w-4 h-4"
              checked={wizard.applicant.jointApplicant}
              onChange={(e) => setApplicant({ jointApplicant: e.target.checked })}
            />
            <span className="text-sm font-semibold">Add a joint applicant</span>
          </label>
          {wizard.applicant.jointApplicant && (
            <div>
              <label className="field-label">Co-applicant's monthly income</label>
              <input
                type="number" value={wizard.applicant.coApplicantIncome || ''}
                onChange={(e) => setApplicant({ coApplicantIncome: Number(e.target.value) || 0 })}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBack} className="btn-ghost rounded-lg h-12 px-6">{t('back')}</button>
        <button type="button" disabled={!canContinue} onClick={onContinue} className="btn-primary rounded-lg h-12 px-8">{t('continue')}</button>
      </div>
    </div>
  );
}

import { useLang } from '../context/LangContext.jsx';

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5'];

export default function Stepper({ current }) {
  const { t } = useLang();
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEP_KEYS.map((key, i) => {
        const stepNum = i + 1;
        const status = stepNum < current ? 'done' : stepNum === current ? 'active' : '';
        return (
          <div key={key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`stamp ${status}`}>{stepNum < current ? '✓' : stepNum}</div>
              <span className="text-[11px] font-semibold text-center hidden sm:block" style={{ color: 'var(--color-text-600)' }}>
                {t(key)}
              </span>
            </div>
            {stepNum < STEP_KEYS.length && (
              <div className="ledger-line mx-2" style={{ '--fill': stepNum < current ? 1 : 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

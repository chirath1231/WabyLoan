import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';

export default function LandingPage() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="font-display font-bold text-3xl mb-3">{t('step1Title')}</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-600)' }}>{t('step1Sub')}</p>
      <Link to="/apply" className="btn-primary rounded-lg h-12 px-8 inline-flex items-center">{t('continue')}</Link>
    </div>
  );
}

import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { api } from '../api/client.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPanel() {
  const { authPanelOpen, setAuthPanelOpen, authPanelMode, setAuthPanelMode, register, login, continueAsGuest, apiErrorMessage } = useAuth();
  const { t } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthNotice, setOauthNotice] = useState('');

  if (!authPanelOpen) return null;

  const close = () => {
    setAuthPanelOpen(false);
    setError('');
    setOauthNotice('');
  };

  const handleOAuth = async (provider) => {
    setOauthNotice('');
    try {
      await api.get(`/auth/${provider}`);
    } catch (err) {
      setOauthNotice(apiErrorMessage(err, `${provider} sign-in is not available yet.`));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (authPanelMode === 'signup' && !name.trim()) return setError('Name is required.');

    setBusy(true);
    try {
      if (authPanelMode === 'signup') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      close();
    } catch (err) {
      setError(apiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center bg-black/40 p-4" onClick={close}>
      <div className="card fade-in w-full max-w-sm p-6 mt-20 sm:mt-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">{t('signUpTitle')}</h2>
          <button onClick={close} className="text-2xl leading-none" style={{ color: 'var(--color-text-400)' }}>&times;</button>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <button className="btn-social rounded-lg h-11 flex items-center justify-center gap-2" onClick={() => handleOAuth('google')}>
            <i className="fa-brands fa-google" /> {t('continueGoogle')}
          </button>
          <button className="btn-social rounded-lg h-11 flex items-center justify-center gap-2" onClick={() => handleOAuth('facebook')}>
            <i className="fa-brands fa-facebook" /> {t('continueFacebook')}
          </button>
          <button className="btn-ghost rounded-lg h-11" onClick={() => { continueAsGuest(); close(); }}>
            {t('continueGuest')}
          </button>
        </div>

        {oauthNotice && <p className="hint mb-3 text-center">{oauthNotice}</p>}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-400)' }}>OR</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          {authPanelMode === 'signup' && (
            <div>
              <label className="field-label">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="field-label">{t('emailLabel')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{t('passwordLabel')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary rounded-lg h-11">
            {authPanelMode === 'signup' ? t('signUpBtn') : t('signIn')}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-text-600)' }}>
          {authPanelMode === 'signup' ? (
            <>Already have an account?{' '}
              <button className="font-semibold underline" onClick={() => setAuthPanelMode('login')}>{t('signIn')}</button>
            </>
          ) : (
            <>Need an account?{' '}
              <button className="font-semibold underline" onClick={() => setAuthPanelMode('signup')}>{t('signUpBtn')}</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

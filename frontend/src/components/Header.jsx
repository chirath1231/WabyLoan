import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import { useTheme } from '../hooks/useTheme.js';

export default function Header() {
  const { user, isAuthenticated, isGuest, logout, openAuthPanel } = useAuth();
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="backdrop-blur sticky top-0 z-40 border-b" style={{ borderColor: 'var(--color-line)', background: 'color-mix(in srgb, var(--color-paper) 92%, transparent)' }}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex flex-col leading-tight">
          <span className="font-display font-bold text-lg" style={{ color: 'var(--color-teal-700)' }}>Waby Loan</span>
          <span className="text-[10px] font-mono tracking-wide" style={{ color: 'var(--color-text-400)' }}>{t('tagline')}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            className="admin-select !w-auto text-xs"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ height: 34 }}
          >
            <option value="en">EN</option>
            <option value="si">SI</option>
            <option value="ta">TA</option>
          </select>

          <button onClick={toggleTheme} className="btn-ghost rounded-lg w-9 h-9 flex items-center justify-center" aria-label="Toggle theme">
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
          </button>

          <Link to="/admin" className="btn-ghost rounded-lg px-3 h-9 hidden sm:flex items-center text-sm">
            {t('adminConsole')}
          </Link>

          {isAuthenticated || isGuest ? (
            <div className="flex items-center gap-2">
              <span className="badge badge-teal hidden sm:inline-flex">{user.name}</span>
              <button onClick={logout} className="btn-ghost rounded-lg px-3 h-9 text-sm">{t('signOut')}</button>
            </div>
          ) : (
            <button onClick={() => openAuthPanel('signup')} className="btn-primary rounded-lg px-4 h-9 text-sm">
              {t('signIn')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

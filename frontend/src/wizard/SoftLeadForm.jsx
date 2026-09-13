import { useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { api, apiErrorMessage } from '../api/client.js';

const SL_PHONE_RE = /^0(7[0-9]|1[1-9])[0-9]{7}$/;

export default function SoftLeadForm({ category, bankId }) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (sent) {
    return <p className="text-sm font-semibold" style={{ color: 'var(--color-teal-700)' }}>Thanks — we'll be in touch shortly.</p>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required.');
    if (!SL_PHONE_RE.test(phone)) return setError('Enter a valid Sri Lankan mobile number (07XXXXXXXX).');
    setBusy(true);
    try {
      await api.post('/leads/soft', { name: name.trim(), phone, category, bankId });
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
      <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="tel" placeholder="07XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button type="submit" disabled={busy} className="btn-primary rounded-lg h-[42px] px-5 whitespace-nowrap">
        {t('requestCallback')}
      </button>
      {error && <p className="text-sm w-full" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </form>
  );
}

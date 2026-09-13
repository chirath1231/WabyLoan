import { useState } from 'react';
import { fmtNum } from '../utils/money.js';

// Formats with thousand separators on blur, shows the raw editable number on focus.
export default function MoneyInput({ value, onChange, placeholder, className = '' }) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      className={className}
      value={focused ? String(value || '') : fmtNum(value)}
      onFocus={(e) => {
        setFocused(true);
        requestAnimationFrame(() => e.target.select());
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        onChange(raw === '' ? 0 : parseInt(raw, 10));
      }}
    />
  );
}

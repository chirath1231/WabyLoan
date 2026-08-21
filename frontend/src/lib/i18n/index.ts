import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import si from './si.json';
import ta from './ta.json';

// SRS §7.4 — flat key->string dictionaries, one per locale. Dynamic content (OCR payslip data,
// Admin Console, bank remarks) is intentionally out of scope for translation (SRS §7.3), and the
// Sinhala/Tamil strings here are a starting baseline pending native-speaker review.
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      si: { translation: si },
      ta: { translation: ta },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18next;

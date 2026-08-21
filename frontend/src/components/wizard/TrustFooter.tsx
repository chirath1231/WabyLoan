'use client';

import { useTranslation } from 'react-i18next';

export function TrustFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-line bg-white py-6">
      <div className="mx-auto max-w-6xl space-y-1.5 px-4 sm:px-6">
        <p className="text-[12px] text-text-400">{t('footerDisclaimer')}</p>
        <p className="text-[12px] text-text-400">{t('footerPrivacy')}</p>
      </div>
    </footer>
  );
}

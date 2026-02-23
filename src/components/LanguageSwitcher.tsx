import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    const handle = (l: string) => setLang(l);
    i18n.on && i18n.on('languageChanged', handle);
    return () => {
      i18n.off && i18n.off('languageChanged', handle);
    };
  }, [i18n]);

  const toggle = () => {
    const next = (lang || 'en').startsWith('hi') ? 'en' : 'hi';
    i18n.changeLanguage(next);
    try {
      localStorage.setItem('locale', next);
    } catch {}
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={toggle}
        aria-label="Change language"
        className="px-3 py-1 rounded-md border bg-white/90 text-sm shadow"
      >
        {lang?.toUpperCase?.() || 'EN'}
      </button>
    </div>
  );
};

export default LanguageSwitcher;

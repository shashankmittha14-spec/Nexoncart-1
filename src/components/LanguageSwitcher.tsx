import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<string>(i18n.language || 'en');
  const [theme, setTheme] = useState<string>(localStorage.getItem('nexoncart_theme') || 'light');

  useEffect(() => {
    const handle = (l: string) => setLang(l);
    i18n.on && i18n.on('languageChanged', handle);
    return () => {
      i18n.off && i18n.off('languageChanged', handle);
    };
  }, [i18n]);

  useEffect(() => {
    // Watch for theme changes on html element
    const checkTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('nexoncart_theme') || 'light';
      setTheme(currentTheme);
    };
    
    // Check immediately
    checkTheme();
    
    // Listen for theme toggle button clicks
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

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
        className={`px-3 py-1 rounded-md border text-sm shadow font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-[#00ff00] text-black border-[#00ff00]'
            : 'bg-white/90 text-gray-900 border-gray-300'
        }`}
      >
        {lang?.toUpperCase?.() || 'EN'}
      </button>
    </div>
  );
};

export default LanguageSwitcher;

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'nexoncart_theme';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    // initialize from localStorage or system preference
    try {
      let t = theme;
      if (!t) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) t = stored;
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
        else t = 'light';
      }
      applyThemeToRoot(t);
      document.documentElement.setAttribute('data-theme', t);
      setTheme(t);
    } catch {}
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    try {
      applyThemeToRoot(next);
      document.documentElement.setAttribute('data-theme', next);
    } catch {}
    setTheme(next);
  };

  const darkVars: Record<string, string> = {
    '--background': '0 0% 0%',
    '--foreground': '0 0% 100%',
    '--card': '0 0% 6%',
    '--card-foreground': '0 0% 100%',
    '--popover': '0 0% 6%',
    '--popover-foreground': '0 0% 100%',
    '--primary-light': '152 60% 18%',
    '--secondary': '0 0% 6%',
    '--secondary-foreground': '0 0% 92%',
    '--muted': '0 0% 6%',
    '--muted-foreground': '0 0% 72%',
    '--accent-light': '12 90% 18%',
    '--success-light': '152 60% 18%',
    '--warning-light': '38 92% 18%',
    '--border': '0 0% 12%',
    '--input': '0 0% 8%',
    '--glass-bg': '0 0% 6% / 0.6',
    '--glass-border': '0 0% 8% / 0.6',
  };

  function applyThemeToRoot(t: string) {
    const root = document.documentElement;
    if (t === 'dark') {
      Object.entries(darkVars).forEach(([k, v]) => {
        try { root.style.setProperty(k, v); } catch {}
      });
    } else {
      // remove inline overrides so CSS :root values take effect
      Object.keys(darkVars).forEach((k) => {
        try { root.style.removeProperty(k); } catch {}
      });
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className={`px-3 py-1 rounded-md border text-sm shadow flex items-center gap-2 font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-[#00ff00] text-black border-[#00ff00]'
            : 'bg-white/90 text-gray-900 border-gray-300'
        }`}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        <span className="uppercase text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
    </div>
  );
};

export default ThemeToggle;

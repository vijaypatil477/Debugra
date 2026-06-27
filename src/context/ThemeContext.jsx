import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('debugra-global-theme');
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (e) {
      console.warn('localStorage is not accessible:', e);
    }
    return getSystemTheme();
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('debugra-global-theme', theme);
    } catch (e) {
      console.warn('Failed to set theme in localStorage:', e);
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      try {
        const stored = localStorage.getItem('debugra-global-theme');
        if (!stored) {
          setTheme(mediaQuery.matches ? 'dark' : 'light');
        }
      } catch (e) {
        // ignore
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

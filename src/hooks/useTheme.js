import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'debugra-color-theme';
const THEMES = ['dark', 'light'];

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (THEMES.includes(stored)) return stored;

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('debugra-theme') || 'dark';
  });

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('debugra-theme', theme);
  }, [theme]);

  const value = useMemo(() => {
    return {
      theme,
      isLight: theme === 'light',
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

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
    return 'dark'; // Default theme is dark
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('debugra-global-theme', theme);
    } catch (e) {
      console.warn('Failed to set theme in localStorage:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

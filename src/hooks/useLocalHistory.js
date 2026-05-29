import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'debugra_local_history';
const MAX_HISTORY = 5;

// Helper UUID generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function useLocalHistory() {
  const [localHistory, setLocalHistory] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLocalHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load local history from localStorage', e);
    }
  }, []);

  const addSnippet = useCallback((code, language) => {
    if (!code || !code.trim()) return;

    setLocalHistory((prev) => {
      // Don't add duplicate of the exact same code
      if (prev.length > 0 && prev[0].code === code && prev[0].language === language) {
        return prev;
      }

      const newItem = {
        id: generateUUID(),
        code,
        language,
        timestamp: Date.now(),
      };

      const newHistory = [newItem, ...prev].slice(0, MAX_HISTORY);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save local history to localStorage', e);
      }
      
      return newHistory;
    });
  }, []);

  const deleteSnippet = useCallback((id) => {
    setLocalHistory((prev) => {
      const newHistory = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error('Failed to save local history to localStorage', e);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setLocalHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear local history in localStorage', e);
    }
  }, []);

  return {
    localHistory,
    addSnippet,
    deleteSnippet,
    clearHistory
  };
}

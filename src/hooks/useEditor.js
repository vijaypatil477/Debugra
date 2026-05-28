import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LANGUAGES } from '../utils/languageConfig';
// 1. Add Zustand imports
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LANG_FILE_NAMES,
  INPUT_PATTERNS,
  DEFAULT_LANGUAGE,
  DEFAULT_FONT_SIZE,
  DEFAULT_EDITOR_FONT,
  DEFAULT_THEME,
} from '../config/constants';

// 2. Create the offline-first persistent store for code and language
const useEditorStore = create(
  persist(
    (set) => ({
      code: LANGUAGES[DEFAULT_LANGUAGE]?.template || '// Start coding...',
      language: DEFAULT_LANGUAGE,
      setCode: (newCode) => set({ code: newCode }),
      setLanguage: (newLang) => set({ language: newLang }),
    }),
    {
      name: 'debugra-editor-persistent-state', // Unique key in localStorage
    }
  )
);

/**
 * useEditor
 * Manages local editor state:
 *   - code, language, font size, cursor position
 *   - stdin detection and management
 *   - save to cloud and download as file
 */
export function useEditor({ user, onNeedAuth }) {
  // 3. Swap out local state for the persistent Zustand store
  const { code, setCode, language, setLanguage } = useEditorStore();

  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [fontFamily, setFontFamily] = useState(
    () => localStorage.getItem('debugra-editor-font') ?? DEFAULT_EDITOR_FONT
  );
  const [theme, setTheme] = useState(() => localStorage.getItem('debugra-theme') ?? DEFAULT_THEME);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [stdinValue, setStdinValue] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);
  const [needsInput, setNeedsInput] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const pattern = INPUT_PATTERNS[language];
      setNeedsInput(pattern ? pattern.test(code) : false);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, language]);

  useEffect(() => {
    localStorage.setItem('debugra-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('debugra-editor-font', fontFamily);
  }, [fontFamily]);

  // Auto-open stdin panel when input-reading functions are detected
  useEffect(() => {
    if (needsInput && !stdinOpen) setStdinOpen(true);
  }, [needsInput]);

  const changeLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    // Safely fetch template fallback
    const template = LANGUAGES[newLang]?.template || '';
    setCode(template);
  }, [setLanguage, setCode]);

  const increaseFontSize = useCallback(() => setFontSize((f) => Math.min(f + 1, 28)), []);
  const decreaseFontSize = useCallback(() => setFontSize((f) => Math.max(f - 1, 10)), []);

  const downloadCode = useCallback(() => {
    const filename = LANG_FILE_NAMES[language] || 'code.txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }, [code, language]);

  const saveToCloud = useCallback(async () => {
    if (!user) {
      onNeedAuth?.();
      toast.error('Sign in to save code');
      return;
    }

    const defaultName = LANG_FILE_NAMES[language] || 'code.txt';
    const fileName = window.prompt('Enter a name for this file:', defaultName);
    if (!fileName) return; // User cancelled

    try {
      await addDoc(collection(db, 'users', user.uid, 'savedCode'), {
        code,
        language,
        name: fileName,
        createdAt: serverTimestamp(),
      });
      toast.success('Code saved to cloud! ✦');
    } catch {
      toast.error('Save failed');
    }
  }, [user, code, language, onNeedAuth]);

  const loadCode = useCallback((newCode, newLang) => {
    setCode(newCode);
    if (newLang && LANGUAGES[newLang]) setLanguage(newLang);
  }, [setCode, setLanguage]);

  return {
    code,
    setCode,
    language,
    setLanguage,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    theme,
    setTheme,
    cursorPos,
    setCursorPos,
    stdinValue,
    setStdinValue,
    stdinOpen,
    setStdinOpen,
    needsInput,
    changeLanguage,
    increaseFontSize,
    decreaseFontSize,
    downloadCode,
    saveToCloud,
    loadCode,
  };
}

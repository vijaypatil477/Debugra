import { useState, useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LANGUAGES } from '../utils/languageConfig';
import {
  LANG_FILE_NAMES,
  INPUT_PATTERNS,
  DEFAULT_LANGUAGE,
  DEFAULT_FONT_SIZE,
  DEFAULT_EDITOR_FONT,
  DEFAULT_THEME,
} from '../config/constants';

const TAB_SIZE_VALUES = [2, 4];
const RULER_VALUES = [80, 120];
const AUTOSAVE_INTERVAL_VALUES = [0, 5000, 10000];

function getStoredNumber(key, fallback, validValues) {
  const raw = Number(localStorage.getItem(key));
  return validValues.includes(raw) ? raw : fallback;
}

function getStoredBoolean(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

function getStoredDraft() {
  try {
    const raw = localStorage.getItem('debugra-editor-draft');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.code !== 'string') return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * useEditor
 * Manages local editor state:
 *   - code, language, font size, cursor position
 *   - stdin detection and management
 *   - save to cloud and download as file
 */
export function useEditor({ user, onNeedAuth }) {
  const initialDraft = getStoredDraft();
  const initialLanguage =
    initialDraft?.language && LANGUAGES[initialDraft.language]
      ? initialDraft.language
      : DEFAULT_LANGUAGE;

  const [code, setCode] = useState(initialDraft?.code ?? LANGUAGES[initialLanguage].template);
  const [language, setLanguage] = useState(initialLanguage);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [fontFamily, setFontFamily] = useState(
    () => localStorage.getItem('debugra-editor-font') ?? DEFAULT_EDITOR_FONT
  );
  const [theme, setTheme] = useState(() => localStorage.getItem('debugra-theme') ?? DEFAULT_THEME);
  const [tabSize, setTabSizeState] = useState(() =>
    getStoredNumber('debugra-tab-size', 4, TAB_SIZE_VALUES)
  );
  const [minimapEnabled, setMinimapEnabledState] = useState(() =>
    getStoredBoolean('debugra-minimap-enabled', true)
  );
  const [rulerColumn, setRulerColumnState] = useState(() =>
    getStoredNumber('debugra-ruler-column', 80, RULER_VALUES)
  );
  const [autosaveInterval, setAutosaveIntervalState] = useState(() =>
    getStoredNumber('debugra-autosave-interval', 0, AUTOSAVE_INTERVAL_VALUES)
  );
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [stdinValue, setStdinValue] = useState(initialDraft?.stdinValue ?? '');
  const [stdinOpen, setStdinOpen] = useState(false);

  const [needsInput, setNeedsInput] = useState(false);
  const autosaveSnapshotRef = useRef({ code, language, stdinValue });

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

  useEffect(() => {
    localStorage.setItem('debugra-tab-size', String(tabSize));
  }, [tabSize]);

  useEffect(() => {
    localStorage.setItem('debugra-minimap-enabled', String(minimapEnabled));
  }, [minimapEnabled]);

  useEffect(() => {
    localStorage.setItem('debugra-ruler-column', String(rulerColumn));
  }, [rulerColumn]);

  useEffect(() => {
    localStorage.setItem('debugra-autosave-interval', String(autosaveInterval));
  }, [autosaveInterval]);

  useEffect(() => {
    autosaveSnapshotRef.current = { code, language, stdinValue };
  }, [code, language, stdinValue]);

  useEffect(() => {
    if (!autosaveInterval) return undefined;

    const timer = window.setInterval(() => {
      localStorage.setItem(
        'debugra-editor-draft',
        JSON.stringify({
          ...autosaveSnapshotRef.current,
          savedAt: Date.now(),
        })
      );
    }, autosaveInterval);

    return () => window.clearInterval(timer);
  }, [autosaveInterval]);

  // Auto-open stdin panel when input-reading functions are detected
  useEffect(() => {
    if (needsInput && !stdinOpen) setStdinOpen(true);
  }, [needsInput, stdinOpen]);

  const changeLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    setCode(LANGUAGES[newLang].template);
  }, []);

  const increaseFontSize = useCallback(() => setFontSize((f) => Math.min(f + 1, 28)), []);
  const decreaseFontSize = useCallback(() => setFontSize((f) => Math.max(f - 1, 10)), []);
  const setTabSize = useCallback(
    (value) => setTabSizeState(TAB_SIZE_VALUES.includes(Number(value)) ? Number(value) : 4),
    []
  );
  const setMinimapEnabled = useCallback((value) => setMinimapEnabledState(Boolean(value)), []);
  const setRulerColumn = useCallback(
    (value) => setRulerColumnState(RULER_VALUES.includes(Number(value)) ? Number(value) : 80),
    []
  );
  const setAutosaveInterval = useCallback(
    (value) =>
      setAutosaveIntervalState(
        AUTOSAVE_INTERVAL_VALUES.includes(Number(value)) ? Number(value) : 0
      ),
    []
  );

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
  }, []);

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
    tabSize,
    setTabSize,
    minimapEnabled,
    setMinimapEnabled,
    rulerColumn,
    setRulerColumn,
    autosaveInterval,
    setAutosaveInterval,
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

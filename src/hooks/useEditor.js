import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LANGUAGES } from '../utils/languageConfig';
import { useDebounce } from './useDebounce';
import {
  AUTO_SAVE_DEBOUNCE_MS,
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
  const [selectedCharSize, setSelectedCharSize] = useState(0);
  const [stdinValue, setStdinValue] = useState(initialDraft?.stdinValue ?? '');
  const [stdinOpen, setStdinOpen] = useState(false);

  const [vimEnabled, setVimEnabledState] = useState(() =>
    getStoredBoolean('debugra-vim-enabled', false)
  );

  const [needsInput, setNeedsInput] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState([]);
  const hasUserChangesRef = useRef(false);
  const isFlushingRef = useRef(false);
  const debouncedAutoSave = useDebounce(
    useMemo(() => ({ code, language }), [code, language]),
    AUTO_SAVE_DEBOUNCE_MS
  );

  const hasPendingChanges = pendingChanges.length > 0;
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
    localStorage.setItem('debugra-vim-enabled', String(vimEnabled));
  }, [vimEnabled]);

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

  const updateCode = useCallback((newCode) => {
    hasUserChangesRef.current = true;
    setCode(newCode);
  }, []);

  const updateLanguage = useCallback((newLang) => {
    hasUserChangesRef.current = true;
    setLanguage(newLang);
  }, []);

  const changeLanguage = useCallback((newLang) => {
    hasUserChangesRef.current = true;
    setLanguage(newLang);
    setCode(LANGUAGES[newLang].template);
  }, []);

  const setVimEnabled = useCallback((value) => setVimEnabledState(Boolean(value)), []);

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

  const buildAutoSavePayload = useCallback(
    (snapshot) => ({
      code: snapshot.code,
      language: snapshot.language,
      name: LANG_FILE_NAMES[snapshot.language] || 'code.txt',
      updatedAt: serverTimestamp(),
    }),
    []
  );

  const writeAutoSave = useCallback(
    async (snapshot) => {
      if (!user) return false;

      setSaveStatus('saving');

      try {
        await setDoc(
          doc(db, 'users', user.uid, 'editorAutosave', 'current'),
          buildAutoSavePayload(snapshot)
        );
        setLastSavedAt(new Date());
        setSaveStatus('saved');
        return true;
      } catch {
        setSaveStatus('error');
        return false;
      }
    },
    [buildAutoSavePayload, user]
  );

  const queuePendingChange = useCallback((snapshot) => {
    setPendingChanges((changes) => [...changes, snapshot]);
  }, []);

  const saveToCloud = useCallback(async () => {
    if (!user) {
      onNeedAuth?.();
      toast.error('Sign in to save code');
      return;
    }

    const defaultName = LANG_FILE_NAMES[language] || 'code.txt';
    const fileName = window.prompt('Enter a name for this file:', defaultName);
    if (!fileName) return; // User cancelled

    setSaveStatus('saving');

    try {
      await addDoc(collection(db, 'users', user.uid, 'savedCode'), {
        code,
        language,
        name: fileName,
        createdAt: serverTimestamp(),
      });
      setLastSavedAt(new Date());
      setSaveStatus('saved');
      toast.success('Code saved to cloud! ✦');
    } catch {
      setSaveStatus('error');
      toast.error('Save failed');
    }
  }, [user, code, language, onNeedAuth]);

  const loadCode = useCallback((newCode, newLang) => {
    hasUserChangesRef.current = true;
    setCode(newCode);
    if (newLang && LANGUAGES[newLang]) setLanguage(newLang);
  }, []);

  const flushPendingChanges = useCallback(async () => {
    if (!user || isFlushingRef.current) return;

    isFlushingRef.current = true;

    try {
      const changesToFlush = pendingChanges;

      for (const change of changesToFlush) {
        if (!navigator.onLine) break;

        const saved = await writeAutoSave(change);
        if (!saved) break;

        setPendingChanges((changes) => changes.slice(1));
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [pendingChanges, user, writeAutoSave]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      flushPendingChanges();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushPendingChanges]);

  useEffect(() => {
    if (!hasUserChangesRef.current) return;

    if (!user) {
      setSaveStatus('idle');
      return;
    }

    if (!navigator.onLine) {
      setIsOffline(true);
      setSaveStatus('idle');
      queuePendingChange(debouncedAutoSave);
      return;
    }

    writeAutoSave(debouncedAutoSave);
  }, [debouncedAutoSave, queuePendingChange, user, writeAutoSave]);

  useEffect(() => {
    if (!user || isOffline || !hasPendingChanges) return;
    flushPendingChanges();
  }, [flushPendingChanges, hasPendingChanges, isOffline, user]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveToCloud();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToCloud]);

  return {
    code,
    setCode: updateCode,
    language,
    setLanguage: updateLanguage,
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
    selectedCharSize,
    setSelectedCharSize,
    stdinValue,
    setStdinValue,
    stdinOpen,
    setStdinOpen,
    needsInput,
    saveStatus,
    lastSavedAt,
    isOffline,
    hasPendingChanges,
    changeLanguage,
    increaseFontSize,
    decreaseFontSize,
    downloadCode,
    saveToCloud,
    loadCode,

    vimEnabled,
    setVimEnabled,
  };
}

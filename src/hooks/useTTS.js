import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'debugra.tts';
const DEFAULT_SETTINGS = { enabled: false };

const readSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved);
    return { enabled: Boolean(parsed.enabled) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export function useTTS() {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const speak = useCallback(
    (outcome, execTime) => {
      if (!settings.enabled) return;
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const message =
        outcome === 'success'
          ? `Compilation succeeded. Run completed in ${execTime ?? 'unknown time'}.`
          : 'Compilation failed with errors.';

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [settings.enabled]
  );

  const setEnabled = useCallback((enabled) => {
    setSettings({ enabled });
  }, []);

  return {
    ttsEnabled: settings.enabled,
    setTTSEnabled: setEnabled,
    speak,
  };
}

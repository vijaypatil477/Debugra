import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'debugra.audioFeedback';
const DEFAULT_SETTINGS = {
  muted: false,
  volume: 0.55,
};

const AUDIO_SOURCES = {
  success: '/audio/execution-success.wav',
  error: '/audio/execution-error.wav',
};

const readSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved);
    return {
      muted: Boolean(parsed.muted),
      volume: Math.min(1, Math.max(0, Number(parsed.volume ?? DEFAULT_SETTINGS.volume))),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export function useAudioFeedback() {
  const [settings, setSettings] = useState(readSettings);
  const audioContextRef = useRef(null);
  const audioElementsRef = useRef({});
  const activeNodesRef = useRef([]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    return audioContextRef.current;
  }, []);

  const ensureAudioElements = useCallback(() => {
    if (typeof window === 'undefined') return {};

    Object.entries(AUDIO_SOURCES).forEach(([key, source]) => {
      if (!audioElementsRef.current[key]) {
        const audio = new Audio(source);
        // ensure cross-origin is handled if assets are hosted elsewhere
        try {
          audio.crossOrigin = 'anonymous';
        } catch (e) {
          // ignore cross-origin failures on local elements
        }
        audio.preload = 'auto';
        audio.load();
        audioElementsRef.current[key] = audio;
      }
    });

    return audioElementsRef.current;
  }, []);

  const prepare = useCallback(() => {
    ensureAudioElements();
    const context = getAudioContext();
    if (context?.state === 'suspended') {
      context.resume().catch(() => {});
    }
  }, [ensureAudioElements, getAudioContext]);

  const stopActiveNodes = useCallback(() => {
    activeNodesRef.current.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Already stopped.
      }
    });
    activeNodesRef.current = [];
  }, []);

  const playFallbackTone = useCallback(
    (outcome) => {
      const context = getAudioContext();
      if (!context) return;

      prepare();
      stopActiveNodes();

      const now = context.currentTime;
      const masterGain = context.createGain();
      const peakVolume = Math.min(0.28, settings.volume * 0.32);
      const notes =
        outcome === 'success'
          ? [
              { frequency: 659.25, start: 0, duration: 0.08 },
              { frequency: 880, start: 0.075, duration: 0.1 },
              { frequency: 1318.51, start: 0.17, duration: 0.16 },
            ]
          : [
              { frequency: 220, start: 0, duration: 0.1 },
              { frequency: 164.81, start: 0.11, duration: 0.18 },
            ];

      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(peakVolume, now + 0.015);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      masterGain.connect(context.destination);

      notes.forEach(({ frequency, start, duration }) => {
        const oscillator = context.createOscillator();
        const noteGain = context.createGain();
        const noteStart = now + start;
        const noteEnd = noteStart + duration;

        oscillator.type = outcome === 'success' ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        noteGain.gain.setValueAtTime(0.001, noteStart);
        noteGain.gain.linearRampToValueAtTime(1, noteStart + 0.012);
        noteGain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

        oscillator.connect(noteGain);
        noteGain.connect(masterGain);
        oscillator.start(noteStart);
        oscillator.stop(noteEnd + 0.03);
        activeNodesRef.current.push(oscillator);
      });

      window.setTimeout(() => {
        masterGain.disconnect();
        activeNodesRef.current = activeNodesRef.current.filter(
          (node) => node.context.currentTime < now + 0.45
        );
      }, 500);
    },
    [getAudioContext, prepare,  settings.volume, stopActiveNodes]
  );

  const playOutcome = useCallback(
    (outcome) => {
      if (settings.muted || settings.volume <= 0) return;

      const audioElements = ensureAudioElements();
      const audio = audioElements[outcome];

      if (!audio) {
        console.debug(
          '[audio] static asset missing for',
          outcome,
          '— falling back to synthesized tone'
        );
        console.debug(
          '[audio] static asset missing for',
          outcome,
          '— falling back to synthesized tone'
        );
        playFallbackTone(outcome);
        return;
      }

      Object.values(audioElements).forEach((element) => {
        element.pause();
        element.currentTime = 0;
      });

      audio.volume = settings.volume;
      // Attempt to resume the AudioContext (some browsers suspend until user gesture)
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch (e) {
        // ignore
      }

      const playPromise = audio.play();
      if (playPromise?.then) {
        playPromise
          .then(() => {
            console.debug('[audio] played', outcome);
          })
          .catch((err) => {
            console.warn('[audio] playback failed for', outcome, err);
            // show a single visible notification so users know why they hear nothing
            try {
              toast.error('Audio playback blocked — check tab/system volume');
            } catch (e) {
              // ignore toast display errors in non-UI environments
            }
            playFallbackTone(outcome);
          });
      }
    },
    [ensureAudioElements, playFallbackTone,  settings.volume]
  );

  const setMuted = useCallback((muted) => {
    setSettings((current) => ({ ...current, muted }));
  }, []);

  const setVolume = useCallback((volume) => {
    setSettings((current) => ({
      ...current,
      muted: false,
      volume: Math.min(1, Math.max(0, Number(volume))),
    }));
  }, []);

  const testSound = useCallback(() => {
    playOutcome('success');
  }, [playOutcome]);

  return {
    muted: 
    volume: settings.volume,
    setMuted,
    setVolume,
    prepare,
    playOutcome,
    testSound,
  };
}

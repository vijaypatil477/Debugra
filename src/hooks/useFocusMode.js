// src/hooks/useFocusMode.js
import { useState, useEffect, useCallback } from "react";

/**
 * useFocusMode
 * Manages focus mode state, Pomodoro timer, and keyboard shortcut (Ctrl/Cmd+Shift+F).
 */
export function useFocusMode() {
  const [isFocusMode, setIsFocusMode]     = useState(false);
  const [timerEnabled, setTimerEnabled]   = useState(false);
  const [secondsLeft, setSecondsLeft]     = useState(25 * 60); // 25 min
  const [isBreak, setIsBreak]             = useState(false);
  const [timerRunning, setTimerRunning]   = useState(false);

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use e.code instead of e.key for better locale/layout independence
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyF") {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Apply / remove body class ──────────────────────────────────────────────
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add("focus-mode-active");
    } else {
      document.body.classList.remove("focus-mode-active");
      // Reset timer when exiting
      setTimerRunning(false);
      setSecondsLeft(25 * 60);
      setIsBreak(false);
    }
    // Cleanup: always remove class on unmount to prevent leaking global state
    return () => {
      document.body.classList.remove("focus-mode-active");
    };
  }, [isFocusMode]);

  // ── Pomodoro countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    
    // Only depend on timerRunning to reduce interval recreation
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setIsBreak((prev) => !prev);
          // Alternate between 25 min work and 5 min break
          return !isBreak ? 5 * 60 : 25 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleFocusMode  = useCallback(() => setIsFocusMode((p) => !p), []);
  const toggleTimer      = useCallback(() => setTimerRunning((p) => !p), []);
  const toggleTimerPanel = useCallback(() => setTimerEnabled((p) => !p), []);

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    isFocusMode,
    toggleFocusMode,
    timerEnabled,
    toggleTimerPanel,
    timerRunning,
    toggleTimer,
    secondsLeft,
    isBreak,
    formatTime,
  };
}

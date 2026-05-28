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
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
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
  }, [isFocusMode]);

  // ── Pomodoro countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    if (secondsLeft <= 0) {
      // Flip between work and break
      setIsBreak((prev) => !prev);
      setSecondsLeft(isBreak ? 25 * 60 : 5 * 60);
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning, secondsLeft, isBreak]);

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

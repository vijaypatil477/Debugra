// src/components/Editor/FocusMode.jsx
import React from "react";

/**
 * FocusMode
 * Floating HUD shown only when focus mode is active.
 * Contains: exit button, optional Pomodoro timer.
 */
export default function FocusMode({
  isFocusMode,
  toggleFocusMode,
  timerEnabled,
  toggleTimerPanel,
  timerRunning,
  toggleTimer,
  secondsLeft,
  isBreak,
  formatTime,
}) {
  if (!isFocusMode) return null;

  return (
    <div className="focus-mode-hud" role="region" aria-label="Focus Mode controls">
      {/* ── Timer badge ─────────────────────────────────────── */}
      {timerEnabled && (
        <div
          className={`focus-timer-badge ${isBreak ? "break" : "work"} ${
            secondsLeft <= 60 ? "pulse" : ""
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="focus-timer-label">{isBreak ? "☕ Break" : "⏱ Focus"}</span>
          <span className="focus-timer-time">{formatTime(secondsLeft)}</span>
          <button
            className="focus-timer-toggle"
            onClick={toggleTimer}
            aria-label={timerRunning ? "Pause timer" : "Start timer"}
          >
            {timerRunning ? "⏸" : "▶"}
          </button>
        </div>
      )}

      {/* ── Controls row ────────────────────────────────────── */}
      <div className="focus-mode-controls">
        <button
          className="focus-control-btn"
          onClick={toggleTimerPanel}
          aria-label={timerEnabled ? "Hide Pomodoro timer" : "Show Pomodoro timer"}
          title={timerEnabled ? "Hide timer" : "Enable Pomodoro timer"}
        >
          {timerEnabled ? "⏱ Hide Timer" : "⏱ Timer"}
        </button>

        <button
          className="focus-control-btn exit"
          onClick={toggleFocusMode}
          aria-label="Exit focus mode"
          title="Exit Focus Mode (Esc)"
        >
          ✕ Exit Focus
        </button>
      </div>
    </div>
  );
}

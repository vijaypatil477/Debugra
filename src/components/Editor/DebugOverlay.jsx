import { useEffect, useRef } from 'react';

/**
 * DebugOverlay
 * Full-screen overlay that shows AI-powered error explanation when the user
 * clicks "Debug with AI" in the Errors tab header.
 *
 * Props:
 *   isOpen        — whether to render the overlay
 *   isLoading     — true while the AI request is in-flight
 *   response      — raw AI response ({ content: { issue, explanation, fix, bestPractice }, usage })
 *   onClose       — called when the user dismisses the overlay
 *   onApplyFix    — called when the user clicks "Fix My Code" (triggers toolbar Fix action)
 *   stderr        — the raw error text, shown in a collapsible block
 */
export default function DebugOverlay({ isOpen, isLoading, response, onClose, onApplyFix, stderr }) {
  const overlayRef = useRef(null);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Trap focus inside the overlay
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const content = response?.content || response;
  const usage = response?.usage;

  return (
    <div
      className="debug-overlay-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="AI Debug Explanation"
    >
      <div className="debug-overlay-card" ref={overlayRef} tabIndex={-1}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="debug-overlay-header">
          <div className="debug-overlay-title">
            <span className="debug-overlay-icon">🪲</span>
            <div>
              <span className="debug-overlay-title-text">AI Error Debugger</span>
              <span className="debug-overlay-subtitle">Plain-English crash explanation</span>
            </div>
          </div>
          <button
            className="debug-overlay-close"
            onClick={onClose}
            aria-label="Close debug overlay"
          >
            ✕
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="debug-overlay-body">
          {/* Loading state */}
          {isLoading && (
            <div className="debug-overlay-loading">
              <div className="debug-loading-spinner" />
              <div className="debug-loading-text">
                <p className="debug-loading-headline">Analyzing your error…</p>
                <p className="debug-loading-sub">AI is reading the stack trace and your code</p>
              </div>
              {/* Skeleton cards */}
              <div className="debug-skeleton-wrap">
                <div className="debug-skeleton debug-skeleton-short" />
                <div className="debug-skeleton debug-skeleton-long" />
                <div className="debug-skeleton debug-skeleton-medium" />
                <div className="debug-skeleton debug-skeleton-short" />
              </div>
            </div>
          )}

          {/* Result state */}
          {!isLoading && content && (
            <div className="debug-overlay-results">
              {/* Raw stderr collapsible */}
              {stderr && (
                <details className="debug-stderr-details">
                  <summary className="debug-stderr-summary">
                    <span>📋 Raw Error Output</span>
                  </summary>
                  <pre className="debug-stderr-pre">{stderr}</pre>
                </details>
              )}

              {/* Issue card */}
              {content.issue && (
                <div className="debug-ai-card debug-card-issue">
                  <div className="debug-card-label">
                    <span className="debug-card-dot debug-dot-red" />
                    What Went Wrong
                  </div>
                  <div className="debug-card-content">{content.issue}</div>
                </div>
              )}

              {/* Explanation card */}
              {content.explanation && (
                <div className="debug-ai-card debug-card-explain">
                  <div className="debug-card-label">
                    <span className="debug-card-dot debug-dot-blue" />
                    Why It Happened
                  </div>
                  <div className="debug-card-content">{content.explanation}</div>
                </div>
              )}

              {/* Fix card */}
              {content.fix && (
                <div className="debug-ai-card debug-card-fix">
                  <div className="debug-card-label">
                    <span className="debug-card-dot debug-dot-green" />
                    How to Fix It
                  </div>
                  <div className="debug-card-content">{content.fix}</div>
                </div>
              )}

              {/* Best practice card */}
              {content.bestPractice && (
                <div className="debug-ai-card debug-card-tip">
                  <div className="debug-card-label">
                    <span className="debug-card-dot debug-dot-yellow" />
                    ✦ Pro Tip
                  </div>
                  <div className="debug-card-content">{content.bestPractice}</div>
                </div>
              )}

              {/* Token usage footer */}
              {usage && (
                <div className="debug-usage-bar">
                  <span>⚡ {usage.total_tokens || 0} tokens</span>
                  <span>
                    🚀{' '}
                    {usage.completion_time
                      ? Math.round(usage.completion_tokens / usage.completion_time)
                      : 0}{' '}
                    T/s
                  </span>
                  <span>💰 ${(usage.total_tokens * 0.0000005).toFixed(6)}</span>
                </div>
              )}
            </div>
          )}

          {/* Empty state (shouldn't normally appear) */}
          {!isLoading && !content && (
            <div className="debug-overlay-empty">
              <p>No explanation available. Try running your code again.</p>
            </div>
          )}
        </div>

        {/* ── Footer actions ────────────────────────────────────────────── */}
        {!isLoading && content && (
          <div className="debug-overlay-footer">
            <button
              className="debug-footer-fix-btn"
              onClick={() => {
                onApplyFix();
                onClose();
              }}
              title="Let AI rewrite the code to fix the error"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Fix My Code
            </button>
            <button className="debug-footer-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

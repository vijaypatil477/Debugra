import React from 'react';
import { useCodeSummarizer } from '../../hooks/useCodeSummarizer';

/**
 * CodeSummarizerFAB
 * A floating action button that lives independently of the toolbar.
 * Receives `code` and `language` as props from EditorPage (read-only).
 * Opens a result panel with AI summary, complexity, and step-by-step breakdown.
 *
 * Usage in EditorPage.jsx (add ONCE, anywhere in the JSX — no toolbar slot needed):
 *   <CodeSummarizerFAB code={code} language={language} />
 */
export default function CodeSummarizerFAB({ code, language }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const { isOpen, isLoading, result, error, summarize, close } = useCodeSummarizer(apiUrl);

  return (
    <>
      {!isOpen && (
        <button
          className="csf-fab"
          onClick={() => summarize(code, language || 'javascript')}
          aria-label="Summarize code with AI"
          title="AI Code Summarizer (analyzes complexity + explains logic)"
        >
          <span className="csf-fab-icon">✦</span>
          <span className="csf-fab-label">Summarize</span>
        </button>
      )}

      {isOpen && (
        <div
          className="csf-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="csf-panel-title"
        >
          <div className="csf-panel-header">
            <span className="csf-panel-title" id="csf-panel-title">
              <span className="csf-accent">✦</span> Code Summary
            </span>
            <div className="csf-header-actions">
              <button
                className="csf-refresh-btn"
                onClick={() => summarize(code, language || 'javascript')}
                aria-label="Re-summarize"
                title="Re-run analysis"
                disabled={isLoading}
              >
                ↻
              </button>
              <button className="csf-close-btn" onClick={close} aria-label="Close summarizer">
                ✕
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="csf-loading" aria-live="polite">
              <div className="csf-spinner" />
              <span>Analyzing code...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="csf-error" role="alert">
              <span className="csf-error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!isLoading && result && (
            <div className="csf-content">
              <div className="csf-section">
                <div className="csf-section-label">
                  <span className="csf-dot summary" />
                  What this code does
                </div>
                <p className="csf-summary-text">{result.summary}</p>
              </div>

              <div className="csf-section">
                <div className="csf-section-label">
                  <span className="csf-dot complexity" />
                  Complexity
                </div>
                <div className="csf-complexity-row">
                  <div className="csf-complexity-badge">
                    <span className="csf-complexity-label">Time</span>
                    <span className="csf-complexity-value">{result.timeComplexity}</span>
                  </div>
                  <div className="csf-complexity-badge">
                    <span className="csf-complexity-label">Space</span>
                    <span className="csf-complexity-value">{result.spaceComplexity}</span>
                  </div>
                </div>
              </div>

              {result.steps.length > 0 && (
                <div className="csf-section">
                  <div className="csf-section-label">
                    <span className="csf-dot steps" />
                    Step-by-Step Breakdown
                  </div>
                  <ol className="csf-steps-list" aria-label="Code logic steps">
                    {result.steps.map((step, i) => (
                      <li key={i} className="csf-step-item">
                        <span className="csf-step-no">{i + 1}</span>
                        <span className="csf-step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

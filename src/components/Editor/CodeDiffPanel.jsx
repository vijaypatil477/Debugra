import React from "react";

/**
 * CodeDiffPanel
 * Shows AI summary + line-by-line diff between snapshot and current code.
 */
export default function CodeDiffPanel({
  isOpen,
  onClose,
  isDiffLoading,
  diffResult,
  diffError,
}) {
  if (!isOpen) return null;

  return (
    <div className="cdp-overlay" role="dialog" aria-modal="true" aria-labelledby="cdp-title-id">
      <div className="cdp-backdrop" onClick={onClose} />

      <div className="cdp-panel">
        <div className="cdp-header">
          <span className="cdp-title">
            <span className="cdp-title-icon">⟡</span>
            <span id="cdp-title-id">What Changed?</span>
          </span>
          <button className="cdp-close" onClick={onClose} aria-label="Close diff panel">✕</button>
        </div>

        {isDiffLoading && (
          <div className="cdp-loading" aria-live="polite">
            <div className="cdp-spinner" />
            <span>Analyzing changes with AI...</span>
          </div>
        )}

        {!isDiffLoading && diffResult && (
          <>
            <div className="cdp-summary-block">
              <div className="cdp-summary-label">
                <span className="cdp-dot ai" />
                AI Summary
              </div>
              {diffError && <div className="cdp-error">{diffError}</div>}
              <p className="cdp-summary-text">
                {diffResult.aiSummary || "No explanation available."}
              </p>
            </div>

            {!diffResult.isEmpty && diffResult.lines.length > 0 && (
              <div className="cdp-diff-block">
                <div className="cdp-summary-label">
                  <span className="cdp-dot diff" />
                  Line Changes
                </div>
                <div className="cdp-diff-table" role="table" aria-label="Code diff">
                  {diffResult.lines.map((line, i) => (
                    <div key={i} className={`cdp-diff-row cdp-diff-${line.type}`} role="row">
                      <span className="cdp-line-no">{line.lineNo}</span>
                      {line.type === "unchanged" && (
                        <span className="cdp-line-code cdp-unchanged">{line.newLine}</span>
                      )}
                      {line.type === "added" && (
                        <span className="cdp-line-code cdp-added">+ {line.newLine}</span>
                      )}
                      {line.type === "removed" && (
                        <span className="cdp-line-code cdp-removed">- {line.oldLine}</span>
                      )}
                      {line.type === "changed" && (
                        <div className="cdp-changed-pair">
                          <span className="cdp-line-code cdp-removed">- {line.oldLine}</span>
                          <span className="cdp-line-code cdp-added">+ {line.newLine}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diffResult.isEmpty && <div className="cdp-empty">{diffResult.aiSummary}</div>}
          </>
        )}
      </div>
    </div>
  );
}

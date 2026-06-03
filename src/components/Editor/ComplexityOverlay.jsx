import { useEffect, useRef } from 'react';

/**
 * ComplexityOverlay
 * Full-screen overlay that shows AI-powered Big-O Time & Space Complexity
 * analysis when the user clicks "Big-O" in the toolbar.
 *
 * Props:
 *   isOpen            — whether to render the overlay
 *   isLoading         — true while the AI request is in-flight
 *   response          — raw AI response ({ content: { functionName, timeComplexity, spaceComplexity, breakdown, overallRating, tips }, usage })
 *   onClose           — called when the user dismisses the overlay
 */
export default function ComplexityOverlay({ isOpen, isLoading, response, onClose }) {
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
      className="complexity-overlay-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Big-O Complexity Analyzer"
    >
      <div className="complexity-overlay-card" ref={overlayRef} tabIndex={-1}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="complexity-overlay-header">
          <div className="complexity-overlay-title">
            <span className="complexity-overlay-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </span>
            <div>
              <span className="complexity-overlay-title-text">Big-O Complexity Analyzer</span>
              <span className="complexity-overlay-subtitle">AI-powered time &amp; space analysis</span>
            </div>
          </div>
          <button
            className="complexity-overlay-close"
            onClick={onClose}
            aria-label="Close complexity overlay"
          >
            ✕
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="complexity-overlay-body">

          {/* Loading state */}
          {isLoading && (
            <div className="complexity-overlay-loading">
              <div className="complexity-loading-orbit">
                <div className="complexity-loading-spinner" />
                <span className="complexity-loading-o">O</span>
              </div>
              <div className="complexity-loading-text">
                <p className="complexity-loading-headline">Analyzing complexity…</p>
                <p className="complexity-loading-sub">Computing Big-O bounds across all operations</p>
              </div>
              <div className="complexity-skeleton-wrap">
                <div className="complexity-skeleton complexity-skeleton-chips" />
                <div className="complexity-skeleton complexity-skeleton-long" />
                <div className="complexity-skeleton complexity-skeleton-medium" />
                <div className="complexity-skeleton complexity-skeleton-short" />
              </div>
            </div>
          )}

          {/* Result state */}
          {!isLoading && content && (
            <div className="complexity-overlay-results">

              {/* Function name + overall rating badge */}
              <div className="complexity-fn-header">
                <div className="complexity-fn-name">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <span>{content.functionName || 'Code Block'}</span>
                </div>
                {content.overallRating && (
                  <span className={`complexity-rating-badge rating-${(content.overallRating || 'Good').toLowerCase()}`}>
                    {ratingIcon(content.overallRating)} {content.overallRating}
                  </span>
                )}
              </div>

              {/* Time Complexity Section */}
              <div className="complexity-section">
                <div className="complexity-section-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Time Complexity
                </div>
                <div className="complexity-chips-row">
                  <ComplexityChip label="Best Case" value={content.timeComplexity?.best} />
                  <ComplexityChip label="Average Case" value={content.timeComplexity?.average} accent />
                  <ComplexityChip label="Worst Case" value={content.timeComplexity?.worst} worst />
                </div>
                {content.timeComplexity?.explanation && (
                  <p className="complexity-explanation">{content.timeComplexity.explanation}</p>
                )}
              </div>

              {/* Space Complexity Section */}
              <div className="complexity-section">
                <div className="complexity-section-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                  Space Complexity
                </div>
                <div className="complexity-chips-row">
                  <ComplexityChip label="Memory Usage" value={content.spaceComplexity?.value} />
                </div>
                {content.spaceComplexity?.explanation && (
                  <p className="complexity-explanation">{content.spaceComplexity.explanation}</p>
                )}
              </div>

              {/* Complexity Severity Bar */}
              <ComplexitySeverityBar worst={content.timeComplexity?.worst} />

              {/* Breakdown Table */}
              {content.breakdown && content.breakdown.length > 0 && (
                <div className="complexity-section">
                  <div className="complexity-section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Operation Breakdown
                  </div>
                  <div className="complexity-breakdown-table">
                    <div className="complexity-breakdown-head">
                      <span>Operation</span>
                      <span>Complexity</span>
                      <span className="d-none d-md-block">Note</span>
                    </div>
                    {content.breakdown.map((item, i) => (
                      <div className="complexity-breakdown-row" key={i}>
                        <span className="breakdown-operation">{item.operation}</span>
                        <span>
                          <span className={`breakdown-chip chip-${getComplexityClass(item.complexity)}`}>
                            {item.complexity}
                          </span>
                        </span>
                        <span className="breakdown-note d-none d-md-block">{item.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips Section */}
              {content.tips && content.tips.length > 0 && (
                <div className="complexity-section">
                  <div className="complexity-section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Optimization Tips
                  </div>
                  <ul className="complexity-tips-list">
                    {content.tips.map((tip, i) => (
                      <li key={i} className="complexity-tip-item">
                        <span className="tip-bullet">✦</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Token usage footer */}
              {usage && (
                <div className="complexity-usage-bar">
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

          {/* Empty state */}
          {!isLoading && !content && (
            <div className="complexity-overlay-empty">
              <p>No analysis available. Make sure your code is not empty.</p>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {!isLoading && (
          <div className="complexity-overlay-footer">
            <button aria-label="Button" className="complexity-footer-close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper sub-components ───────────────────────────────────────────────────

function ComplexityChip({ label, value, accent, worst }) {
  const cls = getComplexityClass(value);
  return (
    <div className={`complexity-chip chip-${cls} ${accent ? 'chip-accent' : ''} ${worst ? 'chip-worst' : ''}`}>
      <span className="chip-label">{label}</span>
      <span className="chip-value">{value || '—'}</span>
    </div>
  );
}

function ComplexitySeverityBar({ worst }) {
  const levels = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)'];
  const normalized = normalizeComplexity(worst);
  const idx = levels.findIndex((l) => l === normalized);
  const activeIdx = idx >= 0 ? idx : 2;

  return (
    <div className="complexity-severity-bar-wrap">
      <div className="complexity-severity-label-row">
        <span>Optimal</span>
        <span>Worst Case</span>
      </div>
      <div className="complexity-severity-track">
        {levels.map((level, i) => (
          <div
            key={level}
            className={`complexity-severity-segment seg-${i} ${i <= activeIdx ? 'seg-active' : ''}`}
            title={level}
          />
        ))}
      </div>
      <div className="complexity-severity-marker" style={{ left: `${(activeIdx / (levels.length - 1)) * 100}%` }}>
        <span className="severity-marker-label">{normalized || worst || '—'}</span>
      </div>
    </div>
  );
}

// ─── Utility functions ────────────────────────────────────────────────────────

function normalizeComplexity(raw) {
  if (!raw) return null;
  const map = {
    'O(1)': 'O(1)',
    'O(log n)': 'O(log n)',
    'O(n)': 'O(n)',
    'O(n log n)': 'O(n log n)',
    'O(n^2)': 'O(n²)',
    'O(n²)': 'O(n²)',
    'O(n^3)': 'O(n³)',
    'O(n³)': 'O(n³)',
    'O(2^n)': 'O(2ⁿ)',
    'O(2ⁿ)': 'O(2ⁿ)',
    'O(n!)': 'O(n!)',
  };
  return map[raw] || raw;
}

function getComplexityClass(raw) {
  if (!raw) return 'unknown';
  const v = raw.toLowerCase().replace(/\s/g, '');
  if (v === 'o(1)') return 'constant';
  if (v.includes('logn') && !v.includes('nlog')) return 'logarithmic';
  if (v === 'o(n)') return 'linear';
  if (v.includes('nlogn') || v.includes('nlog')) return 'linearithmic';
  if (v.includes('n^2') || v.includes('n²')) return 'quadratic';
  if (v.includes('n^3') || v.includes('n³')) return 'cubic';
  if (v.includes('2^n') || v.includes('2ⁿ')) return 'exponential';
  if (v.includes('n!')) return 'factorial';
  return 'unknown';
}

function ratingIcon(rating) {
  const icons = {
    Excellent: '🟢',
    Good: '🔵',
    Fair: '🟡',
    Poor: '🟠',
    Critical: '🔴',
  };
  return icons[rating] || '⚪';
}

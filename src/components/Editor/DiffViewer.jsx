import { useMemo, useEffect, useCallback } from 'react';

/**
 * Minimal line-level diff using LCS backtracking.
 * Returns array of { type: 'removed'|'added'|'unchanged', line: string }
 */
function computeDiff(original, refactored) {
  const oldLines = original.split('\n');
  const newLines = refactored.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS DP table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack to build diff
  const diff = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.push({ type: 'unchanged', line: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: 'added', line: newLines[j - 1] });
      j--;
    } else {
      diff.push({ type: 'removed', line: oldLines[i - 1] });
      i--;
    }
  }
  return diff.reverse();
}

const BG = {
  removed: 'rgba(255,107,107,0.13)',
  added: 'rgba(78,201,176,0.13)',
  unchanged: 'transparent',
};
const PREFIX = { removed: '− ', added: '+ ', unchanged: '  ' };
const COLOR = { removed: '#ff6b6b', added: '#4ec9b0', unchanged: 'var(--text-1)' };

export default function DiffViewer({ original, refactored, onApply, onDiscard }) {
  const diff = useMemo(() => computeDiff(original, refactored), [original, refactored]);

  const added = diff.filter((d) => d.type === 'added').length;
  const removed = diff.filter((d) => d.type === 'removed').length;
  const hasChanges = added > 0 || removed > 0;

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onDiscard();
    },
    [onDiscard]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Build line number maps for each side
  let oldLineNum = 0;
  let newLineNum = 0;
  const diffWithNums = diff.map((entry) => {
    const result = { ...entry };
    if (entry.type === 'removed' || entry.type === 'unchanged') result.oldNum = ++oldLineNum;
    if (entry.type === 'added' || entry.type === 'unchanged') result.newNum = ++newLineNum;
    return result;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onMouseDown={onDiscard}
    >
      {/* Card — stop propagation so clicks inside don't close */}
      <div
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-0)' }}>
              ✦ Refactor Diff
            </span>
            {hasChanges ? (
              <>
                <span style={{ fontSize: '0.68rem', color: '#4ec9b0' }}>+{added}</span>
                <span style={{ fontSize: '0.68rem', color: '#ff6b6b' }}>−{removed}</span>
              </>
            ) : (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-2)' }}>no changes</span>
            )}
          </div>
          <button
            onClick={onDiscard}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-2)',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
            }}
            aria-label="Close diff viewer"
          >
            ✕
          </button>
        </div>

        {/* ── No-changes state ── */}
        {!hasChanges ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--text-2)',
              padding: '40px',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>✓</span>
            <span style={{ fontSize: '0.8rem' }}>
              AI found no improvements — your code is already clean!
            </span>
          </div>
        ) : (
          <>
            {/* ── Column labels ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: '5px 12px',
                  fontSize: '0.65rem',
                  color: '#ff6b6b',
                  borderRight: '1px solid var(--border)',
                }}
              >
                Original
              </div>
              <div style={{ padding: '5px 12px', fontSize: '0.65rem', color: '#4ec9b0' }}>
                Refactored
              </div>
            </div>

            {/* ── Diff body ── */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                {/* Left: original */}
                <div
                  style={{
                    borderRight: '1px solid var(--border)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.72rem',
                    overflowX: 'auto',
                  }}
                >
                  {diffWithNums.map((entry, idx) =>
                    entry.type !== 'added' ? (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          background: BG[entry.type],
                          color: COLOR[entry.type],
                          minHeight: '20px',
                        }}
                      >
                        <span
                          style={{
                            minWidth: '36px',
                            padding: '1px 6px',
                            textAlign: 'right',
                            color: 'var(--text-2)',
                            userSelect: 'none',
                            borderRight: '1px solid var(--border)',
                            flexShrink: 0,
                            fontSize: '0.65rem',
                          }}
                        >
                          {entry.oldNum}
                        </span>
                        <span style={{ padding: '1px 8px', whiteSpace: 'pre' }}>
                          {PREFIX[entry.type]}
                          {entry.line}
                        </span>
                      </div>
                    ) : (
                      <div key={idx} style={{ minHeight: '20px', display: 'flex' }}>
                        <span
                          style={{
                            minWidth: '36px',
                            borderRight: '1px solid var(--border)',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    )
                  )}
                </div>

                {/* Right: refactored */}
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.72rem',
                    overflowX: 'auto',
                  }}
                >
                  {diffWithNums.map((entry, idx) =>
                    entry.type !== 'removed' ? (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          background: BG[entry.type],
                          color: COLOR[entry.type],
                          minHeight: '20px',
                        }}
                      >
                        <span
                          style={{
                            minWidth: '36px',
                            padding: '1px 6px',
                            textAlign: 'right',
                            color: 'var(--text-2)',
                            userSelect: 'none',
                            borderRight: '1px solid var(--border)',
                            flexShrink: 0,
                            fontSize: '0.65rem',
                          }}
                        >
                          {entry.newNum}
                        </span>
                        <span style={{ padding: '1px 8px', whiteSpace: 'pre' }}>
                          {PREFIX[entry.type]}
                          {entry.line}
                        </span>
                      </div>
                    ) : (
                      <div key={idx} style={{ minHeight: '20px', display: 'flex' }}>
                        <span
                          style={{
                            minWidth: '36px',
                            borderRight: '1px solid var(--border)',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '10px 14px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onDiscard}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
              padding: '4px 14px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Discard
          </button>
          {hasChanges && (
            <button
              onClick={onApply}
              style={{
                background: 'var(--green)',
                border: 'none',
                color: '#fff',
                padding: '4px 14px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              Apply Refactor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

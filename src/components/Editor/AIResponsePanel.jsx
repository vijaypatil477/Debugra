import { useState, useEffect, useRef } from 'react';
import { downloadAsMarkdown, downloadAsText } from '../../utils/downloadReport';
import { LANGUAGES } from '../../utils/languageConfig';

/**
 * AIResponsePanel
 * Renders the AI output panel — handles loading, empty state, and all
 * response types: error explanation, fix, logic breakdown, trace, tests, complexity.
 * Also provides a download dropdown (Markdown / Plain Text) for offline reference.
 */
function TestCard({ tc, i }) {
  const [copied, setCopied] = useState(false);
  const isEdge = tc.type === 'edge';
  const handleCopy = () => {
    navigator.clipboard.writeText(`Input: ${tc.input}\nExpected: ${tc.expected}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="ai-card" style={{ marginBottom: '8px' }}>
      <div className="ai-card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--green)' }}>
        <span>
          Test {i + 1}{' '}
          <span style={{ fontSize: '0.58rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '4px', background: isEdge ? 'rgba(255,209,102,0.15)' : 'rgba(78,201,176,0.15)', color: isEdge ? '#ffd166' : 'var(--green)', border: `1px solid ${isEdge ? 'rgba(255,209,102,0.3)' : 'rgba(78,201,176,0.3)'}` }}>
            {isEdge ? '⚡ edge' : '✓ normal'}
          </span>
        </span>
        <button onClick={handleCopy} style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: copied ? 'var(--green)' : 'var(--text-2)', cursor: 'pointer' }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="ai-card-content">
        <div>Input: <code style={{ color: 'var(--text-0)' }}>{typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input ?? '')}</code></div>
<div>Expected: <code style={{ color: 'var(--green)' }}>{typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : String(tc.expected ?? '')}</code></div>
        {tc.description && <div style={{ marginTop: '4px', color: 'var(--text-2)', fontSize: '0.7rem' }}>{tc.description}</div>}
      </div>
    </div>
  );
}

function TestCasesPanel({ testCases }) {
  const edgeCount = testCases.filter(tc => tc.type === 'edge').length;
  const normalCount = testCases.length - edgeCount;
  const handleDownload = () => {
    const lines = testCases.map((tc, i) => [
      `// Test ${i + 1} — ${tc.type || 'normal'}`,
      `// Input:    ${tc.input}`,
      `// Expected: ${tc.expected}`,
      tc.description ? `// Note: ${tc.description}` : '',
      `assert(run(${tc.input}) === ${tc.expected});`,
      '',
    ].filter(Boolean).join('\n')).join('\n');
    const blob = new Blob([`// Auto-generated Test Cases — Debugra AI\n\n${lines}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tests.txt'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '8px 10px', background: 'rgba(78,201,176,0.07)', border: '1px solid rgba(78,201,176,0.2)', borderRadius: '6px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600 }}>✓ {testCases.length} Tests Generated</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-2)' }}>{normalCount} normal · {edgeCount} edge</span>
        </div>
        <button onClick={handleDownload} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(78,201,176,0.3)', background: 'rgba(78,201,176,0.1)', color: 'var(--green)', cursor: 'pointer' }}>
          ↓ Download
        </button>
      </div>
      {testCases.map((tc, i) => <TestCard key={i} tc={tc} i={i} />)}
    </div>
  );
}
export default function AIResponsePanel({ isLoading, response: rawResponse, onApplyFix, language }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
        <p style={{ color: 'var(--text-2)', marginTop: '12px', fontSize: '0.8rem' }}>
          AI is analyzing...
        </p>
      </div>
    );
  }

  if (!rawResponse) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-2)' }}>
        <p style={{ fontSize: '0.85rem' }}>AI Assistant</p>
        <p style={{ fontSize: '0.72rem', marginTop: '8px' }}>
          Use toolbar: Tests, Visualize, Explain, Fix
        </p>
      </div>
    );
  }

  const response = rawResponse.content || rawResponse;
  const usage = rawResponse.usage;
  const severityStyles = {
    High: { color: '#ff6b6b', border: 'rgba(255,107,107,0.35)', bg: 'rgba(255,107,107,0.08)' },
    Medium: { color: '#ffd166', border: 'rgba(255,209,102,0.35)', bg: 'rgba(255,209,102,0.08)' },
    Low: { color: '#4ec9b0', border: 'rgba(78,201,176,0.35)', bg: 'rgba(78,201,176,0.08)' },
  };
  const auditFindings = Array.isArray(response.findings) ? response.findings : null;
  const langName = language ? (LANGUAGES[language]?.name || language) : '';

  const handleDownloadMarkdown = () => {
    downloadAsMarkdown(rawResponse, langName);
    setDropdownOpen(false);
  };

  const handleDownloadText = () => {
    downloadAsText(rawResponse, langName);
    setDropdownOpen(false);
  };

  return (
    <div>
      {/* ─── Download Button ─────────────────────────────────────────────── */}
      <div className="ai-download-wrap" ref={dropdownRef}>
        <button
          className="ai-download-btn"
          onClick={() => setDropdownOpen((o) => !o)}
          title="Download AI report"
          aria-label="Download AI report"
          aria-expanded={dropdownOpen}
        >
          {/* Download arrow icon */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download</span>
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'transform 0.2s',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="ai-download-dropdown" role="menu">
            <button
              className="ai-download-option"
              role="menuitem"
              onClick={handleDownloadMarkdown}
            >
              {/* Markdown icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Download as Markdown</span>
              <span className="ai-download-ext">.md</span>
            </button>
            <button
              className="ai-download-option"
              role="menuitem"
              onClick={handleDownloadText}
            >
              {/* Text file icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Download as Plain Text</span>
              <span className="ai-download-ext">.txt</span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Response Cards ───────────────────────────────────────────────── */}
      {response.issue && (
        <div className="ai-card error">
          <div className="ai-card-label">Issue</div>
          <div className="ai-card-content">{response.issue}</div>
        </div>
      )}
      {response.explanation && (
        <div className="ai-card info">
          <div className="ai-card-label">Explanation</div>
          <div className="ai-card-content">{response.explanation}</div>
        </div>
      )}
      {response.fix && (
        <div className="ai-card success">
          <div className="ai-card-label">Fix</div>
          <div className="ai-card-content">{response.fix}</div>
        </div>
      )}
      {response.fixedCode && (
        <div className="ai-card">
          <div
            className="ai-card-label d-flex align-items-center justify-content-between"
            style={{ color: 'var(--green)' }}
          >
            <span>Fixed Code</span>
            {onApplyFix && (
              <button
                onClick={() => onApplyFix(response.fixedCode)}
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                }}
              >
                Apply Solution
              </button>
            )}
          </div>
          <pre
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-0)',
              whiteSpace: 'pre-wrap',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: '8px',
            }}
          >
            {response.fixedCode}
          </pre>
        </div>
      )}
      {Array.isArray(response.steps) && (
        <div style={{ marginBottom: '10px' }}>
          <div
            className="ai-card-label"
            style={{ color: 'var(--accent)', marginBottom: '8px', fontSize: '0.7rem' }}
          >
            ⟡ Execution Trace ({response.steps.length} steps)
          </div>
          {response.steps.map((step, i) => {
            const isString = typeof step === 'string';
            const desc = isString
              ? step
              : step.description || step.explanation || step.action || '';
            const line = isString ? null : step.line;
            const stepCode = isString ? null : step.code;
            const vars = isString ? null : step.variables;
            return (
              <div
                key={i}
                className="ai-card"
                style={{
                  padding: '8px 10px',
                  marginBottom: '6px',
                  borderLeftColor: 'var(--accent)',
                  borderLeftWidth: '3px',
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {line && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        color: 'var(--text-2)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      Line {line}
                    </span>
                  )}
                </div>
                {stepCode && (
                  <pre
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--yellow)',
                      fontFamily: "'JetBrains Mono', monospace",
                      margin: '4px 0',
                      padding: '4px 8px',
                      background: 'var(--bg-0)',
                      borderRadius: '3px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {stepCode}
                  </pre>
                )}
                {desc && (
                  <div className="ai-card-content" style={{ fontSize: '0.72rem' }}>
                    {desc}
                  </div>
                )}
                {vars && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '4px 8px',
                      background: 'rgba(78,201,176,0.08)',
                      borderRadius: '3px',
                      border: '1px solid rgba(78,201,176,0.15)',
                    }}
                  >
                    <span style={{ fontSize: '0.6rem', color: 'var(--green)', fontWeight: 600 }}>
                      Variables:{' '}
                    </span>
                    <code
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--yellow)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {typeof vars === 'string'
                        ? vars
                        : Object.entries(vars)
                            .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
                            .join(', ')}
                    </code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
            {Array.isArray(response.testCases) && (
        <TestCasesPanel testCases={response.testCases} />
      )}
        
      {auditFindings && (
        <div style={{ marginBottom: '10px' }}>
          <div
            className="ai-card-label"
            style={{ color: 'var(--accent)', marginBottom: '8px', fontSize: '0.7rem' }}
          >
            Security Audit
            {typeof response.riskScore === 'number' && (
              <span style={{ color: 'var(--text-2)', marginLeft: '8px', fontWeight: 500 }}>
                Risk {response.riskScore}/100
              </span>
            )}
          </div>
          {auditFindings.length === 0 ? (
            <div className="ai-card success">
              <div className="ai-card-label">No Findings</div>
              <div className="ai-card-content">
                No meaningful vulnerabilities were detected in this snippet.
              </div>
            </div>
          ) : (
            auditFindings.map((finding, i) => {
              const severity = finding.severity || 'Low';
              const style = severityStyles[severity] || severityStyles.Low;
              return (
                <div
                  key={`${severity}-${finding.title || i}`}
                  className="ai-card"
                  style={{
                    borderColor: style.border,
                    background: style.bg,
                    borderLeftColor: style.color,
                    borderLeftWidth: '3px',
                  }}
                >
                  <div
                    className="ai-card-label d-flex align-items-center justify-content-between"
                    style={{ color: style.color }}
                  >
                    <span>{finding.title || `Finding ${i + 1}`}</span>
                    <span
                      style={{
                        border: `1px solid ${style.border}`,
                        borderRadius: '999px',
                        padding: '1px 7px',
                        fontSize: '0.62rem',
                      }}
                    >
                      {severity}
                    </span>
                  </div>
                  {finding.explanation && (
                    <div className="ai-card-content">{finding.explanation}</div>
                  )}
                  {finding.evidence && (
                    <div className="ai-card-content" style={{ marginTop: '6px' }}>
                      <strong style={{ color: 'var(--text-0)' }}>Evidence:</strong>{' '}
                      {finding.evidence}
                    </div>
                  )}
                  {finding.suggestion && (
                    <div className="ai-card-content" style={{ marginTop: '6px' }}>
                      <strong style={{ color: 'var(--text-0)' }}>Fix:</strong>{' '}
                      {finding.suggestion}
                    </div>
                  )}
                  {finding.refactor && (
                    <div className="ai-card-content" style={{ marginTop: '6px' }}>
                      <strong style={{ color: 'var(--text-0)' }}>Refactor:</strong>{' '}
                      {finding.refactor}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {Array.isArray(response.remediationSteps) && response.remediationSteps.length > 0 && (
        <div className="ai-card" style={{ borderColor: 'rgba(86,156,214,0.3)' }}>
          <div className="ai-card-label" style={{ color: 'var(--accent)' }}>
            Remediation Steps
          </div>
          <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
            {response.remediationSteps.map((step, i) => (
              <li key={`${step}-${i}`} className="ai-card-content" style={{ marginBottom: '4px' }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
      {(response.complexity || response.timeComplexity) && (
        <div className="ai-card info">
          <div className="ai-card-label">Complexity</div>
          <div className="ai-card-content">
            Time:{' '}
            <strong style={{ color: 'var(--text-0)' }}>
              {response.complexity?.time || response.timeComplexity || 'N/A'}
            </strong>
            {' | '}
            Space:{' '}
            <strong style={{ color: 'var(--text-0)' }}>
              {response.complexity?.space || response.spaceComplexity || 'N/A'}
            </strong>
          </div>
        </div>
      )}
      {response.summary && (
        <div className="ai-card" style={{ borderColor: 'rgba(78,201,176,0.3)' }}>
          <div className="ai-card-label" style={{ color: 'var(--green)' }}>
            Summary
          </div>
          <div className="ai-card-content">{response.summary}</div>
        </div>
      )}
      {response.bestPractice && (
        <div className="ai-card" style={{ borderColor: 'rgba(220,220,170,0.3)' }}>
          <div className="ai-card-label" style={{ color: 'var(--yellow)' }}>
            ✦ Best Practice
          </div>
          <div className="ai-card-content">{response.bestPractice}</div>
        </div>
      )}
      {usage && (
        <div
          style={{
            marginTop: '15px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--text-2)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>⚡ Tokens: {usage.total_tokens || 0}</span>
          <span>
            🚀 Speed:{' '}
            {usage.completion_time
              ? Math.round(usage.completion_tokens / usage.completion_time)
              : 0}{' '}
            T/s
          </span>
          <span>💰 Cost: ${(usage.total_tokens * 0.0000005).toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useRef, useEffect } from 'react';

export default function DiagnosticsOverlay({ isOpen, onClose, diagnostics = [], setDiagnostics }) {
  const overlayRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Trap focus inside
  useEffect(() => {
    if (isOpen && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ─── Filtered Diagnostics (reversing for chronological order in charts, latest in table) ────────────────────────
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return diagnostics;
    return diagnostics.filter((d) => d.feature.toLowerCase().includes(filter.toLowerCase()));
  }, [diagnostics, filter]);

  // Chronological list for drawing the chart (left-to-right)
  const chartData = useMemo(() => {
    return [...filteredLogs].reverse();
  }, [filteredLogs]);

  // ─── Summary Analytics Calculations ──────────────────────────────────────────────
  const stats = useMemo(() => {
    if (diagnostics.length === 0) {
      return { avgLatency: 0, avgSpeed: 0, totalTokens: 0, cost: 0, count: 0 };
    }

    const count = diagnostics.length;
    const totalLatency = diagnostics.reduce((sum, d) => sum + d.latencyMs, 0) / 1000;
    const avgLatency = totalLatency / count;

    let speedCount = 0;
    let speedSum = 0;
    let totalTokens = 0;

    diagnostics.forEach((d) => {
      const prompt = d.usage?.prompt_tokens || 0;
      const completion = d.usage?.completion_tokens || 0;
      totalTokens += (prompt + completion);

      // Speed calculation
      let tps = 0;
      if (d.usage?.completion_time) {
        // Groq direct speed
        tps = completion / d.usage.completion_time;
      } else if (d.usage?.completion_tokens) {
        // Fallback to frontend latency
        tps = completion / (d.latencyMs / 1000);
      }
      
      if (tps > 0) {
        speedSum += tps;
        speedCount++;
      }
    });

    const avgSpeed = speedCount > 0 ? speedSum / speedCount : 0;
    // Estimate cost using average llama-3.3-70b rates ($0.59 / 1M input, $0.79 / 1M output)
    const cost = diagnostics.reduce((sum, d) => {
      const p = d.usage?.prompt_tokens || 0;
      const c = d.usage?.completion_tokens || 0;
      return sum + (p * 0.00000059 + c * 0.00000079);
    }, 0);

    return { avgLatency, avgSpeed, totalTokens, cost, count };
  }, [diagnostics]);

  // ─── SVG Chart Calculations ──────────────────────────────────────────────────────
  const chartSvg = useMemo(() => {
    const pointsCount = chartData.length;
    if (pointsCount === 0) return null;

    const width = 760;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Latency bounds (Y1: Left axis)
    const latencies = chartData.map((d) => d.latencyMs / 1000);
    const maxLatency = Math.max(...latencies, 1); // at least 1s
    const minLatency = 0;

    // Speed bounds (Y2: Right axis)
    const speeds = chartData.map((d) => {
      if (d.usage?.completion_time) return d.usage.completion_tokens / d.usage.completion_time;
      if (d.usage?.completion_tokens) return d.usage.completion_tokens / (d.latencyMs / 1000);
      return 0;
    });
    const maxSpeed = Math.max(...speeds, 20); // at least 20 T/s
    const minSpeed = 0;

    // Map each data point to X, Y1 (latency), Y2 (speed)
    const points = chartData.map((d, index) => {
      // X coordinate (evenly spaced)
      const x = paddingLeft + (pointsCount === 1 ? chartWidth / 2 : (index / (pointsCount - 1)) * chartWidth);

      // Y1 (Latency)
      const latencySec = d.latencyMs / 1000;
      const y1 = height - paddingBottom - ((latencySec - minLatency) / (maxLatency - minLatency)) * chartHeight;

      // Y2 (Speed)
      const tps = speeds[index];
      const y2 = height - paddingBottom - ((tps - minSpeed) / (maxSpeed - minSpeed)) * chartHeight;

      return { x, y1, y2, latencySec, speed: tps, index, raw: d };
    });

    // Create Path String for Latency
    let latencyPath = '';
    let latencyArea = '';
    if (points.length > 0) {
      latencyPath = `M ${points[0].x} ${points[0].y1} ` + points.slice(1).map(p => `L ${p.x} ${p.y1}`).join(' ');
      // Closed area path
      latencyArea = `${latencyPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    // Create Path String for Speed
    let speedPath = '';
    let speedArea = '';
    if (points.length > 0) {
      speedPath = `M ${points[0].x} ${points[0].y2} ` + points.slice(1).map(p => `L ${p.x} ${p.y2}`).join(' ');
      // Closed area path
      speedArea = `${speedPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    // Grid lines coordinates
    const horizontalGrid = [0.25, 0.5, 0.75].map(ratio => {
      const y = paddingTop + ratio * chartHeight;
      const latVal = maxLatency - ratio * (maxLatency - minLatency);
      const speedVal = maxSpeed - ratio * (maxSpeed - minSpeed);
      return { y, latVal, speedVal };
    });

    // Reference lines for Averages
    const avgLatencyY = height - paddingBottom - ((stats.avgLatency - minLatency) / (maxLatency - minLatency)) * chartHeight;
    const avgSpeedY = height - paddingBottom - ((stats.avgSpeed - minSpeed) / (maxSpeed - minSpeed)) * chartHeight;

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      points,
      latencyPath,
      latencyArea,
      speedPath,
      speedArea,
      maxLatency,
      maxSpeed,
      horizontalGrid,
      avgLatencyY,
      avgSpeedY,
    };
  }, [chartData, stats]);

  // ─── Simulate Call Utility ────────────────────────────────────────────────────────
  const handleSimulateCall = () => {
    const features = [
      'Explain Logic',
      'Fix Code',
      'Generate Tests',
      'Audit Code',
      'Visualize Execution',
      'Debug Error',
    ];
    const feature = features[Math.floor(Math.random() * features.length)];

    // Latency: random 1.2s to 3.8s
    const latencyMs = Math.round(1200 + Math.random() * 2600);

    // Speed: random 38 to 72 tokens/sec
    const speed = Math.round(38 + Math.random() * 34);

    // Tokens
    const prompt_tokens = Math.round(200 + Math.random() * 500);
    const completion_tokens = Math.round(250 + Math.random() * 850);
    const total_tokens = prompt_tokens + completion_tokens;

    // Groq simulation completion time
    const completion_time = completion_tokens / speed;

    const mockDiagnostic = {
      feature,
      latencyMs,
      usage: {
        prompt_tokens,
        completion_tokens,
        total_tokens,
        completion_time,
      },
      timestamp: new Date().toISOString(),
    };

    setDiagnostics((prev) => [mockDiagnostic, ...prev]);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your diagnostics history?')) {
      setDiagnostics([]);
      setFilter('all');
    }
  };

  const handleDeleteEntry = (index) => {
    setDiagnostics((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  };

  const getFeatureBadgeClass = (feature) => {
    const f = feature.toLowerCase();
    if (f.includes('fix')) return 'badge-fix';
    if (f.includes('explain')) return 'badge-explain';
    if (f.includes('visualize')) return 'badge-visualize';
    if (f.includes('test')) return 'badge-tests';
    if (f.includes('audit')) return 'badge-audit';
    if (f.includes('debug')) return 'badge-debug';
    return 'badge-generic';
  };

  return (
    <div
      className="diagnostics-overlay-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="AI Performance Diagnostics Dashboard"
    >
      <div className="diagnostics-overlay-card" ref={overlayRef} tabIndex={-1}>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="diagnostics-overlay-header">
          <div className="diagnostics-overlay-title">
            <span className="diagnostics-overlay-icon">⚡</span>
            <div>
              <span className="diagnostics-overlay-title-text">AI Diagnostics Dashboard</span>
              <span className="diagnostics-overlay-subtitle">Live LLM response latencies & generation speeds</span>
            </div>
          </div>
          <button
            className="diagnostics-overlay-close"
            onClick={onClose}
            aria-label="Close diagnostics dashboard"
          >
            ✕
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div className="diagnostics-overlay-body">
          {/* ── Section 1: Summary Analytics Cards ────────────────────────────── */}
          <div className="diag-stats-grid">
            <div className="diag-stat-card accent-pink">
              <div className="diag-card-title">Average Latency</div>
              <div className="diag-card-value">{stats.avgLatency ? `${stats.avgLatency.toFixed(2)}s` : 'N/A'}</div>
              <div className="diag-card-desc">Frontend round-trip return time</div>
            </div>

            <div className="diag-stat-card accent-blue">
              <div className="diag-card-title">Average Speed</div>
              <div className="diag-card-value">{stats.avgSpeed ? `${Math.round(stats.avgSpeed)} T/s` : 'N/A'}</div>
              <div className="diag-card-desc">Groq token production rate</div>
            </div>

            <div className="diag-stat-card accent-teal">
              <div className="diag-card-title">Total Tokens</div>
              <div className="diag-card-value">{stats.totalTokens ? stats.totalTokens.toLocaleString() : 0}</div>
              <div className="diag-card-desc">Cumulative volume consumed</div>
            </div>

            <div className="diag-stat-card accent-purple">
              <div className="diag-card-title">Estimated Cost</div>
              <div className="diag-card-value">${stats.cost ? stats.cost.toFixed(4) : '0.0000'}</div>
              <div className="diag-card-desc">Llama-3.3-70b-versatile rates</div>
            </div>
          </div>

          {/* ── Section 2: Interactive SVG Area Chart ─────────────────────────── */}
          <div className="diag-graph-card">
            <div className="diag-graph-header">
              <div className="diag-graph-title">
                📊 LLM Trend Mapping ({chartData.length} continuous calls)
              </div>
              <div className="diag-graph-legends">
                <div className="diag-legend-item">
                  <span className="diag-legend-dot legend-latency" />
                  Latency (s)
                </div>
                <div className="diag-legend-item">
                  <span className="diag-legend-dot legend-speed" />
                  Speed (Tokens/s)
                </div>
              </div>
            </div>

            <div className="diag-svg-wrapper">
              {chartData.length === 0 ? (
                <div className="chart-empty-state">
                  <div className="chart-empty-icon">📈</div>
                  <div className="chart-empty-title">No Diagnostics Data Yet</div>
                  <div className="chart-empty-sub">
                    Stats will populate automatically as you invoke AI features (Fix, Explain, Audit, etc.), or click <strong>Simulate Call</strong> below to test immediately!
                  </div>
                </div>
              ) : (
                <>
                  <svg
                    viewBox={`0 0 ${chartSvg.width} ${chartSvg.height}`}
                    width="100%"
                    height="100%"
                    style={{ overflow: 'visible' }}
                  >
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines */}
                    {chartSvg.horizontalGrid.map((grid, i) => (
                      <g key={i}>
                        <line
                          x1={chartSvg.paddingLeft}
                          y1={grid.y}
                          x2={chartSvg.width - chartSvg.paddingRight}
                          y2={grid.y}
                          className="chart-grid-line"
                        />
                        {/* Latency Axis Labels (Left) */}
                        <text
                          x={chartSvg.paddingLeft - 8}
                          y={grid.y + 3}
                          textAnchor="end"
                          className="chart-axis-text"
                        >
                          {grid.latVal.toFixed(1)}s
                        </text>
                        {/* Speed Axis Labels (Right) */}
                        <text
                          x={chartSvg.width - chartSvg.paddingRight + 8}
                          y={grid.y + 3}
                          textAnchor="start"
                          className="chart-axis-text"
                        >
                          {Math.round(grid.speedVal)} T/s
                        </text>
                      </g>
                    ))}

                    {/* X & Y Axis Lines */}
                    <line
                      x1={chartSvg.paddingLeft}
                      y1={chartSvg.height - chartSvg.paddingBottom}
                      x2={chartSvg.width - chartSvg.paddingRight}
                      y2={chartSvg.height - chartSvg.paddingBottom}
                      className="chart-axis-line"
                    />

                    {/* Average Reference Lines */}
                    {stats.avgLatency > 0 && chartSvg.avgLatencyY >= chartSvg.paddingTop && (
                      <line
                        x1={chartSvg.paddingLeft}
                        y1={chartSvg.avgLatencyY}
                        x2={chartSvg.width - chartSvg.paddingRight}
                        y2={chartSvg.avgLatencyY}
                        className="chart-ref-line chart-ref-latency"
                        title={`Avg Latency: ${stats.avgLatency.toFixed(2)}s`}
                      />
                    )}
                    {stats.avgSpeed > 0 && chartSvg.avgSpeedY >= chartSvg.paddingTop && (
                      <line
                        x1={chartSvg.paddingLeft}
                        y1={chartSvg.avgSpeedY}
                        x2={chartSvg.width - chartSvg.paddingRight}
                        y2={chartSvg.avgSpeedY}
                        className="chart-ref-line chart-ref-speed"
                        title={`Avg Speed: ${Math.round(stats.avgSpeed)} T/s`}
                      />
                    )}

                    {/* Filled Areas */}
                    {chartSvg.latencyArea && (
                      <path d={chartSvg.latencyArea} fill="url(#latencyGrad)" />
                    )}
                    {chartSvg.speedArea && (
                      <path d={chartSvg.speedArea} fill="url(#speedGrad)" />
                    )}

                    {/* Trending Lines */}
                    {chartSvg.latencyPath && (
                      <path d={chartSvg.latencyPath} className="chart-line-latency" />
                    )}
                    {chartSvg.speedPath && (
                      <path d={chartSvg.speedPath} className="chart-line-speed" />
                    )}

                    {/* Interaction Points (Speed & Latency) */}
                    {chartSvg.points.map((pt, i) => {
                      const dateText = new Date(pt.raw.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                      
                      return (
                        <g key={i}>
                          {/* Latency Dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y1}
                            r="4.5"
                            fill="#f472b6"
                            stroke="#fff"
                            strokeWidth="1.5"
                            className="chart-point"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const wrapperRect = e.currentTarget.ownerSVGElement.parentNode.getBoundingClientRect();
                              setHoveredPoint({
                                x: rect.left - wrapperRect.left + rect.width / 2,
                                y: rect.top - wrapperRect.top,
                                feature: pt.raw.feature,
                                latency: pt.latencySec.toFixed(2),
                                speed: Math.round(pt.speed),
                                tokens: pt.raw.usage?.total_tokens || 0,
                                time: dateText,
                              });
                            }}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />

                          {/* Speed Dot */}
                          <circle
                            cx={pt.x}
                            cy={pt.y2}
                            r="4.5"
                            fill="#3b82f6"
                            stroke="#fff"
                            strokeWidth="1.5"
                            className="chart-point"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const wrapperRect = e.currentTarget.ownerSVGElement.parentNode.getBoundingClientRect();
                              setHoveredPoint({
                                x: rect.left - wrapperRect.left + rect.width / 2,
                                y: rect.top - wrapperRect.top,
                                feature: pt.raw.feature,
                                latency: pt.latencySec.toFixed(2),
                                speed: Math.round(pt.speed),
                                tokens: pt.raw.usage?.total_tokens || 0,
                                time: dateText,
                              });
                            }}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* SVG Tooltip */}
                  {hoveredPoint && (
                    <div
                      className="chart-tooltip"
                      style={{
                        left: `${hoveredPoint.x}px`,
                        top: `${hoveredPoint.y}px`,
                      }}
                    >
                      <div className="tooltip-title">⚡ {hoveredPoint.feature}</div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Latency:</span>
                        <span className="tooltip-value text-latency">{hoveredPoint.latency}s</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Speed:</span>
                        <span className="tooltip-value text-speed">{hoveredPoint.speed} T/s</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-label">Tokens:</span>
                        <span className="tooltip-value text-tokens">{hoveredPoint.tokens}</span>
                      </div>
                      <div className="tooltip-row" style={{ marginTop: '4px', opacity: 0.6 }}>
                        <span className="tooltip-label">Time:</span>
                        <span className="tooltip-value">{hoveredPoint.time}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Section 3: Diagnostic Logs list & controls ───────────────────── */}
          <div className="diag-history-section">
            <div className="diag-history-bar">
              <div className="diag-bar-left">
                <span className="diag-section-title">Continuous Call Logs</span>
                <select
                  className="diag-filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter diagnostics by type"
                >
                  <option value="all">All Features</option>
                  <option value="fix">Fix Code</option>
                  <option value="explain">Explain Logic</option>
                  <option value="tests">Generate Tests</option>
                  <option value="audit">Audit Code</option>
                  <option value="visualize">Visualize Execution</option>
                  <option value="debug">Debug Error</option>
                </select>
              </div>

              <div className="diag-bar-actions">
                <button
                  className="diag-btn-sm diag-btn-simulate"
                  onClick={handleSimulateCall}
                  title="Simulate a mock AI call to test the graphs"
                >
                  🧪 Simulate Call
                </button>
                <button
                  className="diag-btn-sm diag-btn-danger"
                  onClick={handleClearHistory}
                  disabled={diagnostics.length === 0}
                  title="Clear all performance statistics"
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>

            <div className="diag-logs-container">
              {filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-2)', fontSize: '0.72rem' }}>
                  No logs match the current filter.
                </div>
              ) : (
                <table className="diag-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Feature Area</th>
                      <th>Latency</th>
                      <th>Tokens/Sec</th>
                      <th>Usage</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => {
                      const idx = diagnostics.indexOf(log); // true original index
                      const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                      
                      const tpsVal = log.usage?.completion_time
                        ? log.usage.completion_tokens / log.usage.completion_time
                        : log.usage?.completion_tokens
                        ? log.usage.completion_tokens / (log.latencyMs / 1000)
                        : 0;

                      return (
                        <tr key={index}>
                          <td className="text-mono">{dateStr}</td>
                          <td>
                            <span className={`diag-badge ${getFeatureBadgeClass(log.feature)}`}>
                              {log.feature}
                            </span>
                          </td>
                          <td className="text-mono font-weight-bold" style={{ color: '#f472b6' }}>
                            {(log.latencyMs / 1000).toFixed(2)}s
                          </td>
                          <td className="text-mono font-weight-bold" style={{ color: '#60a5fa' }}>
                            {tpsVal > 0 ? `${Math.round(tpsVal)} T/s` : 'N/A'}
                          </td>
                          <td className="text-mono" style={{ color: 'var(--text-2)' }}>
                            {log.usage ? (
                              <span title={`Prompt: ${log.usage.prompt_tokens} | Completion: ${log.usage.completion_tokens}`}>
                                {log.usage.total_tokens} tokens
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            <button
                              className="diag-delete-btn"
                              onClick={() => handleDeleteEntry(idx)}
                              title="Delete log entry"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

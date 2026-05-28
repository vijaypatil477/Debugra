import { useState, useEffect } from 'react';
import { getExecutionLogs, deleteExecutionLog, clearExecutionLogs } from '../../services/executionLogsDb';
import toast from 'react-hot-toast';

export default function ExecutionLogsPanel({ onLoadCode, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getExecutionLogs();
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load execution logs');
    }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteExecutionLog(id);
      setLogs((prev) => prev.filter((log) => log.id !== id));
      toast.success('Execution log deleted');
      if (expandedId === id) setExpandedId(null);
    } catch {
      toast.error('Failed to delete log');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire execution history?')) {
      return;
    }
    try {
      await clearExecutionLogs();
      setLogs([]);
      setExpandedId(null);
      toast.success('Execution history cleared');
    } catch {
      toast.error('Failed to clear execution history');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const LANG_ICONS = {
    python: 'PY',
    javascript: 'JS',
    typescript: 'TS',
    java: 'JAVA',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    go: 'GO',
    rust: 'RS',
    ruby: 'RB',
    php: 'PHP',
    swift: 'SW',
    bash: 'SH',
    sql: 'SQL',
  };

  const getStatusBadgeClass = (status) => {
    const type = status?.type || status;
    if (type === 'success') return 'bg-success-subtle text-success border border-success-subtle';
    if (type === 'error') return 'bg-danger-subtle text-danger border border-danger-subtle';
    return 'bg-secondary bg-opacity-25 text-secondary border border-transparent';
  };

  const getStatusText = (status) => {
    if (typeof status === 'object' && status !== null) {
      return status.text || status.type || 'Unknown';
    }
    return status || 'Unknown';
  };

  return (
    <div className="history-panel border-start border-secondary">
      {/* HEADER */}
      <div className="history-header d-flex align-items-center justify-content-between p-2 border-bottom border-secondary bg-dark">
        <div className="d-flex align-items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="small fw-bold text-light">Execution Logs</span>
          <span className="history-count badge bg-success bg-opacity-25 text-success-emphasis">
            {logs.length}
          </span>
        </div>
        <div className="d-flex gap-1">
          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="btn btn-link btn-sm p-1 text-danger history-action-btn"
              title="Clear all execution history"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          <button
            onClick={loadLogs}
            className="btn btn-link btn-sm p-1 text-secondary history-action-btn"
            title="Refresh"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="btn btn-link btn-sm p-1 text-secondary history-action-btn"
            title="Close"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="history-list p-2 overflow-auto flex-grow-1">
        {loading ? (
          <div className="history-empty d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border spinner-border-sm text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="small text-secondary mt-2">Loading execution history...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="history-empty d-flex flex-column align-items-center justify-content-center py-5 opacity-50">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span className="small mt-2">No execution logs yet</span>
            <span className="x-small opacity-75">Click &quot;Run&quot; to execute code and log results</span>
          </div>
        ) : (
          logs.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => toggleExpand(item.id)}
                className="history-item p-2 mb-2 rounded border border-secondary border-opacity-25 bg-dark transition-all hover-pointer"
                style={{ cursor: 'pointer' }}
              >
                <div className="history-item-top d-flex align-items-center justify-content-between gap-2 mb-1">
                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                    <span className="badge bg-secondary bg-opacity-25 text-info x-small fw-bold">
                      {LANG_ICONS[item.language] || 'CODE'}
                    </span>
                    <span className={`badge x-small px-1.5 py-0.5 rounded ${getStatusBadgeClass(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                  <span className="history-item-time x-small text-secondary flex-shrink-0">
                    {formatDate(item.timestamp)}
                  </span>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-1 mb-1">
                  <span className="x-small text-secondary-emphasis">
                    {item.execTime ? `Time: ${item.execTime}` : ''}
                  </span>
                  <span className="x-small text-primary opacity-75">
                    {isExpanded ? 'Click to collapse ▴' : 'Click to details ▾'}
                  </span>
                </div>

                {/* Code Preview */}
                <pre className="history-item-preview p-2 mb-1 bg-dark rounded border border-secondary text-secondary small text-truncate">
                  {(item.code || '').slice(0, 150)}
                  {item.code?.length > 150 ? '...' : ''}
                </pre>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div
                    className="expanded-details mt-2 p-2 rounded bg-black bg-opacity-25 border border-secondary border-opacity-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.stdin && (
                      <div className="mb-2">
                        <span className="fw-bold x-small text-info-emphasis d-block mb-1">Stdin:</span>
                        <pre className="p-1.5 bg-dark rounded text-secondary x-small overflow-auto max-vh-15">
                          {item.stdin}
                        </pre>
                      </div>
                    )}
                    {item.stdout && (
                      <div className="mb-2">
                        <span className="fw-bold x-small text-success-emphasis d-block mb-1">Stdout:</span>
                        <pre className="p-1.5 bg-dark rounded text-success x-small overflow-auto max-vh-20 whitespace-pre-wrap">
                          {item.stdout}
                        </pre>
                      </div>
                    )}
                    {item.stderr && (
                      <div className="mb-2">
                        <span className="fw-bold x-small text-danger-emphasis d-block mb-1">Stderr:</span>
                        <pre className="p-1.5 bg-dark rounded text-danger x-small overflow-auto max-vh-20 whitespace-pre-wrap">
                          {item.stderr}
                        </pre>
                      </div>
                    )}
                    <div className="d-flex gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25">
                      <button
                        onClick={() => {
                          onLoadCode(item.code, item.language);
                          toast.success('Code state restored in editor!');
                        }}
                        className="btn btn-sm btn-outline-success flex-grow-1 x-small d-flex align-items-center justify-content-center gap-1 py-1"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="23 4 23 10 17 10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Restore State
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="btn btn-sm btn-outline-danger x-small d-flex align-items-center justify-content-center py-1"
                        title="Delete log"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function HistoryPanel({ user, onLoadCode, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users', user.uid, 'savedCode'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error('Failed to load history');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savedCode', id));
      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const startRename = (id, currentName) => {
    setEditingId(id);
    setEditName(currentName || 'untitled');
  };

  const handleRenameSubmit = async (id, currentName) => {
    if (!editName || editName === currentName) {
      setEditingId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid, 'savedCode', id), { name: editName });
      setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, name: editName } : h)));
      toast.success('Renamed successfully');
    } catch {
      toast.error('Rename failed');
    }
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
  };

  const formatDate = (ts) => {
    if (!ts?.toDate) return 'Just now';
    const d = ts.toDate();
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <div className="history-panel border-start border-secondary">
      <div className="history-header d-flex align-items-center justify-content-between p-2 border-bottom border-secondary bg-dark">
        <div className="d-flex align-items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="small fw-bold text-light">Saved Code</span>
          <span className="history-count badge bg-primary bg-opacity-25 text-primary-emphasis">
            {history.length}
          </span>
        </div>
        <div className="d-flex gap-1">
          <button
            onClick={loadHistory}
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

      <div className="history-list p-2 overflow-auto flex-grow-1">
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
            {/* Themed Spinner using Bootstrap theme colors */}
            <div className="spinner-border text-success" role="status" style={{ width: "1.5rem", height: "1.5rem" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            {/* Pulsing Loading Text Label */}
            <span className="small text-muted text-uppercase tracking-wider placeholder-glow">
              Loading History...
            </span>
          </div>
        ) : history.length === 0 ? (
          <div className="history-empty d-flex flex-column align-items-center justify-content-center py-5 opacity-50">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="small mt-2">No saved code yet</span>
            <span className="x-small opacity-75">Use Save button to store code</span>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="history-item p-2 mb-2 rounded border border-transparent bg-hover transition-all"
            >
              <div className="history-item-top d-flex align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2 overflow-hidden">
                  <span className="badge bg-secondary bg-opacity-25 text-info x-small fw-bold">
                    {LANG_ICONS[item.language] || 'CODE'}
                  </span>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(item.id, item.name);
                        if (e.key === 'Escape') handleRenameCancel();
                      }}
                      onBlur={() => handleRenameSubmit(item.id, item.name)}
                      autoFocus
                    />
                  ) : (
                    <span className="history-item-name text-truncate small text-light fw-medium">
                      {item.name || 'untitled'}
                    </span>
                  )}
                </div>
                <span className="history-item-time x-small text-secondary flex-shrink-0">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <pre className="history-item-preview p-2 mb-2 bg-dark rounded border border-secondary text-secondary small text-truncate">
                {(item.code || '').slice(0, 120)}
                {item.code?.length > 120 ? '...' : ''}
              </pre>
              <div className="history-item-actions d-flex gap-2 mt-2">
                <button
                  onClick={() => {
                    onLoadCode(item.code, item.language);
                    toast.success('Code loaded!');
                  }}
                  className="btn btn-sm btn-outline-info flex-grow-1 x-small d-flex align-items-center justify-content-center gap-1 py-1"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Load
                </button>
                <button
                  onClick={() => startRename(item.id, item.name || 'untitled')}
                  className="btn btn-sm btn-outline-warning x-small d-flex align-items-center justify-content-center py-1"
                  title="Rename"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn btn-sm btn-outline-danger x-small d-flex align-items-center justify-content-center py-1"
                  title="Delete"
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
          ))
        )}
      </div>
    </div>
  );
}
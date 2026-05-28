import { useState, useEffect } from 'react';

const STORAGE_KEY = 'debugra_custom_snippets';

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
  'csharp', 'go', 'rust', 'php', 'ruby', 'swift',
];

export function loadCustomSnippets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCustomSnippets(snippets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

export default function SnippetManager({ onSnippetsChange }) {
  const [snippets, setSnippets] = useState(loadCustomSnippets);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({
    label: '',
    language: 'javascript',
    insertText: '',
    documentation: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    saveCustomSnippets(snippets);
    onSnippetsChange?.(snippets);
  }, [snippets]);

  function resetForm() {
    setForm({ label: '', language: 'javascript', insertText: '', documentation: '' });
    setError('');
    setEditIndex(null);
    setShowForm(false);
  }

  function handleSave() {
    const label = form.label.trim();
    const insertText = form.insertText.trim();

    if (!label) return setError('Shortcut is required.');
    if (!/^[a-zA-Z0-9_]+$/.test(label)) return setError('Shortcut can only contain letters, numbers, underscores.');
    if (!insertText) return setError('Code body is required.');

    // Check for duplicate label in same language (excluding current edit)
    const duplicate = snippets.some(
      (s, i) => s.label === label && s.language === form.language && i !== editIndex
    );
    if (duplicate) return setError(`Shortcut "${label}" already exists for ${form.language}.`);

    const newSnippet = {
      label,
      language: form.language,
      insertText,
      documentation: form.documentation.trim() || label,
    };

    if (editIndex !== null) {
      const updated = snippets.map((s, i) => (i === editIndex ? newSnippet : s));
      setSnippets(updated);
    } else {
      setSnippets([...snippets, newSnippet]);
    }
    resetForm();
  }

  function handleEdit(index) {
    setForm({ ...snippets[index] });
    setEditIndex(index);
    setShowForm(true);
    setError('');
  }

  function handleDelete(index) {
    setSnippets(snippets.filter((_, i) => i !== index));
  }

  const grouped = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
    const items = snippets.filter((s) => s.language === lang);
    if (items.length) acc[lang] = items;
    return acc;
  }, {});

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-1)', fontWeight: 600 }}>
          Custom Snippets ({snippets.length})
        </span>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditIndex(null); setForm({ label: '', language: 'javascript', insertText: '', documentation: '' }); setError(''); }}
            style={{
              fontSize: '0.65rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '2px 8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + New
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--bg-0)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 10,
          marginBottom: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              placeholder="Shortcut (e.g. mylog)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              style={inputStyle}
            />
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              style={{ ...inputStyle, flex: '0 0 auto' }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Description (optional)"
            value={form.documentation}
            onChange={(e) => setForm({ ...form, documentation: e.target.value })}
            style={inputStyle}
          />
          <textarea
            placeholder={"Code body (use $1, $2 for tab stops)\ne.g. console.log($1);"}
            value={form.insertText}
            onChange={(e) => setForm({ ...form, insertText: e.target.value })}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem' }}
          />
          {error && (
            <span style={{ fontSize: '0.65rem', color: 'var(--red)' }}>{error}</span>
          )}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button onClick={resetForm} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} style={saveBtnStyle}>
              {editIndex !== null ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Snippet List */}
      {snippets.length === 0 && !showForm ? (
        <p style={{ fontSize: '0.65rem', color: 'var(--text-2)', textAlign: 'center', padding: '8px 0' }}>
          No custom snippets yet. Click "+ New" to create one.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {Object.entries(grouped).map(([lang, items]) => (
            <div key={lang}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                {lang}
              </div>
              {items.map((s, idx) => {
                const globalIdx = snippets.indexOf(s);
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-0)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    padding: '3px 7px',
                    marginBottom: 2,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                      <code style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 700 }}>{s.label}</code>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.documentation}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => handleEdit(globalIdx)} style={iconBtnStyle} title="Edit">✎</button>
                      <button onClick={() => handleDelete(globalIdx)} style={{ ...iconBtnStyle, color: 'var(--red)' }} title="Delete">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-1)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  color: 'var(--text-0)',
  fontSize: '0.7rem',
  padding: '4px 7px',
  outline: 'none',
  boxSizing: 'border-box',
};

const saveBtnStyle = {
  fontSize: '0.65rem',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '3px 10px',
  cursor: 'pointer',
  fontWeight: 600,
};

const cancelBtnStyle = {
  fontSize: '0.65rem',
  background: 'var(--bg-1)',
  color: 'var(--text-1)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '3px 10px',
  cursor: 'pointer',
};

const iconBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-2)',
  cursor: 'pointer',
  fontSize: '0.75rem',
  padding: '0 2px',
  lineHeight: 1,
};

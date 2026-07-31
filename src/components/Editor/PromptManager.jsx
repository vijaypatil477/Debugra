import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PROMPT_PRESETS,
  DEFAULT_PROMPT_ID,
  findPromptById,
  loadActivePromptId,
  loadCustomPrompts,
  saveActivePromptId,
  saveCustomPrompts,
} from '../../utils/aiPromptManager';

export default function PromptManager() {
  const navigate = useNavigate();
  const [activePromptId, setActivePromptId] = useState(DEFAULT_PROMPT_ID);
  const [customPrompts, setCustomPrompts] = useState([]);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setCustomPrompts(loadCustomPrompts());
    setActivePromptId(loadActivePromptId());
  }, []);

  useEffect(() => {
    saveCustomPrompts(customPrompts);
  }, [customPrompts]);

  useEffect(() => {
    saveActivePromptId(activePromptId);
  }, [activePromptId]);

  const activePrompt = useMemo(
    () => findPromptById(activePromptId, customPrompts) || PROMPT_PRESETS[0],
    [activePromptId, customPrompts]
  );

  const handleSaveCustom = () => {
    setFormError('');
    if (!newPromptName.trim() || !newPromptText.trim()) {
      setFormError('Name and prompt are required.');
      return;
    }

    const newId = `custom-${Date.now()}`;
    setCustomPrompts([
      ...customPrompts,
      {
        id: newId,
        label: newPromptName.trim(),
        description: 'Custom prompt saved by you.',
        prompt: newPromptText.trim(),
      },
    ]);
    setActivePromptId(newId);
    setNewPromptName('');
    setNewPromptText('');
  };

  const handleRemoveCustom = (id) => {
    setCustomPrompts(customPrompts.filter((item) => item.id !== id));
    if (activePromptId === id) {
      setActivePromptId(DEFAULT_PROMPT_ID);
    }
  };

  return (
    <div className="landing-section" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h1 className="section-title" style={{ marginBottom: '12px' }}>
              Prompt Manager
            </h1>
            <p className="section-subtitle" style={{ maxWidth: '640px', marginTop: 0 }}>
              Customize how the AI responds across code fixes, explanations, tests, and audits.
              Save your favorite system instructions and select what should be sent to the LLM.
            </p>
            <p style={{ color: '#8b9ebb', marginTop: '8px', fontSize: '0.95rem' }}>
              Active prompt: <strong>{activePrompt.label}</strong>
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="landing-btn-primary" onClick={() => navigate('/editor')}>
              Back to Editor
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '18px',
            gridTemplateColumns: '1fr',
          }}
        >
          <section
            style={{
              padding: '22px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 16px' }}>Preset prompts</h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              {PROMPT_PRESETS.map((prompt) => (
                <div
                  key={prompt.id}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: prompt.id === activePromptId ? 'rgba(78, 201, 176, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: prompt.id === activePromptId ? '1px solid rgba(78, 201, 176, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>{prompt.label}</h3>
                      <p style={{ margin: 0, color: '#b3b3c3' }}>{prompt.description}</p>
                    </div>
                    <button
                      className="topbar-link"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => setActivePromptId(prompt.id)}
                    >
                      Activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              padding: '22px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 16px' }}>Saved custom prompts</h2>
            {customPrompts.length === 0 ? (
              <p style={{ color: '#b3b3c3' }}>No saved prompts yet. Add one below.</p>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {customPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: prompt.id === activePromptId ? 'rgba(78, 201, 176, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: prompt.id === activePromptId ? '1px solid rgba(78, 201, 176, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1rem' }}>{prompt.label}</h3>
                        <p style={{ margin: 0, color: '#b3b3c3' }}>{prompt.description}</p>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="topbar-link" onClick={() => setActivePromptId(prompt.id)}>
                          Activate
                        </button>
                        <button className="topbar-link" onClick={() => handleRemoveCustom(prompt.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            style={{
              padding: '22px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 16px' }}>Create a custom prompt</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem', color: '#e2e8f0' }}>
                Prompt name
                <input
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="e.g. Comment in Spanish"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: '#f4f4f5',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', fontSize: '0.9rem', color: '#e2e8f0' }}>
                System prompt
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="e.g. Always explain output in Spanish and with inline comments."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: '#f4f4f5',
                    fontFamily: 'inherit',
                  }}
                />
              </label>
              {formError && (
                <div style={{ color: '#f87171', fontSize: '0.9rem' }}>{formError}</div>
              )}
              <button className="landing-btn-primary" onClick={handleSaveCustom}>
                Save custom prompt
              </button>
            </div>
          </section>

          <section
            style={{
              padding: '22px',
              borderRadius: '18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 16px' }}>Active prompt preview</h2>
            <div
              style={{
                padding: '18px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                whiteSpace: 'pre-wrap',
                color: '#d4d4d8',
                fontFamily: 'inherit',
              }}
            >
              {activePrompt.prompt}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

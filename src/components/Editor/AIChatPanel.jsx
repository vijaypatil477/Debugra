import { useState, useEffect, useRef } from 'react';
import { aiChat } from '../../services/api';
import { LANGUAGES } from '../../utils/languageConfig';
import toast from 'react-hot-toast';

export default function AIChatPanel({ activeCode, language, onClose, onApplyFix }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    if (!textToSend) {
      setInput('');
    }

    const newMessages = [...messages, { role: 'user', content: queryText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const activeLanguageName = LANGUAGES[language]?.name || language;
      const codeContext = includeContext ? activeCode : '';

      const response = await aiChat(newMessages, codeContext, activeLanguageName);
      
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response.content || 'I could not generate a response.' }
      ]);
    } catch (err) {
      toast.error(err.message || 'AI request failed');
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `❌ Error: ${err.message || 'AI request failed. Please check your network connection and Groq API key.'}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    toast.success('Conversation history cleared');
  };

  const parseMessageContent = (text) => {
    // Regex splits by markdown code blocks: ```lang\ncode\n```
    const parts = text.split(/(```[a-zA-Z0-9+#-]*\n[\s\S]*?\n```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```([a-zA-Z0-9+#-]*)\n([\s\S]*?)\n```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);

        return (
          <div key={index} className="ai-chat-code-block my-2 rounded overflow-hidden border border-secondary bg-dark">
            <div className="d-flex align-items-center justify-content-between px-3 py-1.5 bg-secondary bg-opacity-30 border-bottom border-secondary" style={{ fontSize: '0.68rem' }}>
              <span className="text-secondary fw-bold text-uppercase">{lang || 'code'}</span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-info text-decoration-none x-small fw-semibold"
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success('Code copied!');
                  }}
                >
                  Copy
                </button>
                {onApplyFix && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-success text-decoration-none x-small fw-semibold"
                    onClick={() => {
                      onApplyFix(code);
                      toast.success('Solution applied to editor!');
                    }}
                  >
                    Apply to Editor
                  </button>
                )}
              </div>
            </div>
            <pre className="p-3 m-0 overflow-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part}
        </span>
      );
    });
  };

  const starterPrompts = [
    { label: 'Explain this file', text: 'Please explain what this entire file does step-by-step.' },
    { label: 'Find potential bugs', text: 'Can you audit this code and find any potential logic errors, edge cases, or bugs?' },
    { label: 'Suggest optimizations', text: 'How can I optimize this code for better time/space complexity or readability?' },
  ];

  return (
    <div className="ai-chat-sidebar-panel border-start border-secondary d-flex flex-column h-100 bg-dark text-light" style={{ width: '380px', flexShrink: 0, position: 'relative' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary bg-dark">
        <div className="d-flex align-items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))' }}
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
          </svg>
          <span className="small fw-bold text-light">AI Chat Assistant</span>
        </div>
        <div className="d-flex gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="btn btn-link btn-sm p-1 text-secondary history-action-btn"
              title="Clear Conversation"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-link btn-sm p-1 text-secondary history-action-btn"
            title="Close Panel"
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

      {/* Message History list */}
      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
        {messages.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-2 py-5" style={{ opacity: 0.85 }}>
            <div className="mb-3 p-3 bg-secondary bg-opacity-10 rounded-circle border border-secondary" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h6 className="fw-semibold text-light mb-1 small">Interactive AI Chat</h6>
            <p className="text-secondary x-small mb-4" style={{ lineHeight: 1.45, maxWidth: '260px' }}>
              Ask questions about your code, request refactorings, or debug errors collaboratively in real time.
            </p>
            
            <div className="w-100 d-flex flex-column gap-2" style={{ maxWidth: '280px' }}>
              {starterPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.text)}
                  className="btn btn-outline-secondary btn-sm text-start py-2 px-3 x-small text-light border-secondary bg-hover rounded-3"
                  style={{ transition: 'all 0.15s ease', fontSize: '0.72rem' }}
                >
                  💡 {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`d-flex flex-column ${m.role === 'user' ? 'align-items-end' : 'align-items-start'}`}
            >
              <div
                className="d-flex align-items-center gap-1.5 mb-1 px-1"
                style={{ fontSize: '0.62rem', color: 'var(--text-2)' }}
              >
                <strong>{m.role === 'user' ? 'You' : 'AI Assistant'}</strong>
              </div>
              <div
                className="p-3 rounded-3"
                style={{
                  maxWidth: '90%',
                  background: m.role === 'user' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: m.role === 'user' ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {parseMessageContent(m.content)}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="d-flex flex-column align-items-start">
            <div className="d-flex align-items-center gap-1.5 mb-1 px-1" style={{ fontSize: '0.62rem', color: 'var(--text-2)' }}>
              <strong>AI Assistant</strong>
            </div>
            <div className="p-3 rounded-3 bg-secondary bg-opacity-5 border border-secondary border-opacity-30 d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm text-info" role="status" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }} />
              <span className="x-small text-secondary">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input container */}
      <div className="p-3 border-top border-secondary bg-dark">
        <div className="d-flex align-items-center gap-2 mb-2 px-1">
          <label className="d-flex align-items-center gap-1.5 text-secondary x-small cursor-pointer" style={{ userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="accent-purple"
              style={{ width: '11px', height: '11px' }}
            />
            <span>Include active file context</span>
          </label>
        </div>

        <div className="d-flex align-items-center gap-2 rounded-3 bg-secondary bg-opacity-10 border border-secondary p-1 pl-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask AI about your code..."
            className="flex-grow-1 bg-transparent border-0 outline-none text-light py-1 px-2"
            style={{ fontSize: '0.78rem', boxShadow: 'none' }}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="btn btn-sm d-flex align-items-center justify-content-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: input.trim() ? '#8b5cf6' : 'rgba(255,255,255,0.03)',
              border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              color: input.trim() ? 'white' : '#475569'
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

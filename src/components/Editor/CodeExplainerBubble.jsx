import { useState, useRef, useEffect } from 'react';
import './CodeExplainerBubble.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CodeExplainerBubble = ({ selectedCode, language, position, onClose, apiKey }) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const bubbleRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedCode && selectedCode.trim().length > 0) {
      explainSnippet();
    }
  }, [selectedCode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const explainSnippet = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-groq-api-key'] = apiKey;

      const res = await fetch(`${API_BASE}/api/ai/explain-snippet`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: selectedCode, language }),
      });
      if (!res.ok) throw new Error('Failed to explain code');
      const data = await res.json();
      setExplanation(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAskFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || askingFollowUp) return;

    const question = followUpQuestion.trim();
    setFollowUpQuestion('');
    setAskingFollowUp(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-groq-api-key'] = apiKey;

      const res = await fetch(`${API_BASE}/api/ai/ask-followup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: selectedCode,
          language,
          question,
          previousExplanation: explanation?.explanation || '',
        }),
      });
      if (!res.ok) throw new Error('Failed to get answer');
      const data = await res.json();
      setQaHistory((prev) => [...prev, { question, answer: data.content }]);
    } catch (err) {
      setQaHistory((prev) => [
        ...prev,
        {
          question,
          answer: { answer: 'Sorry, something went wrong. Try again.', codeExample: '' },
        },
      ]);
    } finally {
      setAskingFollowUp(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!selectedCode || selectedCode.trim().length === 0) return null;

  const bubbleStyle = {
    top: position?.top ?? 100,
    left: position?.left ?? 100,
  };

  return (
    <div className="explainer-bubble" ref={bubbleRef} style={bubbleStyle}>
      <button className="explainer-close" onClick={onClose} aria-label="Close explainer">
        ×
      </button>

      {loading && (
        <div className="explainer-loading">
          <div className="explainer-spinner" />
          <span>Analyzing code...</span>
        </div>
      )}

      {error && (
        <div className="explainer-error">
          <span>⚠️ {error}</span>
          <button onClick={explainSnippet}>Retry</button>
        </div>
      )}

      {explanation && !loading && (
        <div className="explainer-content">
          <h3 className="explainer-title">💡 {explanation.title}</h3>
          <p className="explainer-text">{explanation.explanation}</p>

          {explanation.concepts && explanation.concepts.length > 0 && (
            <div className="explainer-concepts">
              {explanation.concepts.map((c, i) => (
                <span key={i} className="concept-tag">
                  {c}
                </span>
              ))}
            </div>
          )}

          {explanation.tip && (
            <div className="explainer-tip">
              <span>💡 Tip:</span> {explanation.tip}
            </div>
          )}

          {qaHistory.length > 0 && (
            <div className="qa-history">
              {qaHistory.map((qa, i) => (
                <div key={i} className="qa-item">
                  <div className="qa-question">🙋 {qa.question}</div>
                  <div className="qa-answer">{qa.answer.answer}</div>
                  {qa.answer.codeExample && <pre className="qa-code">{qa.answer.codeExample}</pre>}
                </div>
              ))}
            </div>
          )}

          <form className="explainer-followup" onSubmit={handleAskFollowUp}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a follow-up question..."
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              disabled={askingFollowUp}
            />
            <button type="submit" disabled={askingFollowUp || !followUpQuestion.trim()}>
              {askingFollowUp ? '...' : '→'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CodeExplainerBubble;

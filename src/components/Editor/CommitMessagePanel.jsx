import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CommitMessagePanel({ 
  commitMessage, 
  isLoading, 
  onRegenerate, 
  onClose 
}) {
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const copyToClipboard = (text, setCopiedState) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedState(true);
        toast.success('Copied to clipboard! 📋');
        setTimeout(() => setCopiedState(false), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy');
      });
  };

  const getFullMessage = () => {
    if (!commitMessage) return '';
    return commitMessage.body 
      ? `${commitMessage.header}\n\n${commitMessage.body}` 
      : commitMessage.header;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box commit-msg-modal"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title-left">
              <span style={{ marginRight: '6px' }}>📝</span> AI Commit Message
            </h2>
            <p className="modal-muted">
              Generated based on Conventional Commits standards by analyzing your local diff.
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="commit-msg-loading" style={{ textAlign: 'center', padding: '40px 0' }}>
            <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
            <p style={{ color: 'var(--text-2)', marginTop: '14px', fontSize: '0.8rem' }}>
              AI is analyzing code differences...
            </p>
          </div>
        ) : !commitMessage ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-2)' }}>
            <p style={{ fontSize: '0.85rem' }}>No commit message generated yet.</p>
            <button 
              className="run-btn" 
              style={{ marginTop: '12px' }} 
              onClick={onRegenerate}
            >
              Generate Message
            </button>
          </div>
        ) : (
          <div className="commit-msg-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Badges / Scope metadata */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className={`badge-type type-${commitMessage.type || 'feat'}`}>
                {commitMessage.type || 'feat'}
              </span>
              {commitMessage.scope && (
                <span className="badge-scope">
                  scope: {commitMessage.scope}
                </span>
              )}
            </div>

            {/* Commit Message Box */}
            <div className="commit-msg-card">
              {/* Header Box */}
              <div className="commit-msg-section">
                <div className="commit-msg-section-header d-flex justify-content-between align-items-center">
                  <span>Commit Header (Max 72 chars)</span>
                  <span 
                    style={{ 
                      fontSize: '0.62rem', 
                      color: (commitMessage.header?.length || 0) > 72 ? 'var(--red)' : 'var(--text-2)'
                    }}
                  >
                    {commitMessage.header?.length || 0}/72 chars
                  </span>
                </div>
                <div className="commit-msg-header-text">
                  {commitMessage.header}
                </div>
              </div>

              {/* Body Box */}
              {commitMessage.body && (
                <div className="commit-msg-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="commit-msg-section-header">Description / Changes Body</div>
                  <pre className="commit-msg-body-text">
                    {commitMessage.body}
                  </pre>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 justify-content-end align-items-center mt-2 flex-wrap">
              <button 
                type="button" 
                className="clear-btn" 
                onClick={onRegenerate}
              >
                🔄 Regenerate
              </button>
              <button 
                type="button" 
                className="clear-btn" 
                onClick={() => copyToClipboard(commitMessage.header, setCopiedHeader)}
                style={{ position: 'relative' }}
              >
                {copiedHeader ? '✓ Copied Header' : '📋 Copy Header'}
              </button>
              <button 
                type="button" 
                className="run-btn" 
                onClick={() => copyToClipboard(getFullMessage(), setCopiedFull)}
                style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
              >
                {copiedFull ? '✓ Copied Full Msg' : '✨ Copy Full Message'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import './VotePopup.css';

/**
 * VotePopup
 * Renders a premium, glassmorphic modal overlay when a collaborative code
 * execution vote is in progress. Shows initiator details, real-time approval/rejection
 * ratios with dynamic progress bars, and collapsible source code previews.
 */
export default function VotePopup({ room, user }) {
  const { roomData, activeUsers, castVote, clearVote } = room;
  const activeVote = roomData?.activeVote;
  const [showCode, setShowCode] = useState(false);

  const totalUsers = activeUsers?.length || 1;
  const approvalsCount = activeVote?.approvals?.length || 0;
  const rejectionsCount = activeVote?.rejections?.length || 0;

  const approvalPercent = Math.round((approvalsCount / totalUsers) * 100);
  const rejectionPercent = Math.round((rejectionsCount / totalUsers) * 100);

  const hasApproved = activeVote?.approvals?.includes(user?.uid);
  const hasRejected = activeVote?.rejections?.includes(user?.uid);
  const isInitiator = activeVote?.initiatorUid === user?.uid;

  // Consensus threshold: strictly greater than 50%
  const requiredApprovals = Math.floor(totalUsers / 2) + 1;

  // Scroll lock effect
  useEffect(() => {
    if (!activeVote) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeVote]);

  // Focus trap refs and handlers
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(containerRef.current.querySelectorAll(selectors)).filter((element) => {
      if (element.disabled) return false;
      if (element.getAttribute('aria-hidden') === 'true') return false;
      return element.getClientRects().length > 0;
    });
  }, []);

  // Save previous focus and trap focus inside modal
  useEffect(() => {
    if (!activeVote) return;
    previousFocusRef.current = document.activeElement;
    const timer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) focusable[0].focus();
    }, 50);
    return () => {
      clearTimeout(timer);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [activeVote, getFocusableElements]);

  // Escape key handler for closing the vote (initiator only)
  useEffect(() => {
    if (!activeVote || !isInitiator) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearVote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVote, isInitiator, clearVote]);

  // Tab trap inside the modal
  useEffect(() => {
    if (!activeVote) return;
    const handleTabTrap = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleTabTrap);
    return () => window.removeEventListener('keydown', handleTabTrap);
  }, [activeVote, getFocusableElements]);

  if (!activeVote) return null;

  return (
    <div className="vp-overlay">
      <div className="vp-container" role="dialog" aria-modal="true" aria-labelledby="vp-title" ref={containerRef}>
        {/* Header */}
        <div className="vp-header">
          <div className="vp-header-title" id="vp-title">
            <span className="vp-icon">🗳️</span>
            <span>Democratic Execution Vote</span>
          </div>
          {isInitiator && (
            <button className="vp-cancel-btn" onClick={clearVote} title="Cancel Vote (Esc)">
              Cancel
            </button>
          )}
        </div>

        {/* Initiator Statement */}
        <div className="vp-body">
          <p className="vp-statement">
            <strong className="vp-user">{activeVote.initiatorName}</strong> wants to compile code
            and run it on the remote compiler.
          </p>
          <span className="vp-budget-warning">⚠️ Consumes collective API budget</span>

          {/* Real-time Interactive Vote Bars */}
          <div className="vp-bars-container">
            {/* Approvals */}
            <div className="vp-bar-group">
              <div className="vp-bar-meta">
                <span className="vp-bar-label approve-text">Approvals 👍</span>
                <span className="vp-bar-stats approve-text">
                  {approvalsCount}/{totalUsers} ({approvalPercent}%)
                </span>
              </div>
              <div className="vp-bar-track">
                <div
                  className="vp-bar-fill vp-bar-fill--approve"
                  style={{ width: `${approvalPercent}%` }}
                />
              </div>
            </div>

            {/* Rejections */}
            <div className="vp-bar-group">
              <div className="vp-bar-meta">
                <span className="vp-bar-label reject-text">Rejections 👎</span>
                <span className="vp-bar-stats reject-text">
                  {rejectionsCount}/{totalUsers} ({rejectionPercent}%)
                </span>
              </div>
              <div className="vp-bar-track">
                <div
                  className="vp-bar-fill vp-bar-fill--reject"
                  style={{ width: `${rejectionPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="vp-consensus-hint">
            Consensus required: <strong>{requiredApprovals}</strong> approval
            {requiredApprovals > 1 ? 's' : ''} (&gt;50% of {totalUsers} active users).
          </div>

          {/* Action Buttons */}
          <div className="vp-actions">
            <button
              className={`vp-btn vp-btn--approve ${hasApproved ? 'active' : ''}`}
              onClick={() => castVote('approve')}
              disabled={hasApproved}
            >
              {hasApproved ? 'Approved 👍' : 'Approve'}
            </button>
            <button
              className={`vp-btn vp-btn--reject ${hasRejected ? 'active' : ''}`}
              onClick={() => castVote('reject')}
              disabled={hasRejected}
            >
              {hasRejected ? 'Rejected 👎' : 'Reject'}
            </button>
          </div>

          {/* Collapsible Code Preview (Uses Lightweight Firestore Previews) */}
          <div className="vp-preview-section">
            <button className="vp-preview-toggle" onClick={() => setShowCode(!showCode)}>
              <span>{showCode ? '▼ Hide Code Preview' : '▶ Show Code Preview'}</span>
              <span className="vp-preview-lang">{activeVote.language || 'text'}</span>
            </button>
            {showCode && (
              <div className="vp-code-box">
                <pre>
                  <code>{activeVote.codePreview}</code>
                </pre>
                {activeVote.stdinPreview && (
                  <div className="vp-stdin-preview">
                    <strong>stdin:</strong>
                    <pre>
                      <code>{activeVote.stdinPreview}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

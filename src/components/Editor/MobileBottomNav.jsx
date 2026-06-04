import { MOBILE_TABS } from '../../config/constants';
import { useNavigate } from 'react-router-dom';

/**
 * MobileBottomNav
 * The fixed bottom navigation bar that appears on mobile.
 * Provides tab navigation, a floating "Run" button, and quick-access icons.
 */
export default function MobileBottomNav({
  mobileTab,
  setMobileTab,
  onRun,
  onSave,
  isRunning,
  user,
  roomId,
  hasError,
  isReadOnly,
}) {
  const navigate = useNavigate();

  return (
    <div className="mobile-bottom-nav">
      <button
        className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.CODE ? 'active' : ''}`}
        onClick={() => setMobileTab(MOBILE_TABS.CODE)}
      >
        <i className="bi bi-code-slash" />
        <span>Code</span>
      </button>

      {/* Floating run button */}
      <button className="mobile-nav-run" onClick={onRun} disabled={isRunning}>
        {isRunning ? <span className="spinner" /> : <i className="bi bi-play-fill" />}
      </button>

      <button
        className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.OUTPUT ? 'active' : ''}`}
        onClick={() => setMobileTab(MOBILE_TABS.OUTPUT)}
      >
        <i className="bi bi-terminal" />
        <span>Output</span>
        {hasError && <span className="mobile-nav-dot" />}
      </button>

      {user && (
        <button className="mobile-nav-btn" onClick={onSave} disabled={isReadOnly}>
          <i className="bi bi-cloud-arrow-up" />
          <span>Save</span>
        </button>
      )}

      {user && (
        <button
          className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.SAVED ? 'active' : ''}`}
          onClick={() => setMobileTab(MOBILE_TABS.SAVED)}
        >
          <i className="bi bi-clock-history" />
          <span>History</span>
        </button>
      )}

      {roomId && (
        <button
          className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.CHAT ? 'active' : ''}`}
          onClick={() => setMobileTab(MOBILE_TABS.CHAT)}
        >
          <i className="bi bi-chat-dots" />
          <span>Chat</span>
        </button>
      )}

      <button className="mobile-nav-btn" onClick={() => navigate('/feedback')}>
        <i className="bi bi-chat-square-text" />
        <span>Feedback</span>
      </button>
    </div>
  );
}

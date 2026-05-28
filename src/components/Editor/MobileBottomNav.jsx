import { MOBILE_TABS } from '../../config/constants';

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
  return (
    <div className="mobile-bottom-nav">
      <button aria-label="button"
        className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.CODE ? 'active' : ''}`}
        onClick={() => setMobileTab(MOBILE_TABS.CODE)}
      >
        <i className="bi bi-code-slash" />
        <span>Code</span>
      </button>

      {/* Floating run button */}
      <button aria-label="button" className="mobile-nav-run" onClick={onRun} disabled={isRunning}>
        {isRunning ? <span className="spinner" /> : <i className="bi bi-play-fill" />}
      </button>

      <button aria-label="button"
        className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.OUTPUT ? 'active' : ''}`}
        onClick={() => setMobileTab(MOBILE_TABS.OUTPUT)}
      >
        <i className="bi bi-terminal" />
        <span>Output</span>
        {hasError && <span className="mobile-nav-dot" />}
      </button>

      {user && (
        <button aria-label="button" className="mobile-nav-btn" onClick={onSave} disabled={isReadOnly}>
          <i className="bi bi-cloud-arrow-up" />
          <span>Save</span>
        </button>
      )}

      {user && (
        <button aria-label="button"
          className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.SAVED ? 'active' : ''}`}
          onClick={() => setMobileTab(MOBILE_TABS.SAVED)}
        >
          <i className="bi bi-clock-history" />
          <span>History</span>
        </button>
      )}

      {roomId && (
        <button aria-label="button"
          className={`mobile-nav-btn ${mobileTab === MOBILE_TABS.CHAT ? 'active' : ''}`}
          onClick={() => setMobileTab(MOBILE_TABS.CHAT)}
        >
          <i className="bi bi-chat-dots" />
          <span>Chat</span>
        </button>
      )}
    </div>
  );
}

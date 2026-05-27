import { useState } from 'react';
import { Menu, X, Volume2, VolumeX } from 'lucide-react';
import { EDITOR_THEMES } from '../../config/constants';
import HistoryPanel from './HistoryPanel';

/**
 * MobileDrawer
 * Responsive drawer component for mobile devices (< 768px)
 * Includes hamburger menu, history panel, and settings
 */
export default function MobileDrawer({
  isMobile,
  isOpen,
  onOpen,
  onClose,
  user,
  editor,
  audioFeedback,
  showHistory,
  setShowHistory,
  onLoadCode,
}) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'history'

  if (!isMobile) return null;

  const handleLoadCode = (code, language) => {
    if (onLoadCode) {
      onLoadCode(code, language);
    }
    onClose();
  };

  return (
    <>
      {/* ===== HAMBURGER BUTTON ===== */}
      <button
        className="mobile-drawer-toggle"
        onClick={onOpen}
        aria-label="Open menu"
        aria-expanded={isOpen}
        title="Menu"
      >
        <Menu size={20} />
      </button>

      {/* ===== DRAWER OVERLAY ===== */}
      {isOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={onClose}
          aria-label="Close menu"
        />
      )}

      {/* ===== DRAWER PANEL ===== */}
      <div
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Sidebar menu"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <h3>Menu</h3>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="drawer-tabs">
          <button
            className={`drawer-tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            Settings
          </button>
          {user && (
            <button
              className={`drawer-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="drawer-content">
          {/* Settings Tab */}
          {activeTab === 'menu' && (
            <div className="drawer-panel-content">
              {/* Theme Setting */}
              <div className="drawer-settings-group">
                <label className="drawer-settings-label">
                  <i className="bi bi-palette" style={{ fontSize: '14px' }} />
                  <span>Theme</span>
                </label>
                <select
                  className="drawer-select"
                  value={editor.theme}
                  onChange={(e) => editor.setTheme(e.target.value)}
                  aria-label="Editor theme"
                >
                  {EDITOR_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size Setting */}
              <div className="drawer-settings-group">
                <label className="drawer-settings-label">
                  <i className="bi bi-type" style={{ fontSize: '14px' }} />
                  <span>Font Size</span>
                </label>
                <div className="drawer-font-size-control">
                  <button
                    className="drawer-size-btn"
                    onClick={() =>
                      editor.setFontSize(Math.max(10, editor.fontSize - 2))
                    }
                    aria-label="Decrease font size"
                  >
                    −
                  </button>
                  <span className="drawer-size-value">{editor.fontSize}px</span>
                  <button
                    className="drawer-size-btn"
                    onClick={() =>
                      editor.setFontSize(Math.min(28, editor.fontSize + 2))
                    }
                    aria-label="Increase font size"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Audio Feedback Setting */}
              <div className="drawer-settings-group">
                <label className="drawer-settings-label">
                  {audioFeedback.muted ? (
                    <VolumeX size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  <span>Audio Feedback</span>
                </label>
                <button
                  className={`drawer-toggle-btn ${
                    !audioFeedback.muted ? 'active' : ''
                  }`}
                  onClick={() => audioFeedback.setMuted(!audioFeedback.muted)}
                  aria-pressed={!audioFeedback.muted}
                >
                  {audioFeedback.muted ? 'Muted' : 'On'}
                </button>
              </div>

              {/* Volume Control */}
              <div className="drawer-settings-group">
                <label className="drawer-slider-label">
                  <span>Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioFeedback.volume * 100}
                    onChange={(e) =>
                      audioFeedback.setVolume(parseInt(e.target.value) / 100)
                    }
                    className="drawer-slider"
                    aria-label="Volume level"
                  />
                </label>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && user && (
            <div className="drawer-panel-content">
              <HistoryPanel
                user={user}
                onLoadCode={handleLoadCode}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

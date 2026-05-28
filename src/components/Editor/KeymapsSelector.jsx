import { useState } from 'react';
import './KeymapsSelector.css';

/**
 * KeymapsSelector Component
 *
 * Provides a UI for selecting and previewing keymap profiles.
 * Features:
 * - Visual profile cards with descriptions
 * - Instant profile switching
 * - Keyboard binding preview
 * - Profile information display
 */
export default function KeymapsSelector({ keymaps, onSelectProfile, selectedProfile }) {
  const [previewProfile, setPreviewProfile] = useState(selectedProfile);

  const profiles = keymaps.getProfiles();
  const currentBindings = keymaps.getProfiles().find((p) => p.id === previewProfile)
    ? keymaps.getCurrentBindings()
    : null;

  const commonActions = [
    { action: keymaps.EDITOR_ACTIONS.RUN_CODE, label: 'Run Code' },
    { action: keymaps.EDITOR_ACTIONS.UNDO, label: 'Undo' },
    { action: keymaps.EDITOR_ACTIONS.REDO, label: 'Redo' },
    { action: keymaps.EDITOR_ACTIONS.SELECT_LINE, label: 'Select Line' },
    { action: keymaps.EDITOR_ACTIONS.DELETE_LINE, label: 'Delete Line' },
    { action: keymaps.EDITOR_ACTIONS.COMMENT_LINE, label: 'Comment Line' },
    { action: keymaps.EDITOR_ACTIONS.FIND, label: 'Find' },
    { action: keymaps.EDITOR_ACTIONS.FIND_REPLACE, label: 'Find & Replace' },
  ];

  const handleSelectProfile = (profileId) => {
    setPreviewProfile(profileId);
    keymaps.switchProfile(profileId);
    onSelectProfile?.(profileId);
  };

  return (
    <div className="keymaps-selector">
      <div className="keymaps-container">
        <div className="keymaps-profiles">
          <h3 className="keymaps-title">Keymap Profiles</h3>
          <div className="profiles-grid">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={`profile-card ${
                  selectedProfile === profile.id ? 'active' : ''
                } ${previewProfile === profile.id ? 'preview' : ''}`}
                onClick={() => handleSelectProfile(profile.id)}
                title={profile.description}
              >
                <div className="profile-name">{profile.name}</div>
                <div className="profile-desc">{profile.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="keymaps-preview">
          <h3 className="preview-title">Keyboard Shortcuts</h3>
          <div className="bindings-list">
            {commonActions.map(({ action, label }) => (
              <div key={action} className="binding-row">
                <span className="binding-label">{label}</span>
                <kbd className="binding-key">
                  {keymaps.getFormattedBinding(action) || '—'}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

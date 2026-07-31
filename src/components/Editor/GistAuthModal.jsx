import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  clearSecureGistToken,
  encryptAndStoreGistToken,
  hasWebCrypto,
  isSecureGistTokenStored,
  lockGistToken,
  unlockGistToken,
} from '../../services/secureGistTokenStore';

export default function GistAuthModal({ onClose, onStatusChange }) {
  const [token, setToken] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const stored = isSecureGistTokenStored();
  const cryptoAvailable = hasWebCrypto();

  const refreshStatus = () => {
    onStatusChange?.();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await encryptAndStoreGistToken(token, passphrase);
      setToken('');
      setPassphrase('');
      refreshStatus();
      toast.success('GitHub token saved and unlocked');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlock = async () => {
    setIsSaving(true);
    try {
      await unlockGistToken(passphrase);
      setPassphrase('');
      refreshStatus();
      toast.success('GitHub token unlocked for this session');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    clearSecureGistToken();
    setToken('');
    setPassphrase('');
    refreshStatus();
    toast.success('Saved GitHub token removed');
  };

  const handleLock = () => {
    lockGistToken();
    refreshStatus();
    toast.success('GitHub token locked');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-box api-key-modal"
        onSubmit={handleSave}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title-left">GitHub Token (Gist)</h2>
            <p className="modal-muted">
              Requires &apos;gist&apos; scope. Encrypted locally with AES-GCM and unlocked only for this browser session.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close API key settings"
          >
            ×
          </button>
        </div>

        {!cryptoAvailable && (
          <div className="api-key-warning">
            This browser does not support Web Crypto secure storage.
          </div>
        )}

        <label className="api-key-label" htmlFor="github-token">
          Personal Access Token
        </label>
        <input
          id="github-token"
          className="api-key-input"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={stored ? 'Leave blank to unlock existing key' : 'ghp_...'}
          autoComplete="off"
          disabled={!cryptoAvailable || isSaving}
        />

        <label className="api-key-label" htmlFor="github-passphrase">
          Passphrase
        </label>
        <input
          id="github-passphrase"
          className="api-key-input"
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="Encryption passphrase"
          autoComplete="current-password"
          disabled={!cryptoAvailable || isSaving}
        />

        <div className="api-key-actions">
          <button
            type="submit"
            className="run-btn"
            disabled={!cryptoAvailable || isSaving || !token || !passphrase}
          >
            Save
          </button>
          <button
            type="button"
            className="clear-btn"
            onClick={handleUnlock}
            disabled={!cryptoAvailable || isSaving || !stored || !passphrase}
          >
            Unlock
          </button>
          <button type="button" className="clear-btn" onClick={handleLock} disabled={isSaving}>
            Lock
          </button>
          <button
            type="button"
            className="clear-btn danger"
            onClick={handleClear}
            disabled={isSaving || !stored}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

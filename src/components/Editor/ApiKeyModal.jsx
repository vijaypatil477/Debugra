import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  clearSecureApiKey,
  encryptAndStoreApiKey,
  hasWebCrypto,
  isSecureApiKeyStored,
  lockApiKey,
  unlockApiKey,
} from '../../services/secureApiKeyStore';

export default function ApiKeyModal({ onClose, onStatusChange }) {
  const [apiKey, setApiKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const stored = isSecureApiKeyStored();
  const cryptoAvailable = hasWebCrypto();

  const refreshStatus = () => {
    onStatusChange?.();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await encryptAndStoreApiKey(apiKey, passphrase);
      setApiKey('');
      setPassphrase('');
      refreshStatus();
      toast.success('API key saved and unlocked');
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
      await unlockApiKey(passphrase);
      setPassphrase('');
      refreshStatus();
      toast.success('API key unlocked for this session');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    clearSecureApiKey();
    setApiKey('');
    setPassphrase('');
    refreshStatus();
    toast.success('Saved API key removed');
  };

  const handleLock = () => {
    lockApiKey();
    refreshStatus();
    toast.success('API key locked');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-box api-key-modal" onSubmit={handleSave} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title-left">Groq API Key</h2>
            <p className="modal-muted">Encrypted locally with AES-GCM and unlocked only for this browser session.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close API key settings">×</button>
        </div>

        {!cryptoAvailable && (
          <div className="api-key-warning">This browser does not support Web Crypto secure storage.</div>
        )}

        <label className="api-key-label" htmlFor="groq-api-key">API key</label>
        <input
          id="groq-api-key"
          className="api-key-input"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={stored ? 'Leave blank to unlock existing key' : 'gsk_...'}
          autoComplete="off"
          disabled={!cryptoAvailable || isSaving}
        />

        <label className="api-key-label" htmlFor="groq-passphrase">Passphrase</label>
        <input
          id="groq-passphrase"
          className="api-key-input"
          type="password"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder="Encryption passphrase"
          autoComplete="current-password"
          disabled={!cryptoAvailable || isSaving}
        />

        <div className="api-key-actions">
          <button type="submit" className="run-btn" disabled={!cryptoAvailable || isSaving || !apiKey || !passphrase}>
            Save
          </button>
          <button type="button" className="clear-btn" onClick={handleUnlock} disabled={!cryptoAvailable || isSaving || !stored || !passphrase}>
            Unlock
          </button>
          <button type="button" className="clear-btn" onClick={handleLock} disabled={isSaving}>
            Lock
          </button>
          <button type="button" className="clear-btn danger" onClick={handleClear} disabled={isSaving || !stored}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

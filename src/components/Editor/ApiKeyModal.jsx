import { useRef, useState } from 'react';
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
  const apiKeyRef = useRef(null);
  const passphraseRef = useRef(null);
  const [hasApiKeyInput, setHasApiKeyInput] = useState(false);
  const [hasPassphraseInput, setHasPassphraseInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const stored = isSecureApiKeyStored();
  const cryptoAvailable = hasWebCrypto();

  const refreshStatus = () => {
    onStatusChange?.();
  };

  const clearSecretInputs = () => {
    if (apiKeyRef.current) apiKeyRef.current.value = '';
    if (passphraseRef.current) passphraseRef.current.value = '';
    setHasApiKeyInput(false);
    setHasPassphraseInput(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    let apiKey = apiKeyRef.current?.value || '';
    let passphrase = passphraseRef.current?.value || '';

    try {
      await encryptAndStoreApiKey(apiKey, passphrase);
      clearSecretInputs();
      refreshStatus();
      toast.success('API key saved and unlocked');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      apiKey = null;
      passphrase = null;
      setIsSaving(false);
    }
  };

  const handleUnlock = async () => {
    setIsSaving(true);
    let passphrase = passphraseRef.current?.value || '';

    try {
      await unlockApiKey(passphrase);
      clearSecretInputs();
      refreshStatus();
      toast.success('API key unlocked for this session');
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      passphrase = null;
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    clearSecureApiKey();
    clearSecretInputs();
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
      <form
        className="modal-box api-key-modal"
        onSubmit={handleSave}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title-left">Groq API Key</h2>
            <p className="modal-muted">
              Encrypted locally with AES-GCM and unlocked only for this browser session.
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

        <label className="api-key-label" htmlFor="groq-api-key">
          API key
        </label>
        <input
          ref={apiKeyRef}
          id="groq-api-key"
          className="api-key-input"
          type="password"
          onChange={(event) => setHasApiKeyInput(Boolean(event.target.value))}
          placeholder={stored ? 'Leave blank to unlock existing key' : 'gsk_...'}
          autoComplete="off"
          disabled={!cryptoAvailable || isSaving}
        />

        <label className="api-key-label" htmlFor="groq-passphrase">
          Passphrase
        </label>
        <input
          ref={passphraseRef}
          id="groq-passphrase"
          className="api-key-input"
          type="password"
          onChange={(event) => setHasPassphraseInput(Boolean(event.target.value))}
          placeholder="Encryption passphrase"
          autoComplete="current-password"
          disabled={!cryptoAvailable || isSaving}
        />

        <div className="api-key-actions">
          <button
            type="submit"
            className="run-btn"
            disabled={!cryptoAvailable || isSaving || !hasApiKeyInput || !hasPassphraseInput}
          >
            Save
          </button>
          <button
            type="button"
            className="clear-btn"
            onClick={handleUnlock}
            disabled={!cryptoAvailable || isSaving || !stored || !hasPassphraseInput}
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

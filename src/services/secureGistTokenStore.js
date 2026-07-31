const STORAGE_KEY = 'debugra:encrypted-github-gist-token:v1';
const SESSION_EVENT = 'debugra-secure-gist-token-change';
const ITERATIONS = 210000;
const KEY_LENGTH = 256;

let sessionGistToken = '';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));

const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export function hasWebCrypto() {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}

async function deriveKey(passphrase, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

function notifyKeyChange() {
  window.dispatchEvent(
    new CustomEvent(SESSION_EVENT, {
      detail: { unlocked: Boolean(sessionGistToken), stored: isSecureGistTokenStored() },
    })
  );
}

export function isSecureGistTokenStored() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

export function getSessionGistToken() {
  return sessionGistToken;
}

export function subscribeToSecureGistToken(listener) {
  const wrapped = (event) => listener(event.detail);
  window.addEventListener(SESSION_EVENT, wrapped);
  return () => window.removeEventListener(SESSION_EVENT, wrapped);
}

export async function encryptAndStoreGistToken(token, passphrase) {
  if (!hasWebCrypto()) {
    throw new Error('Secure key storage requires Web Crypto support.');
  }
  if (!token?.trim() || !passphrase?.trim()) {
    throw new Error('GitHub token and passphrase are required.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(token.trim())
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: ITERATIONS,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(ciphertext)),
    })
  );

  sessionGistToken = token.trim();
  notifyKeyChange();
}

export async function unlockGistToken(passphrase) {
  if (!hasWebCrypto()) {
    throw new Error('Secure key storage requires Web Crypto support.');
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    throw new Error('No encrypted GitHub token is saved.');
  }

  try {
    const payload = JSON.parse(stored);
    const salt = fromBase64(payload.salt);
    const iv = fromBase64(payload.iv);
    const ciphertext = fromBase64(payload.ciphertext);
    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    sessionGistToken = decoder.decode(plaintext);
    notifyKeyChange();
  } catch {
    throw new Error('Unable to unlock GitHub token. Check the passphrase and try again.');
  }
}

export function lockGistToken() {
  sessionGistToken = '';
  notifyKeyChange();
}

export function clearSecureGistToken() {
  localStorage.removeItem(STORAGE_KEY);
  sessionGistToken = '';
  notifyKeyChange();
}

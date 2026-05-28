import axios from 'axios';
import { getSessionApiKey } from './secureApiKeyStore';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach a session-only user Groq key when unlocked
api.interceptors.request.use(
  (config) => {
    const apiKey = getSessionApiKey();
    if (apiKey && config.url?.startsWith('/api/ai/')) {
      config.headers['X-Groq-Api-Key'] = apiKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors into a consistent shape
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─── Code Execution ────────────────────────────────────────────────────────────
export const executeCode = async (sourceCode, languageId, stdin = '') => {
  const { data } = await api.post('/api/execute', {
    source_code: sourceCode,
    language_id: languageId,
    stdin,
  });
  return data;
};

// ─── AI Features ──────────────────────────────────────────────────────────────
export const aiExplainError = async (code, error, language) => {
  const { data } = await api.post('/api/ai/explain-error', { code, error, language });
  return data;
};

export const aiFixCode = async (code, error, language) => {
  const { data } = await api.post('/api/ai/fix-code', { code, error, language });
  return data;
};

export const aiExplainLogic = async (code, language) => {
  const { data } = await api.post('/api/ai/explain-logic', { code, language });
  return data;
};

export const aiGenerateTests = async (code, language) => {
  const { data } = await api.post('/api/ai/generate-tests', { code, language });
  return data;
};

export const aiAuditCode = async (code, language) => {
  const { data } = await api.post('/api/ai/audit-code', { code, language });
  return data;
};

export const aiVisualizeExecution = async (code, language, input = '') => {
  const { data } = await api.post('/api/ai/visualize', { code, language, input });
  return data;
};

export default api;

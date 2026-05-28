/**
 * usePromptTemplates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom hook that manages the selected AI personality template state.
 *
 * Features:
 * - Persists selected template id to localStorage
 * - Restores selection on page reload
 * - Tracks custom system prompt (manual edits)
 * - Auto-switches to "Custom" mode when user edits the prompt manually
 * - Falls back to default template safely on corrupt/missing storage
 */

import { useState, useCallback, useEffect } from 'react';
import {
  PROMPT_TEMPLATES,
  CUSTOM_TEMPLATE_ID,
  DEFAULT_TEMPLATE_ID,
  getTemplateById,
  getDefaultTemplate,
} from '../data/promptTemplates';

const STORAGE_KEY_TEMPLATE_ID  = 'debugra_prompt_template_id';
const STORAGE_KEY_CUSTOM_PROMPT = 'debugra_custom_system_prompt';

/**
 * Safely read a value from localStorage.
 * @param {string} key
 * @param {string|null} fallback
 */
function safeRead(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safely write a value to localStorage.
 * @param {string} key
 * @param {string} value
 */
function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently ignore (private browsing with full storage, etc.)
  }
}

/**
 * usePromptTemplates
 *
 * @returns {{
 *   selectedTemplateId: string,
 *   selectedTemplate: object|null,
 *   isCustom: boolean,
 *   customPrompt: string,
 *   activeSystemPrompt: string,
 *   selectTemplate: (id: string) => void,
 *   setCustomPrompt: (prompt: string) => void,
 *   resetToDefault: () => void,
 *   templates: object[],
 * }}
 */
export function usePromptTemplates() {
  // ── Initialise from localStorage ───────────────────────────────────────────
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const stored = safeRead(STORAGE_KEY_TEMPLATE_ID, DEFAULT_TEMPLATE_ID);
    // Validate: must be a known id or 'custom'
    const isValid =
      stored === CUSTOM_TEMPLATE_ID ||
      PROMPT_TEMPLATES.some((t) => t.id === stored);
    return isValid ? stored : DEFAULT_TEMPLATE_ID;
  });

  const [customPrompt, setCustomPromptState] = useState(() =>
    safeRead(STORAGE_KEY_CUSTOM_PROMPT, '')
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const isCustom = selectedTemplateId === CUSTOM_TEMPLATE_ID;

  const selectedTemplate = isCustom
    ? null
    : (getTemplateById(selectedTemplateId) ?? getDefaultTemplate());

  /**
   * The system prompt that should be sent to the AI.
   * If a template is selected, use its systemPrompt.
   * If custom, use the user-written prompt.
   * If custom is empty, fall back to the default template prompt.
   */
  const activeSystemPrompt = isCustom
    ? (customPrompt.trim() || getDefaultTemplate().systemPrompt)
    : (selectedTemplate?.systemPrompt ?? getDefaultTemplate().systemPrompt);

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Select a named template by id.
   * Passing CUSTOM_TEMPLATE_ID switches to custom mode.
   * @param {string} id
   */
  const selectTemplate = useCallback((id) => {
    const isValid =
      id === CUSTOM_TEMPLATE_ID ||
      PROMPT_TEMPLATES.some((t) => t.id === id);

    const finalId = isValid ? id : DEFAULT_TEMPLATE_ID;
    setSelectedTemplateId(finalId);
    safeWrite(STORAGE_KEY_TEMPLATE_ID, finalId);
  }, []);

  /**
   * Update the custom prompt text.
   * Automatically switches to "Custom" mode.
   * @param {string} prompt
   */
  const setCustomPrompt = useCallback((prompt) => {
    setCustomPromptState(prompt);
    safeWrite(STORAGE_KEY_CUSTOM_PROMPT, prompt);
    // Auto-switch to custom mode when the user types their own prompt
    setSelectedTemplateId(CUSTOM_TEMPLATE_ID);
    safeWrite(STORAGE_KEY_TEMPLATE_ID, CUSTOM_TEMPLATE_ID);
  }, []);

  /**
   * Reset back to the default template.
   */
  const resetToDefault = useCallback(() => {
    selectTemplate(DEFAULT_TEMPLATE_ID);
  }, [selectTemplate]);

  // ── Sync on external storage changes (multi-tab) ───────────────────────────
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY_TEMPLATE_ID && e.newValue) {
        const isValid =
          e.newValue === CUSTOM_TEMPLATE_ID ||
          PROMPT_TEMPLATES.some((t) => t.id === e.newValue);
        if (isValid) setSelectedTemplateId(e.newValue);
      }
      if (e.key === STORAGE_KEY_CUSTOM_PROMPT && e.newValue !== null) {
        setCustomPromptState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return {
    selectedTemplateId,
    selectedTemplate,
    isCustom,
    customPrompt,
    activeSystemPrompt,
    selectTemplate,
    setCustomPrompt,
    resetToDefault,
    templates: PROMPT_TEMPLATES,
  };
}

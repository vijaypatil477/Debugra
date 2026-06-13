export const PROMPT_PRESETS = [
  {
    id: 'brief',
    label: 'Brief',
    description: 'Keep responses short, direct, and easy to scan.',
    prompt:
      'You are an expert programming mentor. Answer clearly but concisely, using the fewest words necessary and avoiding extra explanation unless it helps.',
  },
  {
    id: 'detailed',
    label: 'Detailed',
    description: 'Give long-form explanations with examples and reasoning.',
    prompt:
      'You are a senior programming teacher. Provide detailed explanations, background reasoning, and examples so the reader fully understands the answer.',
  },
  {
    id: 'academic',
    label: 'Academic',
    description: 'Use precise terminology and structured prose.',
    prompt:
      'You are an academic instructor. Use precise, formal language and explain concepts with structure, definitions, and reasoning.',
  },
  {
    id: 'eli5',
    label: 'ELI5',
    description: 'Explain things as if to a five-year-old with simple analogies.',
    prompt:
      'You are an expert teacher explaining to a young learner. Use very simple language and analogies so a beginner can understand easily.',
  },
];

export const STORAGE_KEYS = {
  activePrompt: 'debugra:activeAiPrompt',
  customPrompts: 'debugra:customAiPrompts',
};

export const DEFAULT_PROMPT_ID = PROMPT_PRESETS[0].id;

export function loadCustomPrompts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customPrompts);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomPrompts(prompts) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.customPrompts, JSON.stringify(prompts));
}

export function loadActivePromptId() {
  if (typeof window === 'undefined') return DEFAULT_PROMPT_ID;
  try {
    return localStorage.getItem(STORAGE_KEYS.activePrompt) || DEFAULT_PROMPT_ID;
  } catch (e) {
    return DEFAULT_PROMPT_ID;
  }
}

export function saveActivePromptId(promptId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.activePrompt, promptId);
}

export function findPromptById(promptId, customPrompts = []) {
  if (!promptId) return null;
  const preset = PROMPT_PRESETS.find((prompt) => prompt.id === promptId);
  if (preset) return preset;
  return customPrompts.find((prompt) => prompt.id === promptId) || null;
}

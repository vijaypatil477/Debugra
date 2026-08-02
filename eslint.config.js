import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  // Ignore patterns (replaces ignorePatterns in legacy config)
  {
    ignores: ['dist/**', 'vite.config.js'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // React + React Hooks + React Refresh (eslint-plugin-react v7 flat config)
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React recommended rules (v7 API)
      ...reactPlugin.configs.recommended.rules,
      // JSX runtime — disables react/react-in-jsx-scope for React 17+
      ...reactPlugin.configs['jsx-runtime'].rules,

      // React Hooks recommended rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Project-specific overrides
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // react-hooks v7 introduced stricter rules; downgrade to warn until
      // the pre-existing patterns are refactored in a dedicated pass.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];

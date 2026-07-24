import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    // Only run vitest unit tests under src/ — exclude Playwright e2e specs and server Jest tests
    include: ['src/**/*.test.{js,jsx}'],
    environment: 'jsdom',
    globals: false,
  },
  optimizeDeps: {
    include: [
      'prettier/standalone',
      'prettier/parser-babel',
      'prettier/parser-typescript',
      'prettier/plugins/babel',
      'prettier/plugins/estree',
    ],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});

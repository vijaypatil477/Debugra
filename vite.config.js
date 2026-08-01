import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // simple-peer relies on Node.js built-ins (events, stream, util, buffer, process)
    // Polyfill Node globals and modules for browser compatibility.
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      // monaco-vim references monaco-editor as a peer dep in its UMD bundle;
      // mark it external so Rolldown (Vite 8) doesn't try to bundle it.
      external: ['monaco-editor/esm/vs/editor/editor.api'],
    },
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
      'Cross-Origin-Opener-Policy': 'unsafe-none',
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
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
});

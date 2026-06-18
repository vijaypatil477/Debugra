import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(),
  ],

  resolve: {
    alias: {
      events: 'events',
      util: 'util',
      stream: 'stream-browserify',
    },
  },

  build: {
    chunkSizeWarningLimit: 1000,
  },

  optimizeDeps: {
    include: [
      'simple-peer',
      'events',
      'util',
      'stream-browserify',

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

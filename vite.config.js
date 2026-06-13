import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Generate gzip and brotli compressed assets at build time
    compression({ algorithm: 'gzip', exclude: [/\.(br)$/, /\.(gz)$/] }),
    compression({ algorithm: 'brotliCompress', ext: '.br', exclude: [/\.(br)$/, /\.(gz)$/] }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Anchored package-dir matches (trailing slash) so e.g. "react"
          // does not also swallow "react-hot-toast" / "react-icons".
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return 'vendor-react';
          }
          if (/node_modules\/(firebase|@firebase)\//.test(id)) {
            return 'vendor-firebase';
          }
          if (/node_modules\/(bootstrap|lucide-react|react-hot-toast|react-icons)\//.test(id)) {
            return 'vendor-ui';
          }
          // NOTE: Monaco is intentionally NOT chunked here. Forcing it into a
          // named vendor chunk makes Vite modulepreload it on every page
          // (including the landing page). Leaving it un-chunked lets it fold
          // into the lazy EditorPage chunk so it only loads on /editor.
        },
      },
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

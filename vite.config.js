import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Add this line

export default defineConfig({
  plugins: [
    react(),
    // Add this block
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Debugra Editor',
        short_name: 'Debugra',
        theme_color: '#ffffff',
        // Note: Since you can't easily upload images in the web editor, 
        // we will leave the icons array empty for now. The maintainers can add their own logo later.
        icons: [] 
      }
    })
  ],
});

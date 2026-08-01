import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/__tests__/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist', 'server', 'tests'],
  },
});

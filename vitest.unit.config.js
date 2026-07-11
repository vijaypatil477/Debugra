import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run fast unit tests that use Vitest (exclude Playwright specs).
    include: ['src/hooks/__tests__/**/*.test.js'],
    exclude: ['tests/**', 'server/**', '**/*.spec.js'],
    environment: 'jsdom',
  },
});


import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // We'll just expect it not to crash and have a basic title,
  // Update this to match the actual title of the app
  await expect(page).toHaveTitle(/Debugra|Vite/i);
});

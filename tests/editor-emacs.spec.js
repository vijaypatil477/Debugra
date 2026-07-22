import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('debugra_hasCompletedTour', 'true');
  });
});

test('toggles Emacs mode in Settings and saves preference', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: /Open Settings/i }).click();

  await expect(page.getByText('Emacs mode')).toBeVisible();

  // Select Emacs mode -> enabled
  await page.getByLabel('Emacs mode').selectOption('enabled');

  // Verify status bar shows Emacs indicator
  await expect(page.getByTitle('Emacs mode')).toBeVisible();

  // Verify localStorage updated
  const emacsPref = await page.evaluate(() => localStorage.getItem('debugra-emacs-enabled'));
  expect(emacsPref).toBe('true');
});

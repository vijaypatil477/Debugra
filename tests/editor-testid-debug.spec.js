import { test, expect } from '@playwright/test';

test('debug: list settings testid presence on /editor', async ({ page }) => {
  await page.goto('/editor');
  await page.waitForTimeout(1000);

  const counts = {
    settingsTestId: await page.locator('[data-testid="settings-button"]').count(),
    openSettingsAria: await page
      .locator(
        '[aria-label="Open Settings"], button:has-text("Open Settings"), button:has-text("Settings"]'
      )
      .count(),
    editor: await page.locator('.monaco-editor').count(),
  };

  console.log('DEBUG counts', counts);
  expect(counts.editor + counts.settingsTestId + counts.openSettingsAria).toBeGreaterThan(0);
});

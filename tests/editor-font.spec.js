import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('debugra_hasCompletedTour', 'true');
  });
  await page.goto('/editor');
  await page.waitForSelector('.monaco-editor', { timeout: 15000 });
  await page.waitForFunction(() => window.__DEBUGRA_EDITOR__ !== undefined, { timeout: 15000 });
});

test('loads the selected editor font and applies it in Monaco', async ({ page }) => {
  await page.getByRole('button', { name: /Open Settings/i }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: /Open Settings/i }).click();

  const fontSelect = page.getByLabel('Editor font');
  await expect(fontSelect).toBeVisible();

  await fontSelect.selectOption('Fira Code');

  await expect(
    page.locator('head link[href*="fonts.googleapis.com"][href*="Fira+Code"]')
  ).toHaveCount(1);

  const editorFontFamily = await page.locator('.monaco-editor .view-lines').evaluate((node) => {
    return getComputedStyle(node).fontFamily;
  });

  expect(editorFontFamily).toContain('Fira Code');
});

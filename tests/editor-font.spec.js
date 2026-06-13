import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('debugra_hasCompletedTour', 'true');
  });
});

test('loads the selected editor font and applies it in Monaco', async ({ page }) => {
  await page.goto('/editor?testUser=1');

  // Use stable test id for settings trigger
  const settingsBtn = page.getByTestId('settings-button');
  await settingsBtn.waitFor({ state: 'attached', timeout: 15000 });

  await settingsBtn.click();

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

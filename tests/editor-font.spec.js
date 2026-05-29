import { test, expect } from '@playwright/test';

test('loads the selected editor font and applies it in Monaco', async ({ page }) => {
  await page.goto('/editor');

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

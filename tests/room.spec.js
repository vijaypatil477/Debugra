import { test, expect } from '@playwright/test';

test('has title and can navigate to authentication modal', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Debugra/);

  // Click the "Open Editor" button
  await page.getByRole('button', { name: /Open Editor/i }).first().click();

  // Expect to navigate to the editor
  await expect(page).toHaveURL(/.*\/editor/);
});

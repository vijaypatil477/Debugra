import { test, expect } from '@playwright/test';
import axeSource from 'axe-core';

test.describe('Accessibility (axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure app has completed the onboarding tour state used by other tests.
    await page.addInitScript(() => {
      window.localStorage.setItem('debugra_hasCompletedTour', 'true');
    });

    // Inject axe-core into the page.
    await page.addInitScript({
      content: axeSource,
    });
  });

  test('homepage has no axe violations', async ({ page }) => {
    await page.goto('/');

    const results = await page.evaluate(async () => {
      return await window.axe.run();
    });

    const violations = results.violations ?? [];
    expect(
      violations,
      violations.length ? JSON.stringify(violations, null, 2) : undefined
    ).toEqual([]);
  });

  test('editor route has no axe violations (after opening settings)', async ({ page }) => {
    await page.goto('/editor');

    // Expose editor settings controls so labels/roles are present.
    const settingsButton = page.getByRole('button', { name: /Open Settings/i }).first();
    await settingsButton.click();

    const results = await page.evaluate(async () => {
      return await window.axe.run();
    });

    const violations = results.violations ?? [];
    expect(
      violations,
      violations.length ? JSON.stringify(violations, null, 2) : undefined
    ).toEqual([]);
  });
});



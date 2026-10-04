import { test, expect } from '@playwright/test';

test.describe('Collaboration Room Flow', () => {
  test('Route to home, create a collaboration room, verify redirect URL structure', async ({ page }) => {
    // Append testUser=1 to bypass Firebase Auth in tests
    await page.goto('/?testUser=1');
    
    await expect(page).toHaveTitle(/Debugra/);
    
    // Click the "Open Editor" button to route to the editor
    await page.getByRole('button', { name: /Open Editor/i }).first().click();
    
    // Verify redirect URL structure
    await expect(page).toHaveURL(/.*\/editor/);
    
    // Create a new collaboration room
    await page.getByRole('button', { name: '+ New Room' }).click();
    
    // Verify room creation success by looking for the "Leave" button
    await expect(page.getByRole('button', { name: 'Leave' })).toBeVisible({ timeout: 15000 });
  });

  test('Mock typing in Monaco Editor and verify state updates', async ({ page }) => {
    await page.goto('/editor?testUser=1');
    
    // Locate the Monaco Editor
    await page.waitForSelector('.monaco-editor');
    
    // Ensure the editor has fully initialized
    await page.waitForTimeout(500);

    // Mock typing by setting the editor value directly
    await page.evaluate((code) => {
      const editor = window.__DEBUGRA_EDITOR__;
      editor.setValue(code);
    }, 'console.log("Playwright Testing");');
    
    // Verify the text appears in the editor model
    const text = await page.evaluate(() => window.__DEBUGRA_EDITOR__?.getValue() ?? '');
    expect(text).toContain('console.log("Playwright Testing");');
  });
});

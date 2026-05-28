import { test, expect } from '@playwright/test';

test.describe('AI Variable and Function Name Optimizer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept AI Optimize route and mock response
    await page.route('**/api/ai/optimize-names', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: {
            suggestions: [
              {
                oldName: 'tmpVal',
                newName: 'calculatedResult',
                explanation: 'The variable stores a temporary mathematical calculation, so renaming it clarifies its value and type.',
                confidence: 94
              },
              {
                oldName: 'fn',
                newName: 'processInputData',
                explanation: 'The function processes raw telemetry data; the name fn is generic and does not convey its functionality.',
                confidence: 88
              }
            ]
          },
          usage: {
            total_tokens: 150,
            completion_tokens: 100,
            completion_time: 0.5
          }
        })
      });
    });

    // Go to home and navigate to editor
    await page.goto('/');
    await page.getByRole('button', { name: /Open Editor/i }).first().click();
    await expect(page).toHaveURL(/.*\/editor/);
    
    // Wait for Monaco editor to finish mounting and be exposed on window
    await page.waitForFunction(() => window.editor !== undefined);
  });

  test('should show warning toast when trying to optimize names without highlighting code', async ({ page }) => {
    // 1. Double check that we are on editor page
    await expect(page.locator('#editor-container')).toBeVisible();

    // 2. Clear selection (setValue but no selection)
    await page.evaluate(() => {
      window.editor.setValue('const tmpVal = fn(calcVal);');
      window.editor.setSelection(new window.monaco.Selection(1, 1, 1, 1));
    });

    // 3. Click Optimize button in toolbar
    const optimizeBtn = page.getByRole('button', { name: 'Optimize' });
    await expect(optimizeBtn).toBeVisible();
    await optimizeBtn.click();

    // 4. Verify warning toast appears
    const toast = page.locator('text=Please select a block of code');
    await expect(toast).toBeVisible();
  });

  test('should analyze selected code, display AI suggestions cards with descriptions and copy utility', async ({ page }) => {
    // 1. Set values and select code in Monaco editor
    await page.evaluate(() => {
      window.editor.setValue('const tmpVal = fn(calcVal);\nconsole.log(tmpVal);');
      // Highlight the first line
      window.editor.setSelection(new window.monaco.Selection(1, 1, 1, 30));
    });

    // 2. Click Optimize button
    const optimizeBtn = page.getByRole('button', { name: 'Optimize' });
    await optimizeBtn.click();

    // 3. AI output tab should be active
    const aiOutputTab = page.locator('.output-tab.active', { hasText: 'AI' });
    await expect(aiOutputTab).toBeVisible();

    // 4. Suggestions panel should be displayed
    const sectionLabel = page.locator('text=Naming Optimizer Suggestions');
    await expect(sectionLabel).toBeVisible();

    // 5. Verify unreadable old names and suggested new names are displayed
    const oldName1 = page.locator('text=tmpVal').first();
    const newName1 = page.locator('text=calculatedResult').first();
    await expect(oldName1).toBeVisible();
    await expect(newName1).toBeVisible();

    const oldName2 = page.locator('text=fn').first();
    const newName2 = page.locator('text=processInputData').first();
    await expect(oldName2).toBeVisible();
    await expect(newName2).toBeVisible();

    // 6. Verify explanation reasons and confidence matches are displayed
    await expect(page.locator('text=94% Match')).toBeVisible();
    await expect(page.locator('text=88% Match')).toBeVisible();
    await expect(page.locator('text=The variable stores a temporary mathematical calculation')).toBeVisible();

    // 7. Verify Copy to clipboard button works and triggers success toast
    const copyBtns = page.locator('button', { hasText: 'Copy' });
    await expect(copyBtns.first()).toBeVisible();
    await copyBtns.first().click();

    // Verify copy success toast is displayed
    const successToast = page.locator('text=Copied "calculatedResult" to clipboard!');
    await expect(successToast).toBeVisible();
  });
});

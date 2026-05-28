import { test, expect } from '@playwright/test';

test.describe('AI Automated Code Docstring Generator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept AI Docstring route and mock response
    await page.route('**/api/ai/generate-docstring', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: {
            docstring: `/**\n * Calculates the sum of two values.\n * @param {number} a - First number\n * @param {number} b - Second number\n * @returns {number} The combined sum\n */`
          },
          usage: {
            total_tokens: 120,
            completion_tokens: 80,
            completion_time: 0.4
          }
        })
      });
    });

    // Go to home and navigate to editor
    await page.goto('/');
    await page.getByRole('button', { name: /Open Editor/i }).first().click();
    await expect(page).toHaveURL(/.*\/editor/);
    
    // Wait for Monaco editor to be ready
    await page.waitForFunction(() => window.editor !== undefined);
  });

  test('should show warning toast when trying to generate docstring without highlighting code', async ({ page }) => {
    // Clear selection
    await page.evaluate(() => {
      window.editor.setValue('function add(a, b) { return a + b; }');
      window.editor.setSelection(new window.monaco.Selection(1, 1, 1, 1));
    });

    // Click Docstring button in toolbar
    const docstringBtn = page.getByRole('button', { name: 'Docstring' });
    await expect(docstringBtn).toBeVisible();
    await docstringBtn.click();

    // Verify warning toast appears
    const toast = page.locator('text=Please select a function or block of code');
    await expect(toast).toBeVisible();
  });

  test('should generate docstring and insert directly above function with correct indentation', async ({ page }) => {
    // Set code with 4 spaces of indentation and select the function
    const inputCode = '    function add(a, b) {\n        return a + b;\n    }';
    await page.evaluate((code) => {
      window.editor.setValue(code);
      // Select the first line (the function declaration)
      window.editor.setSelection(new window.monaco.Selection(1, 5, 1, 24));
    }, inputCode);

    // Click Docstring button
    const docstringBtn = page.getByRole('button', { name: 'Docstring' });
    await docstringBtn.click();

    // Verify success toast shows up
    const successToast = page.locator('text=Docstring generated and inserted!');
    await expect(successToast).toBeVisible();

    // Verify the editor value is updated and contains the docstring correctly indented
    const finalCode = await page.evaluate(() => window.editor.getValue());
    
    // Every line of the docstring should start with 4 spaces to match the function indentation
    const expectedOutput = 
      '    /**\n' +
      '     * Calculates the sum of two values.\n' +
      '     * @param {number} a - First number\n' +
      '     * @param {number} b - Second number\n' +
      '     * @returns {number} The combined sum\n' +
      '     */\n' +
      '    function add(a, b) {\n' +
      '        return a + b;\n' +
      '    }';
      
    expect(finalCode).toBe(expectedOutput);
  });
});

import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility scan (axe-core) — REPORT-ONLY.
 *
 * This check runs axe against the landing and editor pages and prints any
 * serious/critical WCAG 2 A/AA violations to the CI log. It is intentionally
 * non-blocking: the app currently has several pre-existing accessibility
 * issues (documented in the PR) that are out of scope for this PR, which only
 * adds the CI tooling. Surfacing them here lets us pick them up as separate,
 * assignable issues. Once the backlog is cleared, flip the `report-only`
 * scans below to assertions (e.g. `expect(serious).toEqual([])`).
 *
 * The Monaco editor is excluded — its third-party ARIA markup produces
 * false positives.
 */
async function scanAndReport(page, path, label) {
  await page.goto(path);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude('.monaco-editor')
    .analyze();

  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (serious.length === 0) {
    console.log(`[a11y] ${label}: no serious/critical violations ✓`);
    return;
  }

  const summary = serious
    .map((v) => {
      const sample = v.nodes[0]?.html?.slice(0, 120) ?? '';
      return `  • ${v.id} (${v.impact}, ${v.nodes.length} node(s)) — ${v.help}\n    e.g. ${sample}`;
    })
    .join('\n');

  console.warn(
    `\n[a11y] ${label}: ${serious.length} pre-existing serious/critical violation(s) (report-only):\n${summary}\n`
  );
  test.info().annotations.push({
    type: 'a11y-known',
    description: `${label}: ${serious.map((v) => v.id).join(', ')}`,
  });
}

test('landing page accessibility scan (report-only)', async ({ page }) => {
  await scanAndReport(page, '/', 'landing page');
});

test('editor page accessibility scan (report-only)', async ({ page }) => {
  await scanAndReport(page, '/editor', 'editor page');
});

import { useState, useRef, useCallback } from "react";

/**
 * useCodeDiff
 * Manages code snapshots and diff state.
 * Calls the existing /api/ai endpoint for AI explanation.
 */
export function useCodeDiff(apiUrl) {
  const snapshotRef = useRef(null); // last saved snapshot
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [diffResult, setDiffResult] = useState(null); // { lines, aiSummary }
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState(null);

  // ── Save current code as a snapshot ────────────────────────────────────────
  const takeSnapshot = useCallback((currentCode) => {
    snapshotRef.current = currentCode;
  }, []);

  // ── Compute line-by-line diff (pure JS, no library) ────────────────────────
  const computeDiff = useCallback((oldCode, newCode) => {
    const oldLines = (oldCode || "").split("\n");
    const newLines = (newCode || "").split("\n");
    const maxLen = Math.max(oldLines.length, newLines.length);
    const lines = [];

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i] ?? null;
      const newLine = newLines[i] ?? null;

      if (oldLine === newLine) {
        lines.push({ type: "unchanged", oldLine, newLine, lineNo: i + 1 });
      } else if (oldLine === null) {
        lines.push({ type: "added", oldLine: null, newLine, lineNo: i + 1 });
      } else if (newLine === null) {
        lines.push({ type: "removed", oldLine, newLine: null, lineNo: i + 1 });
      } else {
        lines.push({ type: "changed", oldLine, newLine, lineNo: i + 1 });
      }
    }

    const changedIndexes = new Set(
      lines
        .map((l, i) => (l.type !== "unchanged" ? i : -1))
        .filter((i) => i !== -1)
        .flatMap((i) => [i - 2, i - 1, i, i + 1, i + 2])
        .filter((i) => i >= 0 && i < lines.length)
    );

    return lines.filter((_, i) => changedIndexes.has(i));
  }, []);

  // ── Fetch AI explanation from existing /api/ai endpoint ────────────────────
  const fetchAISummary = useCallback(
    async (oldCode, newCode, language) => {
      const prompt = `You are a code review assistant. Two versions of ${language} code are shown below.

BEFORE:
\`\`\`
${oldCode || "(empty)"}
\`\`\`

AFTER:
\`\`\`
${newCode}
\`\`\`

In 2-3 sentences, explain clearly what changed and why it matters. Be specific about logic changes, not just syntax. Reply with plain text only, no markdown.`;

      const response = await fetch(`${apiUrl}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "explain", code: prompt, language }),
      });

      if (!response.ok) throw new Error("AI request failed");
      const data = await response.json();
      return data.result || data.explanation || data.message || "No explanation available.";
    },
    [apiUrl]
  );

  // ── Main: open the diff panel ───────────────────────────────────────────────
  const openDiff = useCallback(
    async (currentCode, language) => {
      const oldCode = snapshotRef.current;

      if (oldCode === null) {
        snapshotRef.current = currentCode;
        setDiffResult({
          lines: [],
          aiSummary: "📸 Snapshot taken! Make some changes and click 'What Changed?' again.",
          isEmpty: true,
        });
        setIsDiffOpen(true);
        return;
      }

      if (oldCode === currentCode) {
        setDiffResult({ lines: [], aiSummary: "No changes detected since last snapshot.", isEmpty: true });
        setIsDiffOpen(true);
        return;
      }

      setIsDiffLoading(true);
      setIsDiffOpen(true);
      setDiffError(null);

      try {
        const [lines, aiSummary] = await Promise.all([
          Promise.resolve(computeDiff(oldCode, currentCode)),
          fetchAISummary(oldCode, currentCode, language),
        ]);
        setDiffResult({ lines, aiSummary, isEmpty: false });
      } catch (err) {
        setDiffError("Could not load AI explanation. The diff is shown below.");
        setDiffResult({ lines: computeDiff(oldCode, currentCode), aiSummary: null, isEmpty: false });
      } finally {
        setIsDiffLoading(false);
      }
    },
    [computeDiff, fetchAISummary]
  );

  const closeDiff = useCallback(() => {
    setIsDiffOpen(false);
    setDiffResult(null);
    setDiffError(null);
  }, []);

  return {
    takeSnapshot,
    openDiff,
    closeDiff,
    isDiffOpen,
    diffResult,
    isDiffLoading,
    diffError,
    hasSnapshot: snapshotRef.current !== null,
  };
}

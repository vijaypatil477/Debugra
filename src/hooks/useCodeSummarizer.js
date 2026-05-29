import { useState, useCallback } from "react";

/**
 * useCodeSummarizer
 * Sends code to the existing /api/ai endpoint and parses a structured
 * JSON response with summary, complexity, and step-by-step breakdown.
 */
export function useCodeSummarizer(apiUrl) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { summary, timeComplexity, spaceComplexity, steps }
  const [error, setError] = useState(null);

  const summarize = useCallback(
    async (code, language) => {
      if (!code || !code.trim()) {
        setResult(null);
        setError("No code to summarize. Write something in the editor first.");
        setIsOpen(true);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);
      setError(null);
      setResult(null);

      const prompt = `You are a code analysis assistant. Analyze the following ${language} code.

Respond ONLY with a valid JSON object in exactly this format — no markdown, no explanation outside JSON:
{
  "summary": "2-3 sentence plain-English explanation of what this code does",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ]
}

Code to analyze:
\`\`\`${language}
${code.slice(0, 3000)}
\`\`\``;

      try {
        const response = await fetch(`${apiUrl}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "summarize",
            code: prompt,
            language,
          }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        const rawText = data.result || data.explanation || data.message || "";

        const cleaned = rawText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();

        const parsed = JSON.parse(cleaned);

        if (!parsed.summary) throw new Error("Invalid AI response structure");

        setResult({
          summary: parsed.summary || "No summary available.",
          timeComplexity: parsed.timeComplexity || "N/A",
          spaceComplexity: parsed.spaceComplexity || "N/A",
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        });
      } catch (err) {
        if (err instanceof SyntaxError) {
          setError("AI returned an unexpected format. Please try again.");
        } else {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setResult(null);
    setError(null);
  }, []);

  return { isOpen, isLoading, result, error, summarize, close };
}

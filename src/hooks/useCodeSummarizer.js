import { useState, useCallback } from "react";

/**
 * useCodeSummarizer
 * Sends code to /api/ai/summarize and parses a structured
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

      try {
        const response = await fetch(`${apiUrl}/api/ai/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.slice(0, 3000),
            language,
          }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        const parsed = data.content;

        if (!parsed || !parsed.summary) throw new Error("Invalid AI response structure");

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

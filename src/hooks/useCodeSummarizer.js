import { useState, useCallback } from 'react';

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
        setError('No code to summarize. Write something in the editor first.');
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
        const response = await fetch(`${apiUrl}/api/ai/explain-logic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code.slice(0, 3000),
            language,
          }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();

        if (!data.summary) throw new Error('Invalid AI response structure');

        setResult({
          summary: data.summary || 'No summary available.',
          timeComplexity: data.timeComplexity || 'N/A',
          spaceComplexity: data.spaceComplexity || 'N/A',
          steps: Array.isArray(data.steps) ? data.steps : [],
        });
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
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

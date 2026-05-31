const Groq = require('groq-sdk');

const MODELS = {
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'llama-3.1-8b-instant': 'Llama 3.1 8B',
  'mixtral-8x7b-32768': 'Mixtral 8x7B',
};
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

function getGroqClient(apiKey) {
  return new Groq({ apiKey: apiKey || process.env.GROQ_API_KEY || 'missing_key' });
}
async function chatCompletion(systemPrompt, userPrompt, apiKey = '', model = DEFAULT_MODEL) {
  const response = await getGroqClient(apiKey).chat.completions.create({
    model: MODELS[model] ? model : DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 2000,response_format: { type: 'json_object' },
  });

  const aiMessage = JSON.parse(response.choices[0].message.content);
  const tokenUsage = response.usage;

  console.log("Metadata caught: ", tokenUsage);

  return { content: aiMessage, usage: tokenUsage };
}




// 1. Error Explanation
async function explainError(code, error, language, apiKey = '', model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are a coding mentor. Analyze errors and explain them simply. Always respond in valid JSON.`,
    `The user wrote code in ${language} and got this error:

Code:
${code}

Error:
${error}

Respond in this EXACT JSON format:
{
  "issue": "one-line description of the exact problem",
  "explanation": "simple 2-3 sentence explanation a beginner would understand",
  "fix": "the specific code change needed",
  "bestPractice": "one tip to avoid this in future"
}`,
    apiKey,
    model
  );
}

// 2. Code Fix
async function fixCodeAI(code, error, language, apiKey = '' ,model = DEFAULT_MODEL) {
  const response = await chatCompletionText(
    `You are a code repair expert. Fix this code while keeping the user's logic intact. Return ONLY the corrected code. Do NOT wrap it in markdown. Do not say "Here is the code". CRITICAL: Do NOT output any <think> tags, do NOT explain your reasoning. Just output the raw code.`,
    `Fix this ${language} code:

${code}

Error (if any):
${error || 'No specific error, but optimize and fix any issues.'}`,
    apiKey,
    model
  );

  let fixedCode = response.content;

  // Strip reasoning tags robustly (even if unclosed)
  const thinkStart = fixedCode.indexOf('<think>');
  if (thinkStart !== -1) {
    const thinkEnd = fixedCode.indexOf('</think>');
    if (thinkEnd !== -1) {
      fixedCode = fixedCode.substring(0, thinkStart) + fixedCode.substring(thinkEnd + 8);
    } else {
      fixedCode = fixedCode.substring(0, thinkStart);
    }
  }

  // Strip markdown code fences and conversational text if the model still adds them
  if (fixedCode.includes('```')) {
    const match = fixedCode.match(/```[a-z]*\n([\s\S]*?)```/);
    if (match) {
      fixedCode = match[1];
    } else {
      fixedCode = fixedCode.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
    }
  }

  return { content: { fixedCode: fixedCode.trim() }, usage: response.usage };
}

// 3. Logic Explanation
async function explainLogicAI(code, language, apiKey = '',model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are a CS tutor. Explain code step-by-step. Always respond in valid JSON.`,
    `Explain this ${language} code step-by-step:

${code}

Respond in JSON:
{
  "steps": ["Step 1: ...", "Step 2: ..."],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "summary": "one-line summary"
}`,
    apiKey,
    model
  );
}

// 4. Test Case Generation
async function generateTestsAI(code, language, apiKey = '',model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are a QA engineer. Generate test cases. Always respond in valid JSON.`,
    `Generate test cases for this ${language} function:

${code}

Respond in JSON:
{
  "testCases": [
    { "input": "...", "expected": "...", "type": "normal" },
    { "input": "...", "expected": "...", "type": "normal" },
    { "input": "...", "expected": "...", "type": "edge" },
    { "input": "...", "expected": "...", "type": "edge" }
  ]
}`,
    apiKey,
    model
  );
}

// 5. Security and refactoring audit
async function auditCodeAI(code, language, apiKey = '',model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are a senior application security reviewer and refactoring coach. Audit code for exploitable security risks, reliability hazards, memory/resource leaks, and unsafe architecture. Always respond in valid JSON.`,
    `Audit this ${language} code:

${code}

Respond in this EXACT JSON format:
{
  "summary": "one-line audit summary",
  "riskScore": 0,
  "findings": [
    {
      "severity": "High",
      "title": "short finding title",
      "explanation": "why this is risky in 1-2 sentences",
      "evidence": "specific code pattern or line reference if obvious",
      "suggestion": "specific mitigation",
      "refactor": "cleaner architecture or safer pattern"
    }
  ],
  "remediationSteps": ["highest priority next step", "second priority next step"]
}

Rules:
- Use severity values High, Medium, or Low.
- Use riskScore as an integer from 0 to 100.
- Include an empty findings array when no meaningful risk is found.
- Do not invent line numbers when they are not obvious from the snippet.
- Prefer concrete secure-coding guidance over generic advice.`,
    apiKey,
    model
  );
}

// 6. Execution Visualization
async function visualizeAI(code, language, input = '', apiKey = '',model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are a code tracer. Trace through code step by step showing variable states. Always respond in valid JSON.`,
    `Trace through this ${language} code step by step. Show variable states after each line.

${code}

${input ? `Input: ${input}` : ''}

Respond in JSON:
{
  "steps": [
    { "line": 1, "code": "x = 0", "variables": {"x": 0}, "explanation": "Initialize x" },
    { "line": 2, "code": "x += 1", "variables": {"x": 1}, "explanation": "Increment x" }
  ]
}`,
    apiKey,
    model
  );
}

// 7. AI Code Explainer — explains a selected code snippet in plain language
async function explainCodeSnippetAI(code, language, apiKey = '',model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are an expert programming tutor. When a user highlights a snippet of code, explain what it does in simple, beginner-friendly language. Always respond in valid JSON.`,
    `Explain this ${language} code snippet in simple terms:

${code}

Respond in this EXACT JSON format:
{
  "title": "Short 3-5 word title of what this code does",
  "explanation": "A clear 2-4 sentence explanation a beginner would understand",
  "concepts": ["concept1", "concept2"],
  "tip": "One practical tip related to this code"
}`,
    apiKey,
    model
  );
}

// 8. AI Code Explainer — follow-up Q&A on previously explained code
async function askFollowUpAI(code, language, question, previousExplanation, apiKey = '',model = DEFAULT_MODEL) {
  return chatCompletion(
    `You are an expert programming tutor engaged in an interactive Q&A session. The user previously highlighted code and received an explanation. Now they have a follow-up question. Answer clearly and concisely. Always respond in valid JSON.`,
    `The user is asking about this ${language} code:

${code}

Previous explanation: ${previousExplanation}

User's follow-up question: ${question}

Respond in this EXACT JSON format:
{
  "answer": "A clear, concise answer to their question",
  "codeExample": "Optional: a small code example if it helps clarify (or empty string if not needed)"
}`,
    apiKey,
    model
  );
}

module.exports = {
  explainError,
  fixCodeAI,
  explainLogicAI,
  generateTestsAI,
  auditCodeAI,
  visualizeAI,
  explainCodeSnippetAI,
  askFollowUpAI,
};

/**
 * A lightweight client-side line-by-line diff utility.
 * Compares two multi-line strings and returns a unified-diff-like text representation.
 * 
 * @param {string} oldText - The original text snapshot
 * @param {string} newText - The current/modified text
 * @returns {string} The unified diff format representation
 */
export function computeSimpleDiff(oldText = '', newText = '') {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const oldLen = oldLines.length;
  const newLen = newLines.length;
  
  // Basic LCS (Longest Common Subsequence) DP table to compute line-level diff
  const dp = Array.from({ length: oldLen + 1 }, () => Array(newLen + 1).fill(0));
  
  for (let i = 1; i <= oldLen; i++) {
    for (let j = 1; j <= newLen; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const diffResult = [];
  let i = oldLen;
  let j = newLen;
  
  // Reconstruct path to build diff
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      // Line is unchanged (keep a context reference or small buffer, or just skip to save tokens)
      // To keep it simple and readable for AI, we'll prefix unchanged lines with space
      diffResult.unshift(`  ${oldLines[i - 1]}`);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Line added
      diffResult.unshift(`+ ${newLines[j - 1]}`);
      j--;
    } else if (i > 0 && (j === 0 || dp[i - 1][j] > dp[i][j - 1])) {
      // Line deleted
      diffResult.unshift(`- ${oldLines[i - 1]}`);
      i--;
    }
  }
  
  return diffResult.join('\n');
}

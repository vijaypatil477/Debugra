import { getSessionGistToken } from './secureGistTokenStore';

const GITHUB_API_URL = 'https://api.github.com/gists';
const MAX_FILES_PER_GIST = 100;

/**
 * Helper to chunk an array into smaller arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Creates one or more GitHub Gists from a list of history objects.
 * Returns an array of created Gist URLs.
 * 
 * @param {Array} historyData - Array of saved code objects from Firestore
 * @param {boolean} isPublic - Whether the gist should be public
 * @param {function} onProgress - Optional callback for tracking multi-gist uploads
 */
export async function createGistsFromHistory(historyData, isPublic = false, onProgress = () => {}) {
  const token = getSessionGistToken();
  if (!token) {
    throw new Error('No GitHub token found. Please authenticate first.');
  }

  // Filter out empty code as Gist API rejects empty files
  const validHistory = historyData.filter(item => item.code && item.code.trim().length > 0);
  if (validHistory.length === 0) {
    throw new Error('No valid non-empty files to export.');
  }

  // Group by chunks of 100 (GitHub limit)
  const chunks = chunkArray(validHistory, MAX_FILES_PER_GIST);
  const createdUrls = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const filesPayload = {};

    // Generate metadata mapping for this chunk
    const metadata = {
      exportedAt: new Date().toISOString(),
      chunk: i + 1,
      totalChunks: chunks.length,
      files: []
    };

    chunk.forEach((item, index) => {
      // Create a unique filename if there are duplicates
      const ext = getExtension(item.language);
      const safeName = (item.name || 'untitled').replace(/[^a-zA-Z0-9-_.]/g, '_');
      let filename = `${safeName}${ext}`;
      
      // Handle naming collisions in the same gist
      if (filesPayload[filename]) {
        filename = `${safeName}_${index}${ext}`;
      }

      filesPayload[filename] = {
        content: item.code
      };

      metadata.files.push({
        id: item.id,
        originalName: item.name,
        gistFilename: filename,
        language: item.language,
        createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : null
      });
    });

    // Attach metadata as an additional file
    filesPayload['debugra_metadata.json'] = {
      content: JSON.stringify(metadata, null, 2)
    };

    const payload = {
      description: `Debugra Code Export${chunks.length > 1 ? ` (Part ${i + 1}/${chunks.length})` : ''}`,
      public: isPublic,
      files: filesPayload
    };

    const response = await fetch(GITHUB_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = 'Failed to create Gist';
      try {
        const errData = await response.json();
        errorMsg = errData.message || errorMsg;
      } catch (e) {
        // ignore JSON parse error
      }
      throw new Error(`GitHub API Error: ${errorMsg}`);
    }

    const responseData = await response.json();
    createdUrls.push(responseData.html_url);

    onProgress({
      completed: i + 1,
      total: chunks.length,
      percentage: Math.round(((i + 1) / chunks.length) * 100)
    });
  }

  return createdUrls;
}

/**
 * Returns common file extensions based on language
 */
function getExtension(language) {
  const map = {
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    csharp: '.cs',
    go: '.go',
    rust: '.rs',
    ruby: '.rb',
    php: '.php',
    swift: '.swift',
    bash: '.sh',
    sql: '.sql',
  };
  return map[language?.toLowerCase()] || '.txt';
}

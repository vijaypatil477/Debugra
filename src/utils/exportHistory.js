import JSZip from 'jszip';

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

/**
 * Generates a ZIP file of the user's history and triggers a browser download.
 * 
 * @param {Array} historyData - Array of saved code objects from Firestore
 */
export async function exportAsZip(historyData) {
  if (!historyData || historyData.length === 0) {
    throw new Error('No history available to export.');
  }

  const zip = new JSZip();
  const metadataFiles = [];

  // Used to prevent filename collisions
  const filenameCount = {};

  historyData.forEach((item) => {
    if (!item.code || item.code.trim().length === 0) return;

    const ext = getExtension(item.language);
    const safeName = (item.name || 'untitled').replace(/[^a-zA-Z0-9-_.]/g, '_');
    
    let filename = `${safeName}${ext}`;
    
    if (filenameCount[filename]) {
      const count = filenameCount[filename]++;
      filename = `${safeName}_${count}${ext}`;
    } else {
      filenameCount[filename] = 1;
    }

    // Add file to ZIP
    zip.file(filename, item.code);

    metadataFiles.push({
      id: item.id,
      originalName: item.name,
      zipFilename: filename,
      language: item.language,
      createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : null
    });
  });

  if (metadataFiles.length === 0) {
    throw new Error('No valid non-empty files to export.');
  }

  // Add metadata JSON
  const metadata = {
    exportedAt: new Date().toISOString(),
    totalFiles: metadataFiles.length,
    files: metadataFiles
  };
  zip.file('debugra_metadata.json', JSON.stringify(metadata, null, 2));

  // Generate blob
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download natively
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `debugra-history-export-${dateStr}.zip`;
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

const GOOGLE_FONT_FAMILIES = {
  'JetBrains Mono': 'JetBrains+Mono:wght@400;500;600;700',
  'Fira Code': 'Fira+Code:wght@400;500;600;700',
  'Source Code Pro': 'Source+Code+Pro:wght@400;500;600;700',
  'Roboto Mono': 'Roboto+Mono:wght@400;500;600;700',
};

const loadedFonts = new Set();

export function ensureEditorFontLoaded(fontFamily) {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!GOOGLE_FONT_FAMILIES[fontFamily] || loadedFonts.has(fontFamily)) return Promise.resolve();

  const linkId = `debugra-font-${fontFamily.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  let link = document.getElementById(linkId);

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONT_FAMILIES[fontFamily]}&display=swap`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  return new Promise((resolve) => {
    const finish = () => {
      loadedFonts.add(fontFamily);
      resolve();
    };

    if (link.sheet) {
      finish();
      return;
    }

    link.addEventListener('load', finish, { once: true });
    link.addEventListener('error', finish, { once: true });
  });
}

export function getEditorFontFamily(fontFamily) {
  return `'${fontFamily}', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Roboto Mono', monospace`;
}

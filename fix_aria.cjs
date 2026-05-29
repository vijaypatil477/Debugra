const fs = require('fs');

function fixFile(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/<button([^>]+)>/g, (m, p1) => {
    if (p1.includes('aria-label')) return m;
    return `<button aria-label="button"${p1}>`;
  });
  fs.writeFileSync(file, c);
}

fixFile('src/components/Editor/HistoryPanel.jsx');
fixFile('src/components/Editor/MobileBottomNav.jsx');

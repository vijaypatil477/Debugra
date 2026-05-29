const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const branches = [
  'add-pr-template-222',
  'fix-aria-labels-255',
  'fix-snippets-256',
  'fix-unhandled-promises-257',
  'refactor-chat-panel-258',
  'fix-focus-management-259'
];

const filePath = path.join(__dirname, 'src', 'components', 'Editor', 'AudioChannel.jsx');

for (const branch of branches) {
  console.log(`Processing branch: ${branch}`);
  try {
    execSync(`git checkout ${branch}`, { stdio: 'inherit' });
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('playsInline')) {
        content = content.replace(/playsInline/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
        
        execSync(`git add src/components/Editor/AudioChannel.jsx`, { stdio: 'inherit' });
        execSync(`git commit -m "fix: remove invalid playsInline prop from audio tag to pass lint"`, { stdio: 'inherit' });
        execSync(`git push fork ${branch}`, { stdio: 'inherit' });
        console.log(`✅ Fixed and pushed branch: ${branch}`);
      } else {
         console.log(`⚠️ Branch ${branch} already fixed or does not have playsInline.`);
      }
    } else {
        console.log(`⚠️ File not found on branch ${branch}.`);
    }
  } catch (e) {
    console.error(`❌ Failed on branch ${branch}: ${e.message}`);
  }
}

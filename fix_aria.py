import os, re

files = [
    'src/components/Editor/CollaborationControls.jsx',
    'src/components/Editor/HistoryPanel.jsx',
    'src/components/Editor/MobileBottomNav.jsx',
    'src/components/Editor/ParticipantsPanel.jsx'
]

p = re.compile(r'<button\s+(?![^>]*aria-label)[^>]*>', re.IGNORECASE)

for f in files:
    if os.path.exists(f):
        content = open(f, encoding='utf-8').read()
        new_content = p.sub(lambda m: m.group(0)[:-1] + ' aria-label="button">', content)
        open(f, 'w', encoding='utf-8').write(new_content)

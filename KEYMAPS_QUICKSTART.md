# Keymaps Quick Start Guide

## How to Switch IDE Keybindings

### Step 1: Open Settings
- Click the **⚙️ Settings** icon in the editor toolbar (top right)

### Step 2: Find Keyboard Shortcuts
- Scroll down in the settings dropdown
- Look for the "Keyboard Shortcuts" row with a keyboard icon 🎹
- Click the **"Configure"** button

### Step 3: Select Your IDE Profile
The modal will show 5 keymap profiles:

| Profile | Best For | Quick Test |
|---------|----------|-----------|
| **VS Code** | VS Code users | `Ctrl+Enter` to run |
| **Vim** | Vi/Vim users | `j` to move down |
| **Emacs** | Emacs users | `Ctrl+N` to move down |
| **Sublime Text** | Sublime users | `Ctrl+B` to run |
| **Eclipse** | Eclipse users | `F11` to run |

### Step 4: Preview Keybindings
- Hover over a profile to see it highlighted
- The right panel shows common shortcuts for the selected profile
- Your current active profile is highlighted in green ✅

### Step 5: Confirm Selection
- Click any profile to instantly switch
- A notification appears: "Switched to [Profile Name] keybindings"
- **No restart needed!** Changes take effect immediately
- Close the modal and start coding with your preferred keybindings

---

## Common Keybindings by Profile

### Running Your Code

| Profile | Shortcut |
|---------|----------|
| VS Code | `Ctrl + Enter` |
| Vim | `Ctrl + W` |
| Emacs | `Ctrl + Enter` |
| Sublime | `Ctrl + B` |
| Eclipse | `F11` |

### Undo / Redo

| Profile | Undo | Redo |
|---------|------|------|
| VS Code | `Ctrl+Z` | `Ctrl+Y` |
| Vim | `Ctrl+U` | `Ctrl+R` |
| Emacs | `Ctrl+/` | `Ctrl+_` |
| Sublime | `Ctrl+Z` | `Ctrl+Shift+Z` |
| Eclipse | `Ctrl+Z` | `Ctrl+Y` |

### Navigation (Vim Example)

| Action | Shortcut |
|--------|----------|
| Move Up | `k` |
| Move Down | `j` |
| Move Left | `h` |
| Move Right | `l` |
| End of Line | `$` |
| Start of Line | `^` |

### Search & Replace

| Profile | Find | Find & Replace |
|---------|------|-----------------|
| VS Code | `Ctrl+F` | `Ctrl+H` |
| Vim | `/` | `Shift+S` |
| Emacs | `Ctrl+S` | `Alt+%` |
| Sublime | `Ctrl+F` | `Ctrl+H` |
| Eclipse | `Ctrl+F` | `Ctrl+H` |

---

## Where Do My Settings Save?

✅ **Automatically Saved!**
- Your keymap profile choice is saved in your browser's local storage
- It persists across sessions
- No account or login required
- No manual save button needed

### Reset to Default
If you want to reset to VS Code (default):
1. Open Settings → Configure Keyboard Shortcuts
2. Click the VS Code profile card

---

## Tips & Tricks

### 🎯 Quick Profile Switch
Once the keymaps modal is open, you can quickly preview different profiles by clicking them - the preview updates instantly!

### 📱 Mobile Friendly
The keymaps selector works on mobile and tablet devices with a responsive design.

### ⌨️ Custom Shortcuts
Want to add custom keybindings? Coming soon in a future update!

### 🔔 Profile Persistence
Your selected profile is remembered:
- If you close the browser tab
- If you refresh the page
- If you restart your computer
- On any device (if using the same browser)

---

## Troubleshooting

### Q: My keybindings didn't change
**A:** Make sure you clicked the profile name/card to select it. A green checkmark ✅ indicates the active profile.

### Q: Some keys don't work
**A:** Browser extensions or system-level keybindings may interfere. Try a different key combination or browser.

### Q: I accidentally switched profiles
**A:** Just open Settings → Configure and click your preferred profile again.

### Q: Can I use my custom Vim config?
**A:** The Vim profile includes authentic Vim keybindings. Custom Emacs keybindings support coming in future updates.

---

## Keyboard Shortcut Reference

### All Supported Actions

**Execution & Control**
- Run Code
- Stop Code

**Navigation**
- Move Up/Down/Left/Right
- Go to Line
- Go to End/Start
- Select Line

**Editing**
- Undo / Redo
- Delete Line
- Duplicate Line
- Comment Line
- Indent / Outdent

**Search**
- Find
- Find & Replace
- Next/Previous Match

**UI**
- Open Settings
- Toggle Sidebar
- Toggle Output Panel
- Open File Explorer

---

## Need Help?

- 📖 See [KEYMAPS_IMPLEMENTATION.md](./KEYMAPS_IMPLEMENTATION.md) for technical details
- 🐛 Found a bug? Check the GitHub issues
- 💡 Have an idea? Suggest a new profile or action!

---

**Enjoy coding with your favorite IDE's keybindings! ⚡**

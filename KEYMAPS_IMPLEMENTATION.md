# Centralized Keymaps System Implementation

## Overview

The Debugra editor now features a **centralized keymaps management system** that allows users to instantly swap between different IDE keyboard profiles (VS Code, Vim, Emacs, Sublime Text, Eclipse) without session reboots.

## Architecture

### 1. **Core Configuration** (`src/config/keymaps.js`)

Defines the keymap profiles and action system:

```javascript
// Action definitions
export const EDITOR_ACTIONS = {
  RUN_CODE: 'runCode',
  UNDO: 'undo',
  REDO: 'redo',
  // ... 20+ actions
};

// Keymap profiles
export const KEYMAPS = {
  'vscode': { name: 'VS Code (Default)', bindings: {...} },
  'vim': { name: 'Vim', bindings: {...} },
  'emacs': { name: 'Emacs', bindings: {...} },
  'sublime': { name: 'Sublime Text', bindings: {...} },
  'eclipse': { name: 'Eclipse IDE', bindings: {...} },
};
```

**Key Features:**
- 20+ editor actions mapped (Run Code, Undo, Redo, Select Line, Delete Line, Comment, Find, etc.)
- 5 built-in IDE profiles with authentic keybindings
- Utilities for formatting and matching key bindings

### 2. **Keymaps Hook** (`src/hooks/useKeymaps.js`)

Provides a React hook for managing keymaps state and keyboard events:

```javascript
const keymaps = useKeymaps();

// Key methods:
keymaps.switchProfile('vim');              // Switch profile instantly
keymaps.getBinding(action);                 // Get keybinding for action
keymaps.getFormattedBinding(action);        // Get formatted string (e.g., "Ctrl+Enter")
keymaps.matchAction(action, event);         // Check if event matches action
keymaps.registerAction(action, handler);    // Register action handler
keymaps.handleGlobalKeyDown(event);         // Global keyboard listener
```

**Features:**
- Persistent storage in `localStorage` (key: `debugra-keymap-profile`)
- Automatic profile persisting across sessions
- Dynamic action handler registration
- Event matching with modifier support (Ctrl, Shift, Alt, Cmd)

### 3. **UI Component** (`src/components/Editor/KeymapsSelector.jsx`)

Visual interface for selecting and previewing keymap profiles:

```jsx
<KeymapsSelector
  keymaps={keymaps}
  selectedProfile={keymaps.currentProfile}
  onSelectProfile={(profileId) => {
    // Handle profile selection
  }}
/>
```

**Features:**
- Profile cards with descriptions
- Live preview of common keybindings
- Instant visual feedback on selection
- Responsive design (mobile-friendly)

### 4. **EditorPage Integration** (`src/components/Editor/EditorPage.jsx`)

Integrates keymaps into the main editor:

```javascript
// Initialize keymaps
const keymaps = useKeymaps();

// Register actions
useEffect(() => {
  keymaps.registerAction(keymaps.EDITOR_ACTIONS.RUN_CODE, () => {
    if (executionRunRef.current) executionRunRef.current();
  });
}, [keymaps]);

// Setup global listener
useEffect(() => {
  window.addEventListener('keydown', keymaps.handleGlobalKeyDown);
  return () => {
    window.removeEventListener('keydown', keymaps.handleGlobalKeyDown);
  };
}, [keymaps.handleGlobalKeyDown]);
```

**Integration Points:**
- Settings dropdown menu with "Configure" button
- Keymaps modal for profile selection and preview
- Global keyboard listener for all registered actions
- Toast notification on profile switch

## Supported IDE Profiles

### VS Code (Default)
- **Description:** Default VS Code keybindings
- **Key Bindings:**
  - Run Code: `Ctrl+Enter`
  - Undo: `Ctrl+Z`
  - Redo: `Ctrl+Y`
  - Comment Line: `Ctrl+/`
  - Go to Line: `Ctrl+G`

### Vim
- **Description:** Vim-style modal editing
- **Key Bindings:**
  - Run Code: `Ctrl+W` (write)
  - Move Up: `k`
  - Move Down: `j`
  - Move Left: `h`
  - Move Right: `l`
  - Comment: `#`

### Emacs
- **Description:** Emacs-style key chords
- **Key Bindings:**
  - Run Code: `Ctrl+Enter`
  - Move Up: `Ctrl+P`
  - Move Down: `Ctrl+N`
  - Move Left: `Ctrl+B`
  - Move Right: `Ctrl+F`
  - Kill Line: `Ctrl+K`

### Sublime Text
- **Description:** Sublime Text keybindings
- **Key Bindings:**
  - Run Code: `Ctrl+B` (build)
  - Undo: `Ctrl+Z`
  - Redo: `Ctrl+Shift+Z`
  - Duplicate Line: `Ctrl+Shift+D`
  - Select Line: `Ctrl+L`

### Eclipse
- **Description:** Eclipse IDE keybindings
- **Key Bindings:**
  - Run Code: `F11`
  - Go to Line: `Ctrl+L`
  - Delete Line: `Ctrl+D`
  - Undo: `Ctrl+Z`
  - Redo: `Ctrl+Y`

## Supported Actions

The system supports 20+ editor actions:

**Execution:**
- `RUN_CODE` - Execute the current code
- `STOP_CODE` - Stop running code

**Navigation:**
- `SELECT_LINE` - Select current line
- `MOVE_UP/DOWN/LEFT/RIGHT` - Move cursor
- `GO_TO_LINE`, `GO_TO_END`, `GO_TO_START`

**Editing:**
- `UNDO` / `REDO`
- `DELETE_LINE` / `DUPLICATE_LINE`
- `COMMENT_LINE`
- `INDENT` / `OUTDENT`

**Search:**
- `FIND` / `FIND_REPLACE`
- `NEXT_MATCH` / `PREV_MATCH`

**UI:**
- `OPEN_SETTINGS`
- `TOGGLE_SIDEBAR`
- `TOGGLE_OUTPUT`
- `OPEN_FILE_EXPLORER`

## Usage

### For Users

1. **Access Keymaps Settings:**
   - Click the ⚙️ Settings button in the top toolbar
   - Look for "Keyboard Shortcuts" section
   - Click "Configure" button

2. **Select a Keymap Profile:**
   - Click on any profile card (VS Code, Vim, Emacs, Sublime, Eclipse)
   - See real-time preview of keybindings
   - Changes are instant - no restart needed!

3. **Profile Persistence:**
   - Selected profile is saved in browser's localStorage
   - Automatically restored on next session

### For Developers

#### Adding a New Action

```javascript
// In src/config/keymaps.js
export const EDITOR_ACTIONS = {
  // ... existing actions
  MY_NEW_ACTION: 'myNewAction',
};

// Add to each profile's bindings
export const KEYMAPS = {
  'vscode': {
    bindings: {
      // ... existing bindings
      [EDITOR_ACTIONS.MY_NEW_ACTION]: { key: 'F1' },
    },
  },
  // ... other profiles
};
```

#### Registering Action Handler

```javascript
// In EditorPage.jsx or your component
useEffect(() => {
  keymaps.registerAction(keymaps.EDITOR_ACTIONS.MY_NEW_ACTION, () => {
    // Handle the action
    console.log('My new action triggered!');
  });
}, [keymaps]);
```

#### Creating a New Keymap Profile

```javascript
// In src/config/keymaps.js
export const KEYMAPS = {
  // ... existing profiles
  'my-profile': {
    name: 'My Custom Profile',
    description: 'Custom keybindings',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'F5' },
      [EDITOR_ACTIONS.UNDO]: { key: 'z', ctrl: true },
      // ... all actions
    },
  },
};
```

## File Structure

```
src/
├── config/
│   └── keymaps.js                    # Core configuration
├── hooks/
│   ├── useKeymaps.js                 # Keymaps state management
│   └── index.js                      # Updated exports
├── components/Editor/
│   ├── KeymapsSelector.jsx           # UI component
│   ├── KeymapsSelector.css           # Styles
│   └── EditorPage.jsx                # Integration
```

## Key Benefits

✅ **Instant Profile Switching** - No session reboots required
✅ **Multiple IDE Profiles** - VS Code, Vim, Emacs, Sublime, Eclipse
✅ **Extensible System** - Easy to add new actions and profiles
✅ **Persistent Storage** - Profile choice saved across sessions
✅ **Live Preview** - See keybindings before switching
✅ **Responsive UI** - Works on desktop and mobile
✅ **Centralized Management** - Single source of truth for all keybindings

## Technical Highlights

### Key Binding Matching Algorithm

```javascript
function matchesBinding(event, binding) {
  // Check modifiers
  if (binding.ctrl && !event.ctrlKey && !event.metaKey) return false;
  if (binding.shift && !event.shiftKey) return false;
  if (binding.alt && !event.altKey) return false;
  
  // Check key
  return event.key === binding.key || 
         event.key.toLowerCase() === binding.key.toLowerCase();
}
```

### LocalStorage Schema

```javascript
// Key: 'debugra-keymap-profile'
// Value: 'vscode' | 'vim' | 'emacs' | 'sublime' | 'eclipse'
localStorage.setItem('debugra-keymap-profile', 'vim');
```

## Browser Compatibility

- Works with all modern browsers supporting:
  - ES6+ (const, arrow functions, destructuring)
  - React 18+
  - localStorage API
  - Keyboard events (KeyboardEvent)

## Future Enhancements

1. **Custom Profile Creation** - Allow users to create and save custom keybindings
2. **Profile Import/Export** - Share custom profiles via JSON
3. **Conflict Detection** - Warn about duplicate key bindings
4. **Command Palette** - Searchable command execution (Ctrl+Shift+P)
5. **Profile Sync** - Cloud sync of user preferences
6. **Macro Support** - Record and playback key sequences

## Performance Considerations

- Lightweight event listener (single listener on window)
- O(n) action lookup where n = registered actions (typically < 50)
- localStorage operations are synchronous but fast
- No unnecessary re-renders due to proper dependency arrays

## Debugging

### Check Current Profile

```javascript
// In browser console
localStorage.getItem('debugra-keymap-profile')
```

### Test Key Binding Matching

```javascript
// In browser console
const keymaps = new Map(); // Would need to expose via window
keymaps.matchAction('runCode', keyboardEvent)
```

## Conclusion

The Debugra keymaps system provides a modern, extensible solution for multi-IDE keyboard profile support. Users can seamlessly switch between their preferred editor's keybindings instantly, enhancing productivity and familiarity for developers transitioning between different tools.

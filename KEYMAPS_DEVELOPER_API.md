# Keymaps System - Developer API Guide

## Overview

This guide explains how to use and extend the Debugra Keymaps System for developers.

---

## Core API

### `useKeymaps()` Hook

The main React hook for managing keymaps.

```javascript
import { useKeymaps } from '@/hooks';

function MyComponent() {
  const keymaps = useKeymaps();
  
  // Use keymaps methods here
  return <div>{keymaps.currentProfile}</div>;
}
```

---

## API Reference

### State Properties

#### `currentProfile: string`
The currently active keymap profile ID.

```javascript
console.log(keymaps.currentProfile); // 'vim' | 'vscode' | 'emacs' | ...
```

#### `EDITOR_ACTIONS: object`
Constants for all available editor actions.

```javascript
console.log(keymaps.EDITOR_ACTIONS.RUN_CODE);      // 'runCode'
console.log(keymaps.EDITOR_ACTIONS.UNDO);          // 'undo'
console.log(keymaps.EDITOR_ACTIONS.COMMENT_LINE);  // 'commentLine'
```

---

### Methods

#### `switchProfile(profileId: string): boolean`
Switch to a different keymap profile.

```javascript
// Switch to Vim keybindings
const success = keymaps.switchProfile('vim');

if (success) {
  console.log('Switched to Vim keybindings');
} else {
  console.log('Invalid profile ID');
}
```

**Parameters:**
- `profileId` (string): One of `'vscode'`, `'vim'`, `'emacs'`, `'sublime'`, `'eclipse'`

**Returns:** `boolean` - True if switch was successful

---

#### `getProfiles(): Array<ProfileInfo>`
Get list of all available keymap profiles.

```javascript
const profiles = keymaps.getProfiles();
// [
//   { id: 'vscode', name: 'VS Code (Default)', description: '...' },
//   { id: 'vim', name: 'Vim', description: '...' },
//   ...
// ]
```

**Returns:**
```typescript
{
  id: string;           // Profile identifier
  name: string;         // Display name
  description: string;  // Short description
}[]
```

---

#### `getCurrentProfileInfo(): ProfileInfo | null`
Get information about the current profile.

```javascript
const profileInfo = keymaps.getCurrentProfileInfo();
console.log(profileInfo.name); // 'Vim'
console.log(profileInfo.description); // 'Vim-style modal editing'
```

**Returns:** `ProfileInfo | null`

---

#### `getBinding(action: string): KeyBinding | undefined`
Get the key binding for a specific action in current profile.

```javascript
const runBinding = keymaps.getBinding(keymaps.EDITOR_ACTIONS.RUN_CODE);
// { key: 'Enter', ctrl: true }  // for VS Code
// { key: 'w', ctrl: true }      // for Vim
```

**Parameters:**
- `action` (string): Action constant from `EDITOR_ACTIONS`

**Returns:**
```typescript
{
  key: string;      // Key name ('Enter', 'a', 'F1', etc.)
  ctrl?: boolean;   // Ctrl/Cmd modifier
  shift?: boolean;  // Shift modifier
  alt?: boolean;    // Alt modifier
  cmd?: boolean;    // Cmd modifier (macOS)
}
```

---

#### `getFormattedBinding(action: string): string`
Get human-readable key binding string.

```javascript
const bindingStr = keymaps.getFormattedBinding(keymaps.EDITOR_ACTIONS.RUN_CODE);
console.log(bindingStr); // 'Ctrl+Enter' or 'Ctrl+W' depending on profile
```

**Returns:** `string` - Formatted like "Ctrl+Enter", "Shift+J", "F11"

---

#### `getCurrentBindings(): Record<string, KeyBinding>`
Get all bindings for the current profile.

```javascript
const allBindings = keymaps.getCurrentBindings();
console.log(allBindings[keymaps.EDITOR_ACTIONS.RUN_CODE]);     // Current run binding
console.log(allBindings[keymaps.EDITOR_ACTIONS.COMMENT_LINE]); // Current comment binding
```

**Returns:** Object mapping action IDs to KeyBindings

---

#### `matchAction(action: string, event: KeyboardEvent): boolean`
Check if a keyboard event matches an action's binding.

```javascript
document.addEventListener('keydown', (event) => {
  if (keymaps.matchAction(keymaps.EDITOR_ACTIONS.RUN_CODE, event)) {
    console.log('Run code triggered!');
  }
});
```

**Parameters:**
- `action` (string): Action constant
- `event` (KeyboardEvent): The keyboard event to check

**Returns:** `boolean` - True if event matches the binding

---

#### `registerAction(action: string, handler: Function): void`
Register a handler for an action.

```javascript
keymaps.registerAction(keymaps.EDITOR_ACTIONS.RUN_CODE, () => {
  console.log('Code execution started!');
  executeCode();
});

keymaps.registerAction(keymaps.EDITOR_ACTIONS.UNDO, (event) => {
  console.log('Undo triggered by event', event);
  performUndo();
});
```

**Parameters:**
- `action` (string): Action constant
- `handler` (Function): Callback function. Receives the KeyboardEvent

---

#### `handleGlobalKeyDown(event: KeyboardEvent): void`
Global keyboard event listener. Call this in a window keydown listener.

```javascript
useEffect(() => {
  window.addEventListener('keydown', keymaps.handleGlobalKeyDown);
  
  return () => {
    window.removeEventListener('keydown', keymaps.handleGlobalKeyDown);
  };
}, [keymaps.handleGlobalKeyDown]);
```

This automatically:
- Checks all registered actions
- Matches keyboard events to bindings
- Calls appropriate handlers
- Prevents default browser behavior

---

## Usage Patterns

### Pattern 1: Basic Setup

```javascript
import { useKeymaps } from '@/hooks';
import { useEffect } from 'react';

function EditorComponent() {
  const keymaps = useKeymaps();
  
  // Register handlers
  useEffect(() => {
    keymaps.registerAction(keymaps.EDITOR_ACTIONS.RUN_CODE, () => {
      executeCode();
    });
    
    keymaps.registerAction(keymaps.EDITOR_ACTIONS.UNDO, () => {
      handleUndo();
    });
  }, [keymaps]);
  
  // Setup global listener
  useEffect(() => {
    window.addEventListener('keydown', keymaps.handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', keymaps.handleGlobalKeyDown);
    };
  }, [keymaps.handleGlobalKeyDown]);
  
  return <div>Editor</div>;
}
```

### Pattern 2: Display Key Hints

```javascript
function RunButton() {
  const keymaps = useKeymaps();
  
  return (
    <button>
      Run Code
      <span className="hint">
        {keymaps.getFormattedBinding(keymaps.EDITOR_ACTIONS.RUN_CODE)}
      </span>
    </button>
  );
}
```

### Pattern 3: Profile Switcher

```javascript
function ProfileSelector() {
  const keymaps = useKeymaps();
  
  return (
    <div>
      {keymaps.getProfiles().map(profile => (
        <button
          key={profile.id}
          onClick={() => keymaps.switchProfile(profile.id)}
          disabled={profile.id === keymaps.currentProfile}
        >
          {profile.name}
        </button>
      ))}
    </div>
  );
}
```

### Pattern 4: Conditional Behavior

```javascript
function Editor() {
  const keymaps = useKeymaps();
  
  useEffect(() => {
    const handler = () => {
      // Different behavior based on profile
      if (keymaps.currentProfile === 'vim') {
        // Vim-specific behavior
        enterVimMode();
      } else {
        // Standard behavior
        runCode();
      }
    };
    
    keymaps.registerAction(keymaps.EDITOR_ACTIONS.RUN_CODE, handler);
  }, [keymaps.currentProfile]);
}
```

---

## Configuration

### Adding a New Action

1. **Add to EDITOR_ACTIONS in `src/config/keymaps.js`:**

```javascript
export const EDITOR_ACTIONS = {
  // ... existing actions
  MY_CUSTOM_ACTION: 'myCustomAction',
};
```

2. **Add to all keymap profiles:**

```javascript
export const KEYMAPS = {
  'vscode': {
    bindings: {
      // ... existing bindings
      [EDITOR_ACTIONS.MY_CUSTOM_ACTION]: { key: 'F12' },
    },
  },
  // Repeat for vim, emacs, sublime, eclipse...
};
```

3. **Register handler in your component:**

```javascript
useEffect(() => {
  keymaps.registerAction(keymaps.EDITOR_ACTIONS.MY_CUSTOM_ACTION, () => {
    // Handle the action
  });
}, [keymaps]);
```

---

### Creating a New Keymap Profile

1. **Add to KEYMAPS in `src/config/keymaps.js`:**

```javascript
export const KEYMAPS = {
  // ... existing profiles
  'my-editor': {
    name: 'My Editor',
    description: 'Custom keybindings for my editor',
    bindings: {
      [EDITOR_ACTIONS.RUN_CODE]: { key: 'F5' },
      [EDITOR_ACTIONS.UNDO]: { key: 'z', ctrl: true },
      [EDITOR_ACTIONS.REDO]: { key: 'y', ctrl: true },
      [EDITOR_ACTIONS.SELECT_LINE]: { key: 'l', ctrl: true },
      [EDITOR_ACTIONS.MOVE_UP]: { key: 'ArrowUp' },
      [EDITOR_ACTIONS.MOVE_DOWN]: { key: 'ArrowDown' },
      [EDITOR_ACTIONS.MOVE_LEFT]: { key: 'ArrowLeft' },
      [EDITOR_ACTIONS.MOVE_RIGHT]: { key: 'ArrowRight' },
      [EDITOR_ACTIONS.GO_TO_LINE]: { key: 'g', ctrl: true },
      [EDITOR_ACTIONS.GO_TO_END]: { key: 'End' },
      [EDITOR_ACTIONS.GO_TO_START]: { key: 'Home' },
      [EDITOR_ACTIONS.DELETE_LINE]: { key: 'd', ctrl: true },
      [EDITOR_ACTIONS.DUPLICATE_LINE]: { key: 'd', ctrl: true, shift: true },
      [EDITOR_ACTIONS.COMMENT_LINE]: { key: '/', ctrl: true },
      [EDITOR_ACTIONS.INDENT]: { key: 'Tab' },
      [EDITOR_ACTIONS.OUTDENT]: { key: 'Tab', shift: true },
      [EDITOR_ACTIONS.FIND]: { key: 'f', ctrl: true },
      [EDITOR_ACTIONS.FIND_REPLACE]: { key: 'h', ctrl: true },
      [EDITOR_ACTIONS.NEXT_MATCH]: { key: 'g', ctrl: true, shift: true },
      [EDITOR_ACTIONS.PREV_MATCH]: { key: 'g', ctrl: true },
      [EDITOR_ACTIONS.OPEN_SETTINGS]: { key: ',' , ctrl: true },
      [EDITOR_ACTIONS.TOGGLE_SIDEBAR]: { key: 'b', ctrl: true },
      [EDITOR_ACTIONS.TOGGLE_OUTPUT]: { key: '`', ctrl: true },
    },
  },
};
```

2. **Update KEYMAP_PROFILES if needed** (auto-updated from KEYMAPS keys)

3. **Test the new profile:**

```javascript
keymaps.switchProfile('my-editor');
console.log(keymaps.getCurrentProfileInfo().name); // 'My Editor'
```

---

## Advanced Examples

### Example 1: Action History/Logging

```javascript
function setupActionLogging(keymaps) {
  const actionLog = [];
  
  keymaps.EDITOR_ACTIONS.forEach(action => {
    keymaps.registerAction(action, (event) => {
      actionLog.push({
        action,
        timestamp: Date.now(),
        profile: keymaps.currentProfile,
        key: event.key,
      });
      
      if (actionLog.length > 100) actionLog.shift();
    });
  });
  
  return actionLog;
}
```

### Example 2: Conflict Detection

```javascript
function findConflicts(keymaps) {
  const bindings = keymaps.getCurrentBindings();
  const conflicts = [];
  const seen = new Map();
  
  Object.entries(bindings).forEach(([action, binding]) => {
    const key = JSON.stringify(binding);
    if (seen.has(key)) {
      conflicts.push({
        action1: seen.get(key),
        action2: action,
        binding,
      });
    } else {
      seen.set(key, action);
    }
  });
  
  return conflicts;
}
```

### Example 3: Profile Statistics

```javascript
function getProfileStats(keymaps) {
  return keymaps.getProfiles().map(profile => {
    const originalProfile = keymaps.currentProfile;
    keymaps.switchProfile(profile.id);
    const bindings = keymaps.getCurrentBindings();
    keymaps.switchProfile(originalProfile);
    
    return {
      profile: profile.name,
      actionCount: Object.keys(bindings).length,
      hasCtrlBindings: Object.values(bindings).filter(b => b.ctrl).length,
      hasAltBindings: Object.values(bindings).filter(b => b.alt).length,
    };
  });
}
```

---

## Performance Tips

1. **Register handlers in useEffect with dependency on keymaps**
2. **Use the centralized listener (handleGlobalKeyDown) instead of multiple listeners**
3. **Avoid recreating the keymaps hook unnecessarily**
4. **Cache profile info if you need it multiple times**

```javascript
// ✅ Good
useEffect(() => {
  keymaps.registerAction(ACTION, handler);
}, [keymaps]);

// ❌ Avoid
Object.keys(EDITOR_ACTIONS).forEach(action => {
  window.addEventListener('keydown', (e) => {
    if (keymaps.matchAction(action, e)) handler();
  });
});
```

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

---

## Troubleshooting

### Actions not triggering?
- Check that handler is registered: `keymaps.registerAction(...)`
- Verify event listener is attached: `addEventListener('keydown', ...)`
- Check browser console for errors

### Profile not switching?
- Verify profile ID exists: `keymaps.getProfiles()`
- Check localStorage: `localStorage.getItem('debugra-keymap-profile')`
- Try hard refresh (Ctrl+Shift+R)

### Keybinding not working?
- Check modifiers: `{ key: 'Enter', ctrl: true }` for Ctrl+Enter
- Test with: `keymaps.matchAction(action, event)` in console
- Check browser/OS keybinding conflicts

---

## Debugging Utilities

### Log Current Bindings
```javascript
// In browser console
const bindings = keymaps.getCurrentBindings();
Object.entries(bindings).forEach(([action, binding]) => {
  console.log(`${action}: ${keymaps.getFormattedBinding(action)}`);
});
```

### Test Action Matching
```javascript
// Create a fake event
const testEvent = new KeyboardEvent('keydown', {
  key: 'Enter',
  ctrlKey: true,
});

console.log(
  keymaps.matchAction(keymaps.EDITOR_ACTIONS.RUN_CODE, testEvent)
); // true/false
```

### Monitor Profile Changes
```javascript
setInterval(() => {
  console.log('Current profile:', keymaps.currentProfile);
}, 1000);
```

---

## Summary

The Keymaps System provides a robust, extensible way to manage keyboard shortcuts across multiple IDE profiles. Use it to:

- ✅ Support multiple keyboard profiles
- ✅ Provide instant profile switching
- ✅ Maintain consistent action handling
- ✅ Extend with custom actions and profiles
- ✅ Persist user preferences

**Happy coding! ⌨️**

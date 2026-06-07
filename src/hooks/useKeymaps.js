import { useState, useCallback, useEffect, useRef } from 'react';
import { KEYMAPS, DEFAULT_KEYMAP, EDITOR_ACTIONS, matchesBinding, formatKeyBinding } from '../config/keymaps';

/**
 * useKeymaps
 * 
 * Manages keymap profile selection and keyboard event handling
 * - Stores current keymap profile in localStorage
 * - Provides utilities to check if a key binding matches an action
 * - Supports instant profile switching without restart
 */
export function useKeymaps() {
  const [currentProfile, setCurrentProfile] = useState(
    () => localStorage.getItem('debugra-keymap-profile') ?? DEFAULT_KEYMAP
  );

  const actionsRef = useRef({});

  // ─── Persist profile to localStorage ───────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('debugra-keymap-profile', currentProfile);
  }, [currentProfile]);

  // ─── Get current keybindings ──────────────────────────────────────────────
  const getCurrentBindings = useCallback(() => {
    const profile = KEYMAPS[currentProfile];
    return profile ? profile.bindings : KEYMAPS[DEFAULT_KEYMAP].bindings;
  }, [currentProfile]);

  // ─── Get binding for specific action ───────────────────────────────────────
  const getBinding = useCallback(
    (action) => {
      const bindings = getCurrentBindings();
      return bindings[action];
    },
    [getCurrentBindings]
  );

  // ─── Get formatted key string for display ──────────────────────────────────
  const getFormattedBinding = useCallback(
    (action) => {
      const binding = getBinding(action);
      return binding ? formatKeyBinding(binding) : '';
    },
    [getBinding]
  );

  // ─── Check if keyboard event matches an action ─────────────────────────────
  const matchAction = useCallback(
    (action, event) => {
      const binding = getBinding(action);
      return binding ? matchesBinding(event, binding) : false;
    },
    [getBinding]
  );

  // ─── Register action handler ───────────────────────────────────────────────
  const registerAction = useCallback((action, handler) => {
    actionsRef.current[action] = handler;
  }, []);

  // ─── Global keyboard listener (can be attached to window) ──────────────────
  const handleGlobalKeyDown = useCallback(
    (event) => {
      // Prevent if typing in input/textarea
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.contentEditable === 'true'
      ) {
        return;
      }

      // Check each registered action
      for (const [action, handler] of Object.entries(actionsRef.current)) {
        if (matchAction(action, event)) {
          event.preventDefault();
          handler(event);
          break;
        }
      }
    },
    [matchAction]
  );

  // ─── Switch keymap profile ────────────────────────────────────────────────
  const switchProfile = useCallback((profileName) => {
    if (KEYMAPS[profileName]) {
      setCurrentProfile(profileName);
      return true;
    }
    return false;
  }, []);

  // ─── Get all available profiles ────────────────────────────────────────────
  const getProfiles = useCallback(() => {
    return Object.entries(KEYMAPS).map(([id, profile]) => ({
      id,
      name: profile.name,
      description: profile.description,
    }));
  }, []);

  // ─── Get current profile details ───────────────────────────────────────────
  const getCurrentProfileInfo = useCallback(() => {
    const profile = KEYMAPS[currentProfile];
    return profile ? {
      id: currentProfile,
      name: profile.name,
      description: profile.description,
    } : null;
  }, [currentProfile]);

  return {
    // State
    currentProfile,

    // Profile management
    switchProfile,
    getProfiles,
    getCurrentProfileInfo,

    // Binding utilities
    getBinding,
    getFormattedBinding,
    getCurrentBindings,

    // Event matching
    matchAction,
    handleGlobalKeyDown,

    // Action registration
    registerAction,

    // Constants
    EDITOR_ACTIONS,
  };
}

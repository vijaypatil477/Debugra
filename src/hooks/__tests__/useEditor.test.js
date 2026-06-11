/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTO_SAVE_DEBOUNCE_MS } from '../../config/constants';
import { useEditor } from '../useEditor';

const firestoreMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn((...parts) => ({ type: 'collection', parts })),
  doc: vi.fn((...parts) => ({ type: 'doc', parts })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: firestoreMocks.addDoc,
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  serverTimestamp: firestoreMocks.serverTimestamp,
  setDoc: firestoreMocks.setDoc,
}));

vi.mock('../../services/firebase', () => ({
  db: { app: 'mock-db' },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { addDoc, setDoc } = firestoreMocks;

function setOnline(value) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

function renderHook(hook) {
  const container = document.createElement('div');
  const root = createRoot(container);
  let result;

  function Probe({ hookFn }) {
    result = hookFn();
    return null;
  }

  act(() => {
    root.render(React.createElement(Probe, { hookFn: hook }));
  });

  return {
    get result() {
      return result;
    },
    unmount() {
      act(() => root.unmount());
    },
  };
}

async function advanceAutoSaveDelay() {
  await act(async () => {
    vi.advanceTimersByTime(AUTO_SAVE_DEBOUNCE_MS);
    await Promise.resolve();
  });
}

describe('useEditor auto-save', () => {
  const user = { uid: 'user-1', email: 'user@example.com' };

  beforeEach(() => {
    vi.useFakeTimers();
    addDoc.mockResolvedValue({ id: 'manual-save' });
    setDoc.mockResolvedValue(undefined);
    window.prompt = vi.fn(() => 'main.py');
    localStorage.clear();
    setOnline(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('debounces auto-save until after the delay', async () => {
    const hook = renderHook(() => useEditor({ user }));

    act(() => {
      hook.result.setCode('print("hello")');
    });

    act(() => {
      vi.advanceTimersByTime(AUTO_SAVE_DEBOUNCE_MS - 1);
    });
    expect(setDoc).not.toHaveBeenCalled();

    await advanceAutoSaveDelay();

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc.mock.calls[0][1]).toMatchObject({
      code: 'print("hello")',
      language: 'python',
    });

    hook.unmount();
  });

  it('collapses rapid changes into a single Firestore write', async () => {
    const hook = renderHook(() => useEditor({ user }));

    act(() => {
      hook.result.setCode('one');
      hook.result.setCode('two');
      hook.result.setCode('three');
    });

    await advanceAutoSaveDelay();

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc.mock.calls[0][1]).toMatchObject({ code: 'three' });

    hook.unmount();
  });

  it('saves immediately on Ctrl+S without waiting for debounce', async () => {
    const hook = renderHook(() => useEditor({ user }));

    act(() => {
      hook.result.setCode('manual save');
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          bubbles: true,
        })
      );
      await Promise.resolve();
    });

    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).not.toHaveBeenCalled();

    hook.unmount();
  });

  it('queues offline changes and flushes them on reconnect', async () => {
    setOnline(false);
    const hook = renderHook(() => useEditor({ user }));

    act(() => {
      hook.result.setCode('offline change');
    });
    await advanceAutoSaveDelay();

    expect(setDoc).not.toHaveBeenCalled();
    expect(hook.result.hasPendingChanges).toBe(true);

    setOnline(true);
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc.mock.calls[0][1]).toMatchObject({ code: 'offline change' });
    expect(hook.result.hasPendingChanges).toBe(false);

    hook.unmount();
  });

  it('transitions saveStatus through idle, saving, and saved', async () => {
    let resolveSave;
    setDoc.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );
    const hook = renderHook(() => useEditor({ user }));

    expect(hook.result.saveStatus).toBe('idle');

    act(() => {
      hook.result.setCode('status success');
    });
    await advanceAutoSaveDelay();

    expect(hook.result.saveStatus).toBe('saving');

    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });

    expect(hook.result.saveStatus).toBe('saved');
    expect(hook.result.lastSavedAt).toBeInstanceOf(Date);

    hook.unmount();
  });

  it('transitions saveStatus to error when Firestore write fails', async () => {
    setDoc.mockRejectedValue(new Error('write failed'));
    const hook = renderHook(() => useEditor({ user }));

    act(() => {
      hook.result.setCode('status error');
    });
    await advanceAutoSaveDelay();

    expect(hook.result.saveStatus).toBe('error');

    hook.unmount();
  });
});

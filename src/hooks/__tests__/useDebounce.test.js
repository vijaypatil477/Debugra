/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    rerender(nextHook) {
      act(() => {
        root.render(React.createElement(Probe, { hookFn: nextHook }));
      });
    },
    unmount() {
      act(() => root.unmount());
    },
  };
}

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays value updates until after the delay', () => {
    const hook = renderHook(() => useDebounce('initial', 500));

    expect(hook.result).toBe('initial');

    hook.rerender(() => useDebounce('changed', 500));
    expect(hook.result).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(hook.result).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hook.result).toBe('changed');

    hook.unmount();
  });

  it('debounces function calls', () => {
    const callback = vi.fn();
    const hook = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      hook.result('first');
      hook.result('second');
      hook.result('third');
    });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');

    hook.unmount();
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { useIsMobile } from './useIsMobile';
import { MOBILE_BREAKPOINT } from '../config/constants';

describe('useIsMobile', () => {
  let originalInnerWidth;

  beforeAll(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterAll(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setWindowWidth = (width) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  it('should return true if window.innerWidth is less than MOBILE_BREAKPOINT', () => {
    setWindowWidth(MOBILE_BREAKPOINT - 10);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false if window.innerWidth is greater than or equal to MOBILE_BREAKPOINT', () => {
    setWindowWidth(MOBILE_BREAKPOINT + 10);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should update state when window is resized', () => {
    setWindowWidth(MOBILE_BREAKPOINT + 10);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWindowWidth(MOBILE_BREAKPOINT - 20);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });
});

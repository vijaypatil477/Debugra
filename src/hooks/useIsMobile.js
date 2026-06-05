import { useState, useEffect, useCallback } from 'react';
import { MOBILE_BREAKPOINT } from '../config/constants';

/**
 * useIsMobile
 * Tracks whether the current viewport is mobile-sized.
 * Automatically updates on window resize.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

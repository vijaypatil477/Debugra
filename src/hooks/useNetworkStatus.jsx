import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const NetworkStatusContext = createContext(null);
const ONLINE_RECOVERY_TOAST_ID = 'network-recovered-toast';

function getInitialOnlineState() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function NetworkStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(getInitialOnlineState);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => {
      setIsOnline((prev) => {
        if (!prev) {
          toast.success('Back online. Connection restored.', {
            id: ONLINE_RECOVERY_TOAST_ID,
            duration: 4000,
          });
        }
        return true;
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
}

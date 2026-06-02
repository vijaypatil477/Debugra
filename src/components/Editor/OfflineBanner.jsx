import './OfflineBanner.css';
import { useNetworkStatus } from '../../hooks';

const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="network-banner" role="status" aria-live="polite">
      <div className="network-banner__inner">⚠️ Network Disconnected. Working in offline mode.</div>
    </div>
  );
};

export default OfflineBanner;

import { useState, useEffect } from "react";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowSuccess(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showSuccess) return null;

  return (
    <>
      {isOffline && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 9999,
          backgroundColor: "#7f1d1d",
          color: "#fecaca",
          padding: "10px 20px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          ⚠️ Network Disconnected. Working in offline mode.
        </div>
      )}
      {showSuccess && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 9999,
          backgroundColor: "#14532d",
          color: "#bbf7d0",
          padding: "10px 20px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}>
          ✅ Network Reconnected. You are back online!
        </div>
      )}
    </>
  );
};

export default OfflineBanner;
import { useEffect } from "react";

export default function MobileSidebarDrawer({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 999,
          }}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-label="Sidebar menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "280px",
          background: "#1e1e2e",
          zIndex: 1000,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          padding: "1rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "1.3rem",
            cursor: "pointer",
            marginBottom: "0.5rem",
          }}
        >
          ✕
        </button>
        {children}
      </div>
    </>
  );
}
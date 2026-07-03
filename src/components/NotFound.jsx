import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function NotFoundPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="feedback-page">
      <div className="feedback-shell">
        <div className="feedback-copy">
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <Link
              to="/"
              className="feedback-back-link"
              style={{ marginBottom: 0 }}
            >
              ← Back to home
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="feedback-theme-toggle"
              title="Toggle theme"
            >
              {theme === "light" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>

          <p
            className="section-eyebrow"
            style={{
              fontSize: "1.1rem",
              letterSpacing: "0.15em",
            }}
          >
            ERROR 404
          </p>

          <h1 className="feedback-title">
            Looks like this page wandered off.
          </h1>

          <p className="feedback-subtitle">
            The page you&apos;re trying to reach doesn&apos;t exist, may have been moved,
            or the URL might be incorrect.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginTop: "2rem",
              flexWrap: "wrap",
            }}
          >
            <Link to="/" className="feedback-submit">
              Go to Homepage
            </Link>

            <button
              type="button"
              className="feedback-theme-toggle"
              onClick={() => window.history.back()}
            >
              ← Go Back
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "350px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(7rem, 18vw, 12rem)",
              fontWeight: 800,
              lineHeight: 1,
              opacity: 0.08,
              userSelect: "none",
              margin: 0,
            }}
          >
            404
          </h1>
        </div>
      </div>
    </div>
  );
}
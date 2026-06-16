import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export default function Navbar({ onLoginClick, onSignUpClick }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const closeMenu = () => setMobileMenu(false);

  // Helper to determine if we are currently on the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <>
      <nav className="landing-nav">
        <Link to="/" className="landing-nav-left text-decoration-none" onClick={closeMenu}>
          <img
            src={theme === 'light' ? '/icon-light.svg' : '/icon-dark.svg'}
            height="26"
            alt="Debugra Logo"
          />
          <span className="landing-logo">Debugra</span>
          <span className="landing-version-badge">v1.0</span>
        </Link>
        <div className="landing-nav-right desktop-only">
          <Link to="/#features" className="landing-nav-link" onClick={closeMenu}>
            Features
          </Link>
          <Link to="/#languages" className="landing-nav-link" onClick={closeMenu}>
            Languages
          </Link>
          <Link to="/contributors" className="landing-nav-link" onClick={closeMenu}>
            Contributors
          </Link>
          <Link to="/#faq" className="landing-nav-link" onClick={closeMenu}>
            FAQ
          </Link>
          <button
            onClick={() => {
              closeMenu();
              navigate('/feedback');
            }}
            className="landing-nav-link nav-link-button"
          >
            Feedback
          </button>
          <button
            onClick={() => {
              closeMenu();
              if (onLoginClick) onLoginClick();
            }}
            className="landing-btn-ghost"
          >
            Log In
          </button>
          <button
            onClick={() => {
              closeMenu();
              if (onSignUpClick) onSignUpClick();
            }}
            className="landing-btn-primary"
          >
            Sign Up Free
          </button>
          <button
            onClick={toggleTheme}
            className="landing-btn-ghost p-0 d-flex align-items-center justify-content-center theme-toggle-btn"
            title="Toggle theme"
          >
            {theme === 'light' ? (
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
                <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
                <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
                <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2 mobile-only">
          <button
            onClick={toggleTheme}
            className="landing-btn-ghost p-0 d-flex align-items-center justify-content-center theme-toggle-btn"
            title="Toggle theme"
          >
            {theme === 'light' ? (
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
                <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
                <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
                <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button
            className="mobile-menu-btn"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {mobileMenu ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileMenu && (
        <div className="mobile-dropdown">
          <Link to="/#features" className="mobile-dropdown-link" onClick={closeMenu}>
            Features
          </Link>
          <Link to="/#languages" className="mobile-dropdown-link" onClick={closeMenu}>
            Languages
          </Link>
          <Link to="/contributors" className="mobile-dropdown-link" onClick={closeMenu}>
            Contributors
          </Link>
          <Link to="/#faq" className="mobile-dropdown-link" onClick={closeMenu}>
            FAQ
          </Link>
          <button
            className="mobile-dropdown-link text-start"
            onClick={() => {
              closeMenu();
              navigate('/feedback');
            }}
          >
            Feedback
          </button>
          <button
            onClick={() => {
              closeMenu();
              if (onLoginClick) onLoginClick();
            }}
            className="mobile-dropdown-link text-start"
          >
            Log In
          </button>
          <div className="p-3 pt-1">
            <button
              onClick={() => {
                closeMenu();
                if (onSignUpClick) onSignUpClick();
              }}
              className="landing-btn-primary w-100 justify-content-center mt-2"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      )}
    </>
  );
}

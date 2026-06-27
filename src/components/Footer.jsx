import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass =
    'text-[#a1a1aa] hover:text-[#4fc1ff] hover:underline transition-colors duration-200';

  return (
    <footer className="w-full bg-[#1e1e1e] text-[#cccccc] border-t border-[#333333] font-sans text-sm select-none">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Branding Section */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center space-x-2 text-[#569cd6]">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            <span className="font-mono font-bold text-lg tracking-wider text-white">Debugra</span>
          </div>
          <p className="text-[#a1a1aa] text-xs leading-relaxed">
            A modern, browser-based developer experience designed to streamline debugging and
            accelerate your workflow.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold uppercase tracking-wider text-xs">Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a href="/#features" className={linkClass}>Features</a>
            </li>
            <li>
              <a href="/editor" className={linkClass}>Editor</a>
            </li>
            <li>
              <Link to="/feedback" className={linkClass}>Feedback</Link>
            </li>
            <li>
              <Link to="/contributors" className={linkClass}>Contributors</Link>
            </li>
          </ul>
        </div>

        {/* Community */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold uppercase tracking-wider text-xs">Community</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://github.com/vijaypatil477/Debugra/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Contributing Guide
              </a>
            </li>
            <li>
              <a
                href="https://github.com/vijaypatil477/Debugra/discussions"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                GitHub Discussions
              </a>
            </li>
            <li>
              <a
                href="https://github.com/vijaypatil477/Debugra/issues"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                Issue Tracker
              </a>
            </li>
            <li>
              <a
                href="https://github.com/vijaypatil477/Debugra"
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                GitHub Repo
              </a>
            </li>
          </ul>
        </div>

        {/* Connect & Legal */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold uppercase tracking-wider text-xs">Connect</h4>
          <div className="flex space-x-2 text-[#a1a1aa]">
            <a
              href="https://github.com/vijaypatil477/Debugra"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors inline-flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="GitHub"
              title="GitHub"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1da1f2] transition-colors inline-flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Twitter"
              title="Twitter"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#0077b5] transition-colors inline-flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>

          <div className="pt-2 space-y-2 text-xs">
            <h4 className="text-white font-semibold uppercase tracking-wider text-xs">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#privacy" className={linkClass}>Privacy Policy</a>
              </li>
              <li>
                <a href="/#terms" className={linkClass}>Terms of Service</a>
              </li>
              <li>
                <a href="/#cookies" className={linkClass}>Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#181818] border-t border-[#2d2d2d] py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#a1a1aa]">
          <div>
            &copy; {currentYear} <span className="text-[#c586c0]">Debugra</span>. All rights
            reserved.
          </div>

          <div className="flex items-center space-x-1">
            <span>Built with</span>
            <svg
              className="w-3 h-3 text-[#f44336] fill-[#f44336]"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>and proudly</span>
            <a href="https://github.com/vijaypatil477/Debugra/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-[#4fc1ff] hover:underline ml-1 font-mono">
              open-source
            </a>
          </div>

          {/* Back to Top */}
          {showBackToTop && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#a1a1aa] hover:text-[#4fc1ff] transition-colors flex items-center gap-1"
              aria-label="Back to top"
              title="Back to top"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Back to top
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

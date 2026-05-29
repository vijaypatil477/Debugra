import { useState } from 'react';
import toast from 'react-hot-toast';
import './Footer.css';

// ─── SVG Icons (Inline, No Dependencies) ───────────────────────────────────
const IconGitHub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const IconLinkedIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.84 0-9.753h3.554v1.381c.43-.664 1.199-1.608 2.925-1.608 2.136 0 3.74 1.396 3.74 4.393v5.587zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.704 0-.951.77-1.704 1.963-1.704 1.192 0 1.915.753 1.94 1.704 0 .946-.748 1.704-1.988 1.704zm1.582 11.597H3.714V9.072h3.205v11.38zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const IconTwitter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
  </svg>
);

const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
  </svg>
);

const IconExternalLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setIsSubscribing(true);
    try {
      // Simulate subscription (in production, connect to backend)
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Thanks for subscribing!');
      setEmail('');
    } catch (err) {
      toast.error('Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-main">
        {/* ─── Logo & Description ──────────────────────────────────────────── */}
        <div className="footer-column footer-brand">
          <div className="footer-logo">
            <img src="/icon-dark.svg" height="24" alt="Debugra" />
            <span>Debugra</span>
          </div>
          <p className="footer-desc">
            Professional, real-time collaborative code editor for developers and CS students. Free,
            open source, forever.
          </p>
          <div className="footer-socials">
            <a
              href="https://github.com/omkhandare55/Debugra"
              title="GitHub"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconGitHub />
            </a>
            <a
              href="https://x.com"
              title="Twitter"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconTwitter />
            </a>
            <a
              href="https://linkedin.com"
              title="LinkedIn"
              className="footer-social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconLinkedIn />
            </a>
          </div>
        </div>

        {/* ─── Navigation ──────────────────────────────────────────────────── */}
        <div className="footer-column">
          <h4 className="footer-heading">Product</h4>
          <ul className="footer-links">
            <li>
              <a href="/#features">Features</a>
            </li>
            <li>
              <a href="/#languages">Languages</a>
            </li>
            <li>
              <a href="/editor">Open Editor</a>
            </li>
            <li>
              <a href="https://debugra.tech" target="_blank" rel="noopener noreferrer">
                Live Site
                <IconExternalLink />
              </a>
            </li>
          </ul>
        </div>

        {/* ─── Resources ────────────────────────────────────────────────────── */}
        <div className="footer-column">
          <h4 className="footer-heading">Resources</h4>
          <ul className="footer-links">
            <li>
              <a href="https://github.com/omkhandare55/Debugra" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href="https://github.com/omkhandare55/Debugra/issues" target="_blank" rel="noopener noreferrer">
                Report Issue
              </a>
            </li>
            <li>
              <a href="https://github.com/omkhandare55/Debugra#contributing" target="_blank" rel="noopener noreferrer">
                Contributing
              </a>
            </li>
            <li>
              <a href="https://github.com/omkhandare55/Debugra/blob/main/README.md" target="_blank" rel="noopener noreferrer">
                Documentation
              </a>
            </li>
          </ul>
        </div>

        {/* ─── Legal & Support ─────────────────────────────────────────────── */}
        <div className="footer-column">
          <h4 className="footer-heading">Support</h4>
          <ul className="footer-links">
            <li>
              <a href="https://github.com/omkhandare55/Debugra/discussions" target="_blank" rel="noopener noreferrer">
                Discussions
              </a>
            </li>
            <li>
              <a href="https://github.com/omkhandare55/Debugra/security/policy" target="_blank" rel="noopener noreferrer">
                Security
              </a>
            </li>
            <li>
              <a href="https://github.com/omkhandare55/Debugra/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
                License
              </a>
            </li>
            <li>
              <a href="https://github.com/omkhandare55/Debugra/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">
                SECURITY.md
              </a>
            </li>
          </ul>
        </div>

        {/* ─── Newsletter ───────────────────────────────────────────────────── */}
        <div className="footer-column footer-newsletter">
          <h4 className="footer-heading">Stay Updated</h4>
          <p className="footer-newsletter-subtitle">Get notified about new features and updates.</p>
          <form onSubmit={handleSubscribe} className="footer-form">
            <div className="footer-input-group">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="footer-input"
                disabled={isSubscribing}
              />
              <button type="submit" className="footer-btn-subscribe" disabled={isSubscribing}>
                {isSubscribing ? '...' : '→'}
              </button>
            </div>
          </form>
          <p className="footer-privacy-note">We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </div>

      {/* ─── Bottom Bar ───────────────────────────────────────────────────── */}
      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <p>© 2026 Debugra. Built for Hackathon SVKM.</p>
        </div>
        <div className="footer-bottom-right">
          <a href="https://github.com/omkhandare55/Debugra/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
            MIT License
          </a>
          <span className="footer-divider">·</span>
          <a href="https://github.com/omkhandare55/Debugra/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
            Contributing
          </a>
        </div>
      </div>
    </footer>
  );
}

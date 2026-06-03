import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../../services/firebase';
import toast from 'react-hot-toast';
import './LandingPage.css';
import { useTheme } from '../../context/ThemeContext';


import {
  IconBolt,
  IconWrench,
  IconBook,
  IconPlay,
  IconTest,
  IconUsers,
  IconCloud,
  IconCode,
  IconTerminal,
  FEATURES,
  LANGUAGES,
  STATS,
  FAQ_ITEMS,
  TAG_COLORS,
  REVIEWS
} from './LandingConstants';

export default function LandingPage() {
  const navigate = useNavigate();
  const featuresCarouselRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [canScrollFeaturesLeft, setCanScrollFeaturesLeft] = useState(false);
  const [canScrollFeaturesRight, setCanScrollFeaturesRight] = useState(false);

  const updateFeaturesCarouselState = () => {
    const carousel = featuresCarouselRef.current;

    if (!carousel) {
      setCanScrollFeaturesLeft(false);
      setCanScrollFeaturesRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

    setCanScrollFeaturesLeft(scrollLeft > 4);
    setCanScrollFeaturesRight(scrollLeft < maxScrollLeft - 4);
  };

  useEffect(() => {
    updateFeaturesCarouselState();

    const carousel = featuresCarouselRef.current;
    if (!carousel) return undefined;

    carousel.addEventListener('scroll', updateFeaturesCarouselState, { passive: true });
    window.addEventListener('resize', updateFeaturesCarouselState);

    return () => {
      carousel.removeEventListener('scroll', updateFeaturesCarouselState);
      window.removeEventListener('resize', updateFeaturesCarouselState);
    };
  }, []);

  // Back-to-top visibility — show after scrolling 400 px
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset confirm-password state whenever the user toggles login ↔ sign-up
  useEffect(() => {
    setConfirmPassword('');
    setShowConfirmPassword(false);
    setShowPassword(false);
  }, [isSignUp]);

  const scrollFeaturesCarousel = (direction) => {
    const carousel = featuresCarouselRef.current;
    if (!carousel) return;

    const scrollAmount = Math.max(280, Math.floor(carousel.clientWidth * 0.82));
    carousel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  const handleFeaturesKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollFeaturesCarousel(-1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollFeaturesCarousel(1);
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome!');
      navigate('/editor');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        toast.success('Account created!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      }
      navigate('/editor');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="landing-root">
      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <div className="landing-nav-left">
          <img src={theme === 'light' ? "/icon-light.svg" : "/icon-dark.svg"} height="26" alt="Debugra Logo" />
          <span className="landing-logo">Debugra</span>
          <span className="landing-version-badge">
            v1.0
          </span>
        </div>
        <div className="landing-nav-right desktop-only">
          <a href="#features" className="landing-nav-link">
            Features
          </a>
          <a href="#languages" className="landing-nav-link">
            Languages
          </a>
          <a href="#faq" className="landing-nav-link">
            FAQ
          </a>
          <button onClick={() => navigate('/feedback')} className="landing-nav-link nav-link-button">
            Feedback
          </button>
          <button onClick={() => setShowLogin(true)} className="landing-btn-outline">
            Log In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setShowLogin(true);
            }}
            className="landing-btn-primary"
          >
            Sign Up Free
          </button>
          <button
            onClick={toggleTheme}
            className="landing-btn-outline p-0 d-flex align-items-center justify-content-center"
            title="Toggle theme"
            style={{ width: '36px', height: '36px', borderRadius: '8px' }}
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
            className="landing-btn-outline p-0 d-flex align-items-center justify-content-center"
            title="Toggle theme"
            style={{ width: '36px', height: '36px', borderRadius: '8px' }}
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
          <a href="#features" className="mobile-dropdown-link" onClick={() => setMobileMenu(false)}>
            Features
          </a>
          <a
            href="#languages"
            className="mobile-dropdown-link"
            onClick={() => setMobileMenu(false)}
          >
            Languages
          </a>
          <a href="#faq" className="mobile-dropdown-link" onClick={() => setMobileMenu(false)}>
            FAQ
          </a>
          <button
            className="mobile-dropdown-link"
            onClick={() => {
              setMobileMenu(false);
              navigate('/feedback');
            }}
          >
            Feedback
          </button>
          <button
            onClick={() => {
              setShowLogin(true);
              setMobileMenu(false);
            }}
            className="mobile-dropdown-link"
          >
            Log In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setShowLogin(true);
              setMobileMenu(false);
            }}
            className="landing-btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            Sign Up Free
          </button>
        </div>
      )}

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <div className="hero-glow" />
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Live at debugra.tech · Free · No setup
          </div>

          <h1 className="hero-title">
            Write code.
            <br />
            <span className="hero-gradient-text">Break it. Fix it fast.</span>
          </h1>

          <p className="hero-subtitle">
            An in-browser IDE with Monaco editor, Wandbox execution for 18+ languages, AI error
            fixing, execution visualization, and real-time multiplayer rooms.
          </p>

          <div className="hero-cta d-flex flex-column flex-sm-row gap-3 justify-content-center">
            <button
              onClick={() => navigate('/editor')}
              className="landing-btn-primary landing-btn-lg"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginRight: '8px' }}
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Open Editor — it&apos;s free
            </button>
            <button onClick={() => setShowLogin(true)} className="landing-btn-ghost landing-btn-lg">
              Sign in to save code
            </button>
          </div>

          {/* Stats row */}
          <div className="hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== EDITOR PREVIEW ===== */}
      <section className="landing-section container">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="editor-preview">
              <div className="preview-chrome">
                <div className="preview-dot" style={{ background: '#ff5f57' }} />
                <div className="preview-dot" style={{ background: '#febc2e' }} />
                <div className="preview-dot" style={{ background: '#28c840' }} />
                <span className="preview-chrome-label">debugra.tech — main.py — Python 3</span>
              </div>
              <div className="preview-toolbar flex-wrap gap-2">
                <div className="d-flex gap-2 align-items-center">
                  <span className="preview-tag">Python 3</span>
                  <span
                    className="d-none d-sm-inline"
                    style={{ fontSize: '0.65rem', color: '#6a6a6a' }}
                  >
                    14px
                  </span>
                </div>
                <div className="d-flex gap-2 align-items-center ms-auto">
                  <span className="preview-tag d-none d-md-inline">Tests</span>
                  <span className="preview-tag">Explain</span>
                  <span
                    className="preview-tag"
                    style={{ color: '#dcdcaa', borderColor: 'rgba(220,220,170,0.3)' }}
                  >
                    Fix
                  </span>
                  <span className="preview-run-tag">▶ Run</span>
                </div>
              </div>
              <div className="row g-0 preview-body flex-column flex-md-row">
                <div className="col-12 col-md-8 preview-code">
                  <code>
                    <span className="ln">1</span>
                    <span style={{ color: '#569cd6' }}>def</span>{' '}
                    <span style={{ color: '#dcdcaa' }}>two_sum</span>
                    <span style={{ color: '#d4d4d4' }}>(nums, target):{'\n'}</span>
                    <span className="ln">2</span>
                    <span style={{ color: '#d4d4d4' }}>
                      {' '}
                      seen = {'{}'}
                      {'\n'}
                    </span>
                    <span className="ln">3</span>
                    <span style={{ color: '#569cd6' }}> for</span>{' '}
                    <span style={{ color: '#9cdcfe' }}>i, num</span>{' '}
                    <span style={{ color: '#569cd6' }}> in</span>{' '}
                    <span style={{ color: '#dcdcaa' }}> enumerate</span>
                    <span style={{ color: '#d4d4d4' }}>(nums):{'\n'}</span>
                    <span className="ln">4</span>
                    <span style={{ color: '#d4d4d4' }}> diff = target - num{'\n'}</span>
                    <span className="ln highlight-ln">5</span>
                    <span style={{ color: '#569cd6' }}> if</span>{' '}
                    <span style={{ color: '#9cdcfe' }}> diff</span>{' '}
                    <span style={{ color: '#569cd6' }}> in</span>{' '}
                    <span style={{ color: '#9cdcfe' }}> seen</span>
                    <span style={{ color: '#d4d4d4' }}>:{'\n'}</span>
                    <span className="ln highlight-ln">6</span>
                    <span style={{ color: '#d4d4d4' }}> </span>
                    <span style={{ color: '#569cd6' }}>return</span>
                    <span style={{ color: '#d4d4d4' }}> [seen[diff], i]{'\n'}</span>
                    <span className="ln">7</span>
                    <span style={{ color: '#d4d4d4' }}> seen[num] = i</span>
                  </code>
                </div>
                <div className="col-12 col-md-4 preview-output">
                  <div className="d-flex gap-1 mb-3">
                    <span className="preview-output-tab active">Output</span>
                    <span className="preview-output-tab">Errors</span>
                    <span className="preview-output-tab">AI</span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.78rem',
                      lineHeight: 1.8,
                    }}
                  >
                    <div className="preview-success-badge">✓ SUCCESS</div>
                    <div className="text-light mt-2">[0, 1]</div>
                    <div className="mt-2" style={{ color: '#6a6a6a', fontSize: '0.68rem' }}>
                      Time: 0.03s
                    </div>
                  </div>
                </div>
              </div>
              <div className="preview-statusbar">
                <div className="d-flex gap-3">
                  <span>⊞ Python</span>
                  <span className="d-none d-sm-inline">UTF-8</span>
                  <span className="d-none d-sm-inline">Ln 6, Col 1</span>
                </div>
                <div className="d-flex gap-3">
                  <span className="d-none d-sm-inline">Wandbox API</span>
                  <span style={{ color: '#8b5cf6' }}>✦ Debugra</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES BENTO GRID ===== */}
      <section id="features" className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">What&apos;s inside</p>
          <h2 className="section-title">
            Built for people who
            <br />
            <span style={{ color: 'var(--text-mid)' }}>actually write code.</span>
          </h2>
        </div>

        <div className="features-carousel-shell">
          <button
            type="button"
            className="features-carousel-nav features-carousel-nav-left"
            onClick={() => scrollFeaturesCarousel(-1)}
            disabled={!canScrollFeaturesLeft}
            aria-label="Scroll features left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            ref={featuresCarouselRef}
            className="features-carousel"
            tabIndex={0}
            role="region"
            aria-label="Feature cards carousel"
            onKeyDown={handleFeaturesKeyDown}
            onScroll={updateFeaturesCarouselState}
          >
            <div className="features-carousel-track">
              {FEATURES.map((f, i) => {
                const tagStyle = TAG_COLORS[f.tag] || {};
                return (
                  <div
                    key={i}
                    className={`feature-card ${f.size === 'large' ? 'feature-card-wide' : ''}`}
                    style={{ '--card-accent': f.accent }}
                  >
                    <div
                      className="feature-card-icon"
                      style={{ color: f.accent, background: `${f.accent}18` }}
                    >
                      {f.icon}
                    </div>
                    <div
                      className="feature-card-tag"
                      style={{ background: tagStyle.bg, color: tagStyle.color }}
                    >
                      {f.tag}
                    </div>
                    <h3 className="feature-card-title">{f.title}</h3>
                    <p className="feature-card-desc">{f.desc}</p>
                    <div className="feature-card-glow" style={{ background: f.accent }} />
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="features-carousel-nav features-carousel-nav-right"
            onClick={() => scrollFeaturesCarousel(1)}
            disabled={!canScrollFeaturesRight}
            aria-label="Scroll features right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* ===== LANGUAGES ===== */}
      <section id="languages" className="landing-section container text-center">
        <div className="section-header">
          <p className="section-eyebrow">Engine</p>
          <h2 className="section-title">
            18+ Languages.
            <br />
            <span style={{ color: 'var(--text-2)' }}>Powered by Wandbox.</span>
          </h2>
          <p className="section-subtitle">
            Permanent free API — no API key, no rate limits for learning.
          </p>
        </div>
        <div className="lang-grid">
          {LANGUAGES.map((lang) => (
            <span key={lang} className="lang-chip">
              {lang}
            </span>
          ))}
        </div>
      </section>
      {/* ===== FAQ ===== */}
      <section id="faq" className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">FAQ</p>
          <h2 className="section-title">
            Common questions,
            <br />
            <span style={{ color: 'var(--text-mid)' }}>answered in one place.</span>
          </h2>
          <p className="section-subtitle">
            Quick answers about the platform, accounts, collaboration, and privacy.
          </p>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={item.question} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-toggle" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div id={`faq-answer-${index}`} className="faq-answer" hidden={!isOpen}>
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

  {/* <div className="reviews-grid">
    {REVIEWS.map((review, index) => (
      <div key={index} className="review-card">
        <div className="review-stars">
          {'★'.repeat(review.rating)}
        </div>

        <p className="review-text">
          "{review.review}"
        </p>

        <span className="review-author">
          — {review.name}
        </span>
      </div>
    ))}
  </div> */}
  <div className="reviews-carousel">
  <div className="reviews-track">
    {[...REVIEWS, ...REVIEWS].map((review, index) => (
      <div key={index} className="review-card">
        <div className="review-stars">
          {'★'.repeat(review.rating)}
        </div>

        <p className="review-text">
          &quot;{review.review}&quot;
        </p>

        <span className="review-author">
          — {review.name}
        </span>
      </div>
    ))}
  </div>
</div>

  <div className="feedback-form-card">
    <h3 style={{ marginBottom: '16px' }}>Share Your Feedback</h3>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success('Thank you for your feedback!');
      }}
    >
      <input
        type="text"
        placeholder="Your Name"
        className="modal-input"
        required
      />

      <select className="modal-input" required>
        <option value="">Select Rating</option>
        <option value="5">★★★★★ (5)</option>
        <option value="4">★★★★☆ (4)</option>
        <option value="3">★★★☆☆ (3)</option>
        <option value="2">★★☆☆☆ (2)</option>
        <option value="1">★☆☆☆☆ (1)</option>
      </select>

      <textarea
        placeholder="Tell us about your experience..."
        className="modal-input"
        rows="4"
        required
      />

      <button
        type="submit"
        className="landing-btn-primary"
        style={{ width: 'fit-content' }}
      >
        Submit Feedback
      </button>
    </form>
  </div>
{/* </section> */}
      {/* ===== CTA ===== */}
      <section className="landing-cta-section">
        <div className="cta-glow" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <p className="section-eyebrow">Start now</p>
          <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            Your next debugging session
            <br />
            starts here.
          </h2>
          <p className="section-subtitle">No install. No signup required. Just open and write.</p>
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mt-4">
            <button
              onClick={() => navigate('/editor')}
              className="landing-btn-primary landing-btn-lg"
              style={{ boxShadow: '0 8px 40px rgba(139,92,246,0.35)' }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ marginRight: '8px' }}
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Open Editor
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setShowLogin(true);
              }}
              className="landing-btn-ghost landing-btn-lg"
            >
              Create free account
            </button>
          </div>
          <p style={{ marginTop: '20px', fontSize: '0.75rem', color: '#4a4a6a' }}>
            debugra.tech · Free · Open Source
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
<footer className="landing-footer">
  <div className="d-flex align-items-center gap-2 justify-content-center mb-1">
    <img src={theme === 'light' ? "/icon-light.svg" : "/icon-dark.svg"} height="14" alt="Debugra Logo" />
    <span className="landing-footer-logo-text">Debugra</span>
  </div>

  <p style={{ margin: 0, fontSize: '0.72rem', color: '#4a4a6a' }}>
    © {new Date().getFullYear()} Debugra · Built for Hackathon SVKM 2026 ·{" "}
    <a
      href="https://github.com/omkhandare55/Debugra"
      style={{ color: '#6a6a8a', textDecoration: 'none' }}
    >
      GitHub
    </a>
  </p>
</footer>


      {/* ===== BACK TO TOP ===== */}
      {showBackToTop && (
        <button
          className="back-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          title="Scroll back to top"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* ===== LOGIN MODAL ===== */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {/* CLOSE BUTTON - ADD HERE */}
            <button className="modal-close-btn" onClick={() => setShowLogin(false)}>
              ✕
            </button>

            <h2 className="modal-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="modal-subtitle">
              {isSignUp ? 'Sign up to save code & collaborate' : 'Sign in to access saved code'}
            </p>

            <button onClick={handleGoogle} className="google-btn">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="modal-divider">
              <div className="modal-divider-line" />
              <span>or use email</span>
              <div className="modal-divider-line" />
            </div>

            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Full Name"
                  placeholder="Full Name"
                  className="modal-input"
                  required
                />
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                placeholder="Email"
                type="email"
                className="modal-input"
                required
              />
              <div className="password-wrapper">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Password"
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  className="modal-input"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {/* Icon shows current state: EyeOff = hidden, Eye = visible (#513) */}
                  {showPassword ? (
                    <Eye size={18} strokeWidth={2} />
                  ) : (
                    <EyeOff size={18} strokeWidth={2} />
                  )}
                </button>
              </div>
              {isSignUp && (
                <div className="password-wrapper">
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="Confirm Password"
                    placeholder="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="modal-input"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <Eye size={18} strokeWidth={2} />
                    ) : (
                      <EyeOff size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
              )}
            </form>

            <p className="modal-toggle">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="modal-toggle-btn">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

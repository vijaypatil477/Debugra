import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './LandingPage.css';
import AuthModal from '../Auth/AuthModal';

export default function ContributorsPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repoStats, setRepoStats] = useState({});
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        const [contributorsRes, repoRes] = await Promise.all([
          fetch('https://api.github.com/repos/vijaypatil477/Debugra/contributors'),
          fetch('https://api.github.com/repos/vijaypatil477/Debugra'),
        ]);

        if (!contributorsRes.ok || !repoRes.ok) {
          throw new Error('Failed to fetch GitHub data');
        }

        const contributorsData = await contributorsRes.json();
        const repoData = await repoRes.json();

        if (Array.isArray(contributorsData)) {
          setContributors(contributorsData);
        }

        setRepoStats(repoData);
      } catch (error) {
        setError('Unable to load contributors right now.');
        console.error('Error fetching GitHub data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, []);

  return (
    <div className="landing-root contributors-page-root">
      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <Link to="/" className="landing-nav-left text-decoration-none">
          <img src="/icon-dark.svg" height="26" alt="Debugra Logo" />
          <span className="landing-logo">Debugra</span>
          <span
            style={{
              fontSize: '0.6rem',
              color: '#6a6a6a',
              fontFamily: 'JetBrains Mono, monospace',
              marginLeft: '4px',
              paddingBottom: '1px',
            }}
          >
            v1.0
          </span>
        </Link>
        <div className="landing-nav-right desktop-only">
          <Link to="/#features" className="landing-nav-link">
            Features
          </Link>
          <Link to="/#languages" className="landing-nav-link">
            Languages
          </Link>
          <Link to="/contributors" className="landing-nav-link">
            Contributors
          </Link>
          <a href="/#faq" className="landing-nav-link">
            FAQ
          </a>
          <button
            onClick={() => navigate('/feedback')}
            className="landing-nav-link nav-link-button"
          >
            Feedback
          </button>
          <button
            onClick={() => {
              setIsSignUp(false);
              setShowLogin(true);
            }}
            className="landing-btn-outline"
          >
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
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
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
      </nav>

      {/* ===== HERO ===== */}
      <section className="contributors-hero">
        <div className="contributors-hero-bg" />

        <div className="container text-center contributors-hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Open Source Community
          </div>

          <h1 className="hero-title">
            Built by Developers.
            <br />
            <span className="hero-gradient-text">Powered by Community.</span>
          </h1>

          <p className="hero-subtitle contributors-subtitle">
            Meet the contributors building Debugra through features, fixes, testing, UI
            improvements, documentation, and open-source collaboration.
          </p>

          <div className="contributors-stats-pro">
            <div className="contributors-stat-card">
              <div className="contributors-stat-image">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/681/681494.png"
                  alt="contributors"
                />
              </div>

              <div>
                <h3>{contributors.length}+</h3>
                <p>Contributors</p>
              </div>
            </div>

            <div className="contributors-stat-card">
              <div className="contributors-stat-image">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/2166/2166823.png"
                  alt="pull requests"
                />
              </div>

              <div>
                <h3>{repoStats.open_issues_count ?? '...'}</h3>
                <p>Open Issues & PRs</p>
              </div>
            </div>

            <div className="contributors-stat-card">
              <div className="contributors-stat-image">
                <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" alt="stars" />
              </div>

              <div>
                <h3>{repoStats.stargazers_count ?? '...'}</h3>
                <p>GitHub Stars</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTRIBUTORS ===== */}
      <section className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">Contributors</p>

          <h2 className="section-title">Meet the Builders</h2>

          <p className="section-subtitle">Real contributors fetched dynamically from GitHub API.</p>
        </div>

        {loading ? (
          <div className="contributors-loading">Loading contributors...</div>
        ) : error ? (
          <div className="contributors-loading">{error}</div>
        ) : (
          <div className="contributors-grid-pro">
            {contributors.map((contributor) => (
              <div key={contributor.id} className="contributor-card-pro">
                <div className="contributor-card-inner">
                  <img
                    src={contributor.avatar_url}
                    alt={contributor.login}
                    className="contributor-avatar-pro"
                  />

                  <h3 className="contributor-name-pro">{contributor.login}</h3>

                  <div className="contributor-contributions-pro">
                    {contributor.contributions} Contributions
                  </div>

                  <a
                    href={contributor.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="contributor-btn-pro"
                  >
                    View GitHub
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== CTA ===== */}
      <section className="contributors-cta-section">
        <div className="contributors-cta-bg" />

        <div className="contributors-cta-content">
          <p className="section-eyebrow">Join The Community</p>

          <h2 className="section-title">Want to contribute too?</h2>

          <p className="section-subtitle">
            Help improve Debugra and become part of our growing open-source community.
          </p>

          <div className="contributors-cta-buttons">
            <a
              href="https://github.com/vijaypatil477/Debugra"
              target="_blank"
              rel="noreferrer"
              className="landing-btn-primary landing-btn-lg"
            >
              Start Contributing
            </a>

            <button onClick={() => navigate('/')} className="landing-btn-ghost landing-btn-lg">
              Explore Project
            </button>
          </div>
        </div>
      </section>
      {showLogin && (
        <AuthModal
          initialMode={isSignUp ? 'signup' : 'login'}
          onClose={() => {
            setShowLogin(false);
            setIsSignUp(false);
          }}
        />
      )}
    </div>
  );
}

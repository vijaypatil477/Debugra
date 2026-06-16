import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './LandingPage.css';
import Navbar from './Navbar';
import AuthModal from '../Auth/AuthModal';

export default function ContributorsPage() {
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
      <Navbar 
        onLoginClick={() => setShowLogin(true)} 
        onSignUpClick={() => { setIsSignUp(true); setShowLogin(true); }} 
      />

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

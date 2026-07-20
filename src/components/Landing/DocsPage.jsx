import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';
import AuthModal from '../Auth/AuthModal';

const GITHUB_REPO = 'https://github.com/vijaypatil477/Debugra';

const RESOURCES = [
  {
    title: 'README.md',
    desc: 'Project overview, live demo link, tech stack, and quick-start instructions.',
    href: `${GITHUB_REPO}/blob/main/README.md`,
  },
  {
    title: 'CONTRIBUTING.md',
    desc: 'Contribution guidelines, workflow, PR process, branch naming, and code style standards.',
    href: `${GITHUB_REPO}/blob/main/CONTRIBUTING.md`,
  },
  {
    title: 'docs/architecture.md',
    desc: 'System architecture, data flow diagrams, folder structure, and Firebase schema.',
    href: `${GITHUB_REPO}/blob/main/docs/architecture.md`,
  },
  {
    title: 'docs/PRD.md',
    desc: 'Product Requirements Document covering vision, target audience, features, and tech stack.',
    href: `${GITHUB_REPO}/blob/main/docs/PRD.md`,
  },
  {
    title: 'SECURITY.md',
    desc: 'Security policy — how to responsibly disclose vulnerabilities in the project.',
    href: `${GITHUB_REPO}/blob/main/SECURITY.md`,
  },
  {
    title: 'LICENSE',
    desc: 'MIT License — Debugra is free and open-source software.',
    href: `${GITHUB_REPO}/blob/main/LICENSE`,
  },
];

const GETTING_STARTED_STEPS = [
  {
    heading: 'Fork & clone the repository',
    body: (
      <>
        Fork the repo on GitHub, then clone your fork:{' '}
        <code>git clone https://github.com/YOUR-USERNAME/Debugra.git</code>
      </>
    ),
  },
  {
    heading: 'Install frontend dependencies',
    body: (
      <>
        From the project root run <code>npm install</code>.
      </>
    ),
  },
  {
    heading: 'Install backend dependencies',
    body: (
      <>
        Navigate into the server folder and install:{' '}
        <code>cd server &amp;&amp; npm install</code>
      </>
    ),
  },
  {
    heading: 'Configure environment variables',
    body: (
      <>
        Copy <code>.env.example</code> to <code>.env</code> and fill in your Firebase
        and Groq API credentials. See CONTRIBUTING.md for the full variable list.
      </>
    ),
  },
  {
    heading: 'Run the frontend',
    body: (
      <>
        From the project root run <code>npm run dev</code>. The app starts at{' '}
        <code>http://localhost:5173</code>.
      </>
    ),
  },
  {
    heading: 'Run the backend',
    body: (
      <>
        In a separate terminal run <code>cd server &amp;&amp; npm run dev</code>. The
        server starts at <code>http://localhost:3001</code>.
      </>
    ),
  },
];

const COMMUNITY_GUIDELINES = [
  {
    heading: 'Contribution workflow',
    body: 'Create a feature branch from main, make focused changes, keep commits small and descriptive (feat:, fix:, docs:), then open a PR against main.',
  },
  {
    heading: 'Pull Request process',
    body: 'Link the related issue in your PR description (e.g. Closes #123). Ensure no merge conflicts, no console errors, and include screenshots for UI changes.',
  },
  {
    heading: 'Issue reporting',
    body: 'Search existing issues before filing a new one. Use the bug report template: describe the bug, steps to reproduce, expected vs actual behavior, and your environment.',
  },
  {
    heading: 'Coding standards',
    body: 'Use functional React components, meaningful names, and keep components modular. Follow the existing CSS design system — avoid unnecessary inline styles.',
  },
];

export default function DocsPage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="contributors-hero">
        <div className="contributors-hero-bg" />
        <div className="container text-center contributors-hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Open Source
          </div>
          <h1 className="hero-title">
            Project Documentation.
            <br />
            <span className="hero-gradient-text">Everything in one place.</span>
          </h1>
          <p className="hero-subtitle contributors-subtitle">
            Debugra is a browser-based collaborative code editor with AI-powered debugging,
            multi-language execution, and real-time multiplayer rooms. This page collects all
            project resources, setup instructions, and community guidelines for contributors.
          </p>
        </div>
      </section>

      {/* ===== PROJECT OVERVIEW ===== */}
      <section className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">Overview</p>
          <h2 className="section-title">What is Debugra?</h2>
          <p className="section-subtitle">
            An open-source, VS Code-inspired IDE that runs entirely in the browser.
          </p>
        </div>
        <div className="docs-resource-grid">
          <div className="docs-resource-card">
            <span className="docs-resource-title">Monaco Editor</span>
            <p className="docs-resource-desc">
              Built on the same engine as VS Code — syntax highlighting, bracket matching,
              auto-completion, and multiple themes out of the box.
            </p>
          </div>
          <div className="docs-resource-card">
            <span className="docs-resource-title">18+ Languages</span>
            <p className="docs-resource-desc">
              Execute Python, JavaScript, Java, C++, Go, Rust, and more via the Wandbox API
              — no local install required.
            </p>
          </div>
          <div className="docs-resource-card">
            <span className="docs-resource-title">AI Debugging</span>
            <p className="docs-resource-desc">
              Groq-powered AI explains errors in plain English, rewrites buggy code, generates
              test cases, and analyzes time complexity.
            </p>
          </div>
          <div className="docs-resource-card">
            <span className="docs-resource-title">Real-Time Collaboration</span>
            <p className="docs-resource-desc">
              Share a room link and code together with live cursor sync, team chat, and
              optional voice/video via WebRTC.
            </p>
          </div>
        </div>
      </section>

      {/* ===== RESOURCES ===== */}
      <section className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">Resources</p>
          <h2 className="section-title">Project Documentation</h2>
          <p className="section-subtitle">
            Everything you need to understand and contribute to the project.
          </p>
        </div>
        <div className="docs-resource-grid">
          {RESOURCES.map((r) => (
            <a
              key={r.title}
              href={r.href}
              target="_blank"
              rel="noreferrer"
              className="docs-resource-card"
            >
              <span className="docs-resource-title">{r.title} ↗</span>
              <p className="docs-resource-desc">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ===== GETTING STARTED ===== */}
      <section className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">Getting Started</p>
          <h2 className="section-title">Run Debugra Locally</h2>
          <p className="section-subtitle">
            Set up the project on your machine in a few steps.
          </p>
        </div>
        <div className="docs-steps">
          {GETTING_STARTED_STEPS.map((step, i) => (
            <div key={step.heading} className="docs-step">
              <span className="docs-step-num">{i + 1}</span>
              <div className="docs-step-content">
                <h4>{step.heading}</h4>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMMUNITY GUIDELINES ===== */}
      <section className="landing-section container">
        <div className="section-header">
          <p className="section-eyebrow">Community</p>
          <h2 className="section-title">Community Guidelines</h2>
          <p className="section-subtitle">
            How we work together to keep the project welcoming and high quality.
          </p>
        </div>
        <div className="docs-resource-grid">
          {COMMUNITY_GUIDELINES.map((g) => (
            <div key={g.heading} className="docs-resource-card">
              <span className="docs-resource-title">{g.heading}</span>
              <p className="docs-resource-desc">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="contributors-cta-section">
        <div className="contributors-cta-bg" />
        <div className="contributors-cta-content">
          <p className="section-eyebrow">Join The Community</p>
          <h2 className="section-title">Ready to contribute?</h2>
          <p className="section-subtitle">
            Help improve Debugra — pick an issue, fork the repo, and open a pull request.
          </p>
          <div className="contributors-cta-buttons">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="landing-btn-primary landing-btn-lg"
            >
              View on GitHub
            </a>
            <button
              onClick={() => navigate('/contributors')}
              className="landing-btn-ghost landing-btn-lg"
            >
              Meet the Contributors
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

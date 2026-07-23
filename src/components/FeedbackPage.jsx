import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const initialForm = {
  name: '',
  email: '',
  type: 'suggestion',
  rating: '5',
  message: '',
  screenshot: null,
};

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    toast.success('Thanks for helping improve Debugra!');
    setForm(initialForm);
  };

  return (
    <div className="feedback-page">
      <div className="feedback-shell">
        <div className="feedback-copy">
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <Link to="/" className="feedback-back-link" style={{ marginBottom: 0 }}>
              ← Back to home
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="feedback-theme-toggle"
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
          <p className="section-eyebrow" style={{ fontSize: '1.1rem', letterSpacing: '0.15em' }}>
            FEEDBACK
          </p>
          <h1 className="feedback-title">Tell us what Debugra should do better.</h1>
          <p className="feedback-subtitle">
            Share suggestions, report bugs, describe your experience, or send anything the team
            should know.
          </p>

          {submitted && (
            <div className="feedback-success" role="status">
              Your feedback was captured. Thank you for taking the time.
            </div>
          )}
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="feedback-field-grid">
            <label>
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                type="text"
                placeholder="Your name"
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="you@example.com"
                required
              />
            </label>
          </div>

          <div className="feedback-field-grid">
            <label>
              <span>Feedback type</span>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="suggestion">Suggestion</option>
                <option value="bug">Bug report</option>
                <option value="experience">User experience</option>
                <option value="contact">Contact request</option>
              </select>
            </label>

            <label>
              <span>Rating</span>
              <select name="rating" value={form.rating} onChange={handleChange}>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Okay</option>
                <option value="2">2 - Needs work</option>
                <option value="1">1 - Poor</option>
              </select>
            </label>
          </div>

          <label>
            <span>Message</span>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows="6"
              placeholder="Describe your feedback, issue, or suggestion..."
              required
            />
          </label>

          <label>
            <span>Screenshot</span>
            <input name="screenshot" type="file" accept="image/*" onChange={handleChange} />
          </label>

          <button type="submit" className="feedback-submit">
            Submit feedback
          </button>
        </form>
      </div>
    </div>
  );
}

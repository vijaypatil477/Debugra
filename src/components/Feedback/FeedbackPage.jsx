import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquareText, Star, Bug, LifeBuoy, Send, ArrowLeft, ShieldCheck } from 'lucide-react';
import { submitFeedback } from '../../services/api';
import './FeedbackPage.css';

const FEEDBACK_TYPES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug', label: 'Bug report' },
  { value: 'experience', label: 'Experience review' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
];

const HIGH_PRIORITY_POINTS = [
  {
    icon: <Bug size={18} />,
    title: 'Bug reports reach the team faster',
    description: 'Tell us what broke, where it happened, and how often it shows up.',
  },
  {
    icon: <MessageSquareText size={18} />,
    title: 'Suggestions stay actionable',
    description: 'Use the message box to share ideas, workflow gaps, or rough edges.',
  },
  {
    icon: <LifeBuoy size={18} />,
    title: 'Support requests are easy to route',
    description: 'A short category and rating help us sort urgent issues from general feedback.',
  },
];

export default function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const source = location.state?.source || 'website';

  const [name, setName] = useState(location.state?.name || '');
  const [email, setEmail] = useState(location.state?.email || '');
  const [category, setCategory] = useState('suggestion');
  const [rating, setRating] = useState(4);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pageContext = useMemo(() => {
    if (source === 'editor') return 'Editor menu';
    if (source === 'landing-footer') return 'Landing footer';
    return 'Website';
  }, [source]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await submitFeedback({
        name: name.trim(),
        email: email.trim(),
        category,
        rating,
        message: message.trim(),
        source: pageContext,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      });

      toast.success('Feedback sent successfully');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to send feedback right now');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="feedback-page">
      <div className="feedback-shell">
        <div className="feedback-hero">
          <section className="feedback-copy">
            <span className="feedback-kicker">
              <ShieldCheck size={14} /> Feedback Center
            </span>
            <h1 className="feedback-title">
              Tell us what is working, what is broken, and what should be better.
            </h1>
            <p className="feedback-summary">
              Debugra is built for fast iteration, so the feedback path should be just as direct.
              Use this form to share suggestions, report issues, or leave a quick review. The team
              can reach it from the landing footer and the editor menu.
            </p>

            <div className="feedback-points">
              {HIGH_PRIORITY_POINTS.map((point) => (
                <article key={point.title} className="feedback-point">
                  <div className="feedback-point-icon">{point.icon}</div>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="feedback-meta">
              <span className="feedback-pill">Accessible from footer</span>
              <span className="feedback-pill">Accessible from editor menu</span>
              <span className="feedback-pill">Optional rating included</span>
            </div>
          </section>

          <section className="feedback-card">
            <h2>Submit feedback</h2>
            <p>Use a clear subject, then give us the details that matter most.</p>

            <form className="feedback-grid" onSubmit={handleSubmit}>
              <div className="feedback-field">
                <label htmlFor="feedback-name">Name</label>
                <input
                  id="feedback-name"
                  className="feedback-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              <div className="feedback-field">
                <label htmlFor="feedback-email">Email</label>
                <input
                  id="feedback-email"
                  className="feedback-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="feedback-field">
                <label htmlFor="feedback-category">What are you sharing?</label>
                <select
                  id="feedback-category"
                  className="feedback-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {FEEDBACK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-field">
                <label>Rating</label>
                <div className="feedback-metrics" role="radiogroup" aria-label="Rating">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`feedback-star ${rating === value ? 'is-active' : ''}`}
                      onClick={() => setRating(value)}
                      aria-pressed={rating === value}
                    >
                      <Star size={14} fill="currentColor" style={{ marginRight: '4px' }} />
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="feedback-field">
                <label htmlFor="feedback-message">Message</label>
                <textarea
                  id="feedback-message"
                  className="feedback-textarea"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Describe the issue, idea, or experience in a few lines."
                  minLength={10}
                  required
                />
              </div>

              <div className="feedback-note">
                <ShieldCheck size={18} />
                <p>
                  We keep the submission path lightweight and practical. If server-side delivery is
                  not configured, the request is still logged for review.
                </p>
              </div>

              <div className="feedback-actions">
                <button className="feedback-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send feedback'} <Send size={15} style={{ marginLeft: '6px' }} />
                </button>
                <button className="feedback-back" type="button" onClick={() => navigate(-1)}>
                  <ArrowLeft size={15} style={{ marginRight: '6px' }} />
                  Go back
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

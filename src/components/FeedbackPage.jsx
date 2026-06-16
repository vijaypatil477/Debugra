import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  FileText,
  Sparkles,
  BarChart2,
} from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) {
        error = 'Name is required';
      }
    } else if (name === 'email') {
      if (!value.trim()) {
        error = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email address';
      }
    } else if (name === 'message') {
      if (!value.trim()) {
        error = 'Message is required';
      } else if (value.trim().length < 10) {
        error = 'Message must be at least 10 characters long';
      }
    }
    return error;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((current) => ({ ...current, [name]: error }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    const error = validateField(name, value);
    setErrors((current) => ({ ...current, [name]: error }));
  };

  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image screenshots are accepted (PNG, JPG, JPEG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit');
      return;
    }

    setForm((current) => ({
      ...current,
      screenshot: file,
    }));

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
    toast.success(`Selected file: ${file.name}`);
  };

  const handleRemoveFile = () => {
    setForm((current) => ({
      ...current,
      screenshot: null,
    }));
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!submitting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (submitting) return;

    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      message: validateField('message', form.message),
    };

    const hasErrors = Object.values(newErrors).some((err) => err !== '');

    if (hasErrors) {
      setErrors(newErrors);
      setTouched({ name: true, email: true, message: true });
      toast.error('Please fix the errors in the form.');
      return;
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
      toast.success('Thanks for helping improve Debugra!');
      setForm(initialForm);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setErrors({});
      setTouched({});
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

          <div className="feedback-info-section">
            <h2 className="feedback-info-title">How we process feedback</h2>
            <div className="feedback-info-steps">
              <div className="feedback-info-card">
                <div className="feedback-info-icon-wrapper">
                  <FileText size={18} />
                </div>
                <div className="feedback-info-details">
                  <span className="feedback-info-step-title">1. Triage & Review</span>
                  <p className="feedback-info-step-desc">
                    Every submission is reviewed by our engineering team to categorize it and
                    extract actionable details.
                  </p>
                </div>
              </div>

              <div className="feedback-info-card">
                <div className="feedback-info-icon-wrapper">
                  <BarChart2 size={18} />
                </div>
                <div className="feedback-info-details">
                  <span className="feedback-info-step-title">2. Prioritization</span>
                  <p className="feedback-info-step-desc">
                    Critical bugs and popular feature suggestions are prioritized and integrated
                    into our active development roadmap.
                  </p>
                </div>
              </div>

              <div className="feedback-info-card">
                <div className="feedback-info-icon-wrapper">
                  <Sparkles size={18} />
                </div>
                <div className="feedback-info-details">
                  <span className="feedback-info-step-title">3. Implementation</span>
                  <p className="feedback-info-step-desc">
                    We implement fixes and enhancements, releasing updates regularly to continuously
                    improve your experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="feedback-success-card" role="status">
            <div className="feedback-success-icon-wrapper">
              <CheckCircle size={32} />
            </div>
            <h2 className="feedback-success-title">Feedback Submitted!</h2>
            <p className="feedback-success-desc">
              Thank you for taking the time to share your thoughts. Your feedback helps make Debugra
              better for everyone.
            </p>
            <button
              type="button"
              className="feedback-success-btn"
              onClick={() => setSubmitted(false)}
            >
              Submit another response
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit} noValidate>
            <div className="feedback-field-grid">
              <label>
                <span>Name *</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="text"
                  placeholder="Your name"
                  className={errors.name ? 'invalid' : ''}
                  required
                  disabled={submitting}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <span id="name-error" className="feedback-error-message" role="alert">
                    <AlertCircle size={14} /> {errors.name}
                  </span>
                )}
              </label>

              <label>
                <span>Email *</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  type="email"
                  placeholder="you@example.com"
                  className={errors.email ? 'invalid' : ''}
                  required
                  disabled={submitting}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <span id="email-error" className="feedback-error-message" role="alert">
                    <AlertCircle size={14} /> {errors.email}
                  </span>
                )}
              </label>
            </div>

            <div className="feedback-field-grid">
              <label>
                <span>Feedback type</span>
                <select name="type" value={form.type} onChange={handleChange} disabled={submitting}>
                  <option value="suggestion">Suggestion</option>
                  <option value="bug">Bug report</option>
                  <option value="experience">User experience</option>
                  <option value="contact">Contact request</option>
                </select>
              </label>

              <label>
                <span>Rating</span>
                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Okay</option>
                  <option value="2">2 - Needs work</option>
                  <option value="1">1 - Poor</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'block', marginBottom: '14px' }}>
              <span>Message *</span>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="6"
                placeholder="Describe your feedback, issue, or suggestion..."
                className={errors.message ? 'invalid' : ''}
                required
                maxLength={1000}
                disabled={submitting}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '4px',
                }}
              >
                <div style={{ minHeight: '20px' }}>
                  {errors.message && (
                    <span id="message-error" className="feedback-error-message" role="alert">
                      <AlertCircle size={14} /> {errors.message}
                    </span>
                  )}
                </div>
                <span
                  className={`char-counter ${
                    form.message.length > 900
                      ? 'danger'
                      : form.message.length > 750
                        ? 'warning'
                        : ''
                  }`}
                  aria-live="polite"
                >
                  {form.message.length} / 1000
                </span>
              </div>
            </label>

            <label style={{ display: 'block', marginBottom: '24px' }}>
              <span style={{ display: 'block', marginBottom: '7px' }}>Screenshot</span>
              {!form.screenshot ? (
                <div
                  className={`drag-drop-zone ${isDragging ? 'dragging' : ''} ${
                    submitting ? 'disabled' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={submitting ? -1 : 0}
                  aria-label="Upload screenshot drag and drop zone"
                  onKeyDown={(e) => {
                    if ((e.key === ' ' || e.key === 'Enter') && !submitting) {
                      document.getElementById('screenshot-file-input').click();
                    }
                  }}
                >
                  <UploadCloud className="drag-drop-zone-icon" size={32} />
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drag & drop your screenshot here, or{' '}
                    <span style={{ color: 'var(--success)', textDecoration: 'underline' }}>
                      browse
                    </span>
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Supports PNG, JPG, JPEG, GIF up to 5MB
                  </p>
                  <input
                    id="screenshot-file-input"
                    name="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    style={{ display: 'none' }}
                    disabled={submitting}
                  />
                </div>
              ) : (
                <div className="screenshot-preview-card">
                  <img src={previewUrl} alt="Screenshot preview" className="screenshot-thumbnail" />
                  <div className="screenshot-details">
                    <span className="screenshot-name">{form.screenshot.name}</span>
                    <span className="screenshot-size">
                      {(form.screenshot.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="screenshot-actions">
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById('screenshot-file-input-replace').click()
                      }
                      className="feedback-theme-toggle"
                      title="Replace screenshot"
                      disabled={submitting}
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="btn-remove-screenshot"
                      title="Remove screenshot"
                      disabled={submitting}
                    >
                      <Trash2 size={16} />
                    </button>
                    <input
                      id="screenshot-file-input-replace"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      style={{ display: 'none' }}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </label>

            <button type="submit" className="feedback-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <RefreshCw className="spinner" size={16} style={{ marginRight: '8px' }} />
                  Submitting feedback...
                </>
              ) : (
                'Submit feedback'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

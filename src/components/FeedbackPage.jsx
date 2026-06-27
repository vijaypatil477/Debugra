import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = 'image/png,image/jpeg,image/gif,image/webp';

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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const charCount = form.message.length;
  const isOverLimit = charCount > MAX_MESSAGE_LENGTH;

  const previewUrl = form.screenshot
    ? typeof form.screenshot === 'string'
      ? form.screenshot
      : URL.createObjectURL(form.screenshot)
    : null;

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.message.trim()) next.message = 'Message is required';
    else if (form.message.trim().length < 10) next.message = 'Message must be at least 10 characters';
    else if (isOverLimit) next.message = `Message exceeds ${MAX_MESSAGE_LENGTH} characters`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large (max 5MB)');
        return;
      }
      setForm((current) => ({ ...current, screenshot: file }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large (max 5MB)');
        return;
      }
      setForm((current) => ({ ...current, screenshot: file }));
    }
  };

  const removeScreenshot = () => {
    setForm((current) => ({ ...current, screenshot: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
      toast.success('Thanks for helping improve Debugra!');
      setForm(initialForm);
      setErrors({});
      event.currentTarget.reset();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (name) =>
    `feedback-input ${errors[name] ? 'feedback-input--error' : ''}`;

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
            <button
              type="button"
              onClick={toggleTheme}
              className="feedback-theme-toggle"
              title="Toggle theme"
              aria-label="Toggle dark/light mode"
            >
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

          <div className="feedback-info-panel" role="note">
            <h3>How your feedback is reviewed</h3>
            <ul>
              <li>Each submission is read by the maintainers</li>
              <li>Screenshots help us reproduce issues faster</li>
              <li>You may receive a follow-up via email if needed</li>
              <li>Reported bugs are tracked via GitHub Issues</li>
            </ul>
          </div>

          {submitted && (
            <div className="feedback-success" role="status">
              Your feedback was captured. Thank you for taking the time.
            </div>
          )}
        </div>

        <form className="feedback-form" onSubmit={handleSubmit} noValidate>
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
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={inputClass('name')}
              />
              {errors.name && (
                <span id="name-error" className="feedback-error-msg" role="alert">{errors.name}</span>
              )}
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
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={inputClass('email')}
              />
              {errors.email && (
                <span id="email-error" className="feedback-error-msg" role="alert">{errors.email}</span>
              )}
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
              aria-required="true"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-error' : 'message-count'}
              className={`feedback-textarea ${errors.message ? 'feedback-input--error' : ''}`}
              maxLength={MAX_MESSAGE_LENGTH + 100}
            />
            <div className="feedback-char-count" id="message-count" aria-live="polite">
              <span className={isOverLimit ? 'feedback-char-over' : ''}>
                {charCount}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            {errors.message && (
              <span id="message-error" className="feedback-error-msg" role="alert">{errors.message}</span>
            )}
          </label>

          <label>
            <span>Screenshot (optional)</span>
            <div
              className={`feedback-dropzone ${dragOver ? 'feedback-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              role="button"
              tabIndex={0}
              aria-label="Upload screenshot area"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Drag & drop a screenshot here, or click to browse</span>
              <span className="feedback-dropzone-hint">PNG, JPG, GIF, WebP &mdash; max 5MB</span>
            </div>
            <input
              ref={fileInputRef}
              name="screenshot"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>

          {form.screenshot && (
            <div className="feedback-preview" role="group" aria-label="Screenshot preview">
              <img src={previewUrl} alt="Uploaded screenshot preview" className="feedback-preview-img" />
              <div className="feedback-preview-actions">
                <span className="feedback-preview-name">{form.screenshot.name}</span>
                <button
                  type="button"
                  className="feedback-preview-remove"
                  onClick={removeScreenshot}
                  aria-label="Remove screenshot"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="feedback-submit"
            disabled={submitting || isOverLimit}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', marginRight: '6px' }} />
                Submitting...
              </>
            ) : (
              'Submit feedback'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

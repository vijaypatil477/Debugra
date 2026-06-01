import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    event.currentTarget.reset();
  };

  return (
    <div className="feedback-page">
      <div className="feedback-shell">
        <div className="feedback-copy">
          <Link to="/" className="feedback-back-link">
            Back to home
          </Link>
          <p className="section-eyebrow">Feedback</p>
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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - replace with real backend integration
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', category: '', subject: '', message: '' });

      setTimeout(() => setSubmitted(false), 6000);
    }, 1800);
  };

  const categories = [
    'Bug Report',
    'Feature Request',
    'Technical Support',
    'General Feedback',
    'Collaboration Inquiry',
    'Documentation Issue',
    'Performance Issue',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#cccccc] font-sans">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1e1e1e] via-[#181818] to-[#0f0f0f] border-b border-[#333333] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#569cd6_0.8px,transparent_1px)] [background-size:30px_30px] opacity-10"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="text-7xl mb-6"
          >
            ✉️
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-6">
            Get in Touch with Us
          </h1>
          <p className="text-xl text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed">
            Your feedback helps us build a better debugging experience. Reach out anytime — we're
            here to listen and improve.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-16">
          {/* Left Sidebar - Information */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2 space-y-12"
          >
            <div>
              <h2 className="text-3xl font-semibold text-white mb-6">How Can We Help?</h2>
              <p className="text-[#a1a1aa] text-lg leading-relaxed">
                Whether you're reporting a bug, suggesting a new feature, or need assistance, our
                team is ready to support you. Expect a response within 24–48 business hours.
              </p>
            </div>

            {/* Support Channels */}
            <div>
              <h3 className="text-white font-medium mb-5 flex items-center gap-2">
                <span>🚀</span> Other Ways to Reach Us
              </h3>
              <div className="space-y-4">
                <a
                  href="https://github.com/omkhandare55/Debugra/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 group p-4 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] rounded-2xl transition-all"
                >
                  <div className="text-2xl">🐙</div>
                  <div>
                    <p className="text-white group-hover:text-[#569cd6]">GitHub Issues</p>
                    <p className="text-sm text-[#666]">Best for bug reports and feature requests</p>
                  </div>
                </a>

                <Link
                  to="/docs"
                  className="flex items-center gap-4 group p-4 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] rounded-2xl transition-all"
                >
                  <div className="text-2xl">📖</div>
                  <div>
                    <p className="text-white group-hover:text-[#569cd6]">Documentation</p>
                    <p className="text-sm text-[#666]">Browse guides and troubleshooting</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Response Info */}
            <div className="bg-[#1e1e1e] border border-[#333] rounded-3xl p-8">
              <h4 className="font-medium text-white mb-4">📬 Expected Response Time</h4>
              <ul className="space-y-3 text-sm text-[#a1a1aa]">
                <li className="flex justify-between">
                  <span>General Inquiries</span>
                  <span className="text-emerald-400">1–2 days</span>
                </li>
                <li className="flex justify-between">
                  <span>Bug Reports</span>
                  <span className="text-emerald-400">1 day</span>
                </li>
                <li className="flex justify-between">
                  <span>Urgent Issues</span>
                  <span className="text-amber-400">Within 12 hours</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="bg-[#1e1e1e] border border-[#333333] rounded-3xl p-8 md:p-12">
              <h2 className="text-3xl font-semibold text-white mb-2">Send Your Message</h2>
              <p className="text-[#888] mb-10">
                Fields marked with <span className="text-red-400">*</span> are required
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-5xl mb-6">
                    🎉
                  </div>
                  <h3 className="text-2xl font-medium text-white mb-3">Message Received!</h3>
                  <p className="text-[#a1a1aa] max-w-sm mx-auto">
                    Thank you for reaching out. Our team will review your message and respond as
                    soon as possible.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-[#a1a1aa] mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-6 py-3.5 text-white focus:outline-none focus:border-[#569cd6] transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#a1a1aa] mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-6 py-3.5 text-white focus:outline-none focus:border-[#569cd6] transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-6 py-3.5 text-white focus:outline-none focus:border-[#569cd6] transition-all"
                    >
                      <option value="">Select an issue type</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-2xl px-6 py-3.5 text-white focus:outline-none focus:border-[#569cd6] transition-all"
                      placeholder="Brief title of your inquiry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#a1a1aa] mb-2">
                      Your Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={8}
                      className="w-full bg-[#0f0f0f] border border-[#333] rounded-3xl px-6 py-4 text-white focus:outline-none focus:border-[#569cd6] transition-all resize-y min-h-[180px]"
                      placeholder="Please describe your feedback, issue, or suggestion in detail..."
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 bg-[#569cd6] hover:bg-[#4a8ac4] disabled:bg-[#334455] text-white font-semibold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#569cd6]/30"
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </motion.button>

                  <p className="text-center text-xs text-[#555] pt-4">
                    Your information is safe with us. We respect your privacy.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="border-t border-[#222] py-16 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#777] mb-6">You can also open an issue directly on our repository</p>
          <a
            href="https://github.com/omkhandare55/Debugra/issues/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-[#1e1e1e] hover:bg-white hover:text-black border border-[#333] px-8 py-4 rounded-2xl font-medium transition-all"
          >
            Open GitHub Issue →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;

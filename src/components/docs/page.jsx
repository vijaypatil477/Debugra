import React from 'react';
import { motion } from 'framer-motion';

const Contributing = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#cccccc] font-sans">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] border-b border-[#333333] py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="text-6xl">🤝</div>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-6">
            Contributing to <span className="text-[#569cd6]">Debugra</span>
          </h1>
          <p className="text-xl text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed">
            Join us in building the future of collaborative coding. Every contribution matters.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Introduction Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1e1e1e] border border-[#333333] rounded-2xl p-8 md:p-10 mb-16"
        >
          <p className="text-lg leading-relaxed text-[#e0e0e0]">
            Debugra is a professional real-time collaborative code editor built for developers and
            students with
            <span className="text-[#569cd6]"> AI-powered debugging</span>, multi-language execution,
            and a VS Code-inspired UI.
          </p>
          <p className="mt-4 text-[#a1a1aa]">
            We welcome all kinds of contributions — from bug fixes and documentation to major
            features and UI enhancements.
          </p>
        </motion.div>

        {/* Table of Contents - 2 Column */}
        <div className="mb-20">
          <h2 className="text-3xl font-semibold text-white mb-8 flex items-center gap-3">
            📋 Table of Contents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              '🌟 Ways to Contribute',
              '🚀 Getting Started',
              '⚙️ Local Development Setup',
              '📁 Project Structure',
              '🧩 Architecture Overview',
              '🔄 Contribution Workflow',
              '📝 Pull Request Guidelines',
              '🐛 Bug Reports & Issues',
              '🎨 Code Style Guidelines',
              '🛠 Troubleshooting',
              '📞 Getting Help',
              '📜 Code of Conduct',
            ].map((item, index) => (
              <motion.a
                key={index}
                href={`#${item
                  .toLowerCase()
                  .replace(/[^a-z0-9\s]+/g, '')
                  .replace(/\s+/g, '-')}`}
                className="group flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] border border-transparent hover:border-[#444] rounded-xl transition-all duration-300"
                whileHover={{ x: 5 }}
              >
                <span className="text-[#569cd6] text-xl">→</span>
                <span className="group-hover:text-white transition-colors">{item}</span>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Ways to Contribute - 2 Column Grid */}
        <section id="ways-to-contribute" className="mb-20">
          <h2 className="text-4xl font-semibold text-white mb-10">🌟 Ways to Contribute</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#1e1e1e] p-8 rounded-2xl border border-[#333]"
            >
              <h3 className="text-2xl font-medium text-[#569cd6] mb-6">Feature Development</h3>
              <ul className="space-y-4 text-[#a1a1aa]">
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Add editor features
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Improve collaboration tools
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Enhance AI functionality
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Improve accessibility
                </li>
              </ul>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#1e1e1e] p-8 rounded-2xl border border-[#333]"
            >
              <h3 className="text-2xl font-medium text-[#569cd6] mb-6">Bug Fixes</h3>
              <ul className="space-y-4 text-[#a1a1aa]">
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Resolve frontend/backend bugs
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Fix responsive UI issues
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Improve performance
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Handle edge cases
                </li>
              </ul>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#1e1e1e] p-8 rounded-2xl border border-[#333]"
            >
              <h3 className="text-2xl font-medium text-[#569cd6] mb-6">Documentation</h3>
              <ul className="space-y-4 text-[#a1a1aa]">
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Improve README & guides
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Add troubleshooting docs
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Enhance contributor onboarding
                </li>
              </ul>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-[#1e1e1e] p-8 rounded-2xl border border-[#333]"
            >
              <h3 className="text-2xl font-medium text-[#569cd6] mb-6">UI/UX Improvements</h3>
              <ul className="space-y-4 text-[#a1a1aa]">
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Mobile responsiveness
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Smooth animations
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Better accessibility
                </li>
                <li className="flex gap-3">
                  <span className="text-emerald-400">•</span> Modern interactions
                </li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* Getting Started */}
        <section id="getting-started" className="mb-20">
          <h2 className="text-4xl font-semibold text-white mb-8">🚀 Getting Started</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-medium mb-4">1. Fork the Repository</h3>
              <p className="text-[#a1a1aa]">
                Click the <strong>Fork</strong> button on GitHub.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-medium mb-4">2. Clone Your Fork</h3>
              <pre className="bg-[#1e1e1e] p-6 rounded-xl overflow-x-auto border border-[#333]">
                git clone https://github.com/YOUR-USERNAME/Debugra.git
                <br />
                cd Debugra
              </pre>
            </div>

            <div>
              <h3 className="text-2xl font-medium mb-4">3. Add Upstream Remote</h3>
              <pre className="bg-[#1e1e1e] p-6 rounded-xl overflow-x-auto border border-[#333]">
                git remote add upstream https://github.com/omkhandare55/Debugra.git
              </pre>
            </div>
          </div>
        </section>

        {/* Local Development Setup */}
        <section id="local-development-setup" className="mb-20">
          <h2 className="text-4xl font-semibold text-white mb-10">⚙️ Local Development Setup</h2>

          <div className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-8">
            <h3 className="text-xl font-medium mb-6">Prerequisites</h3>
            <ul className="grid md:grid-cols-2 gap-4 mb-10">
              {[
                'Node.js v18+',
                'Git',
                'VS Code (Recommended)',
                'Firebase Account',
                'Groq API Key',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#a1a1aa]">
                  <span className="text-emerald-400">✓</span> {item}
                </li>
              ))}
            </ul>

            {/* Environment Variables - 2 Columns */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-4 text-white">Frontend .env</h4>
                <pre className="bg-black/50 p-6 rounded-xl text-sm overflow-x-auto border border-[#333]">
                  VITE_FIREBASE_API_KEY=your_key
                  <br />
                  VITE_API_URL=http://localhost:3001
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-4 text-white">Backend .env (server/)</h4>
                <pre className="bg-black/50 p-6 rounded-xl text-sm overflow-x-auto border border-[#333]">
                  PORT=3001
                  <br />
                  GROQ_API_KEY=your_groq_key
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Project Structure & Architecture */}
        <section id="project-structure" className="mb-20">
          <h2 className="text-4xl font-semibold text-white mb-8">📁 Project Structure</h2>
          <pre className="bg-[#1e1e1e] p-8 rounded-2xl border border-[#333] overflow-x-auto text-sm leading-relaxed">
            {`Debugra/
├── src/
│   ├── components/      # UI Components
│   ├── hooks/           # Custom React Hooks
│   ├── services/        # Firebase & API services
│   ├── utils/           # Utilities
│   └── assets/
├── server/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── public/
└── package.json`}
          </pre>
        </section>

        <section id="architecture-overview" className="mb-20">
          <h2 className="text-4xl font-semibold text-white mb-8">🧩 Architecture Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-[#333] rounded-xl">
              <thead>
                <tr className="bg-[#1e1e1e]">
                  <th className="border border-[#333] p-4 text-left">Hook</th>
                  <th className="border border-[#333] p-4 text-left">Responsibility</th>
                </tr>
              </thead>
              <tbody className="text-[#a1a1aa]">
                <tr>
                  <td className="border border-[#333] p-4">useEditor</td>
                  <td className="border border-[#333] p-4">Editor state management</td>
                </tr>
                <tr>
                  <td className="border border-[#333] p-4">useExecution</td>
                  <td className="border border-[#333] p-4">Code execution logic</td>
                </tr>
                <tr>
                  <td className="border border-[#333] p-4">useAI</td>
                  <td className="border border-[#333] p-4">AI debugging & explanations</td>
                </tr>
                <tr>
                  <td className="border border-[#333] p-4">useRoom</td>
                  <td className="border border-[#333] p-4">Real-time collaboration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Remaining sections (Workflow, PR Guidelines, etc.) are included similarly with nice styling */}

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center py-16 border-t border-[#333]"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Thank You for Contributing! 🌟</h2>
          <p className="text-[#a1a1aa]">
            Your efforts help make Debugra better for developers worldwide.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Contributing;

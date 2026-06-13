# 🤝 Contributing to Debugra

Thank you for your interest in contributing to **Debugra**! ✦

Debugra is a professional real-time collaborative code editor built for developers and students with AI-powered debugging, multi-language execution, and a VS Code-inspired UI.

We welcome all kinds of contributions — from bug fixes and documentation improvements to UI enhancements and new features.

---

# 📋 Table of Contents

* [🌟 Ways to Contribute](#-ways-to-contribute)
* [🚀 Getting Started](#-getting-started)
* [⚙️ Local Development Setup](#️-local-development-setup)
* [📁 Project Structure](#-project-structure)
* [🧩 Architecture Overview](#-architecture-overview)
* [🔄 Contribution Workflow](#-contribution-workflow)
* [📝 Pull Request Guidelines](#-pull-request-guidelines)
* [🐛 Bug Reports & Issues](#-bug-reports--issues)
* [🎨 Code Style Guidelines](#-code-style-guidelines)
* [🛠 Troubleshooting](#-troubleshooting)
* [📞 Getting Help](#-getting-help)
* [📜 Code of Conduct](#-code-of-conduct)

---

# 🌟 Ways to Contribute

## A. Feature Development

* Add editor features
* Improve collaboration tools
* Enhance AI functionality
* Improve accessibility

## B. Bug Fixes

* Resolve frontend/backend bugs
* Fix responsive UI issues
* Improve performance
* Handle edge cases

## C. Documentation

* Improve README
* Enhance setup guides
* Add troubleshooting docs
* Improve contributor onboarding

## D. UI/UX Improvements

* Improve mobile responsiveness
* Enhance UI interactions
* Improve accessibility
* Add smooth animations/transitions

---

# 🚀 Getting Started

## 1. Fork the Repository

Click the **Fork** button on GitHub to create your own copy of the repository.

---

## 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/Debugra.git

cd Debugra
```

---

## 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/omkhandare55/Debugra.git
```

This helps you sync your fork with the main repository.

---

## 4. Create a New Branch

Always create a separate branch before making changes.

### Branch Naming Convention

```bash
feature/feature-name

fix/bug-description

docs/documentation-update

refactor/component-cleanup
```

### Example

```bash
git checkout -b docs/improve-contributing-guide
```

---

# ⚙️ Local Development Setup

## 📌 Prerequisites

Make sure you have installed:

* Node.js v18+
* Git
* VS Code (Recommended)
* Firebase Account
* Groq API Key

---

## 1. Install Frontend Dependencies

```bash
npm install
```

---

## 2. Install Backend Dependencies

```bash
cd server

npm install

cd ..
```

---

## 3. Configure Environment Variables

### Frontend `.env`

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_API_URL=http://localhost:3001
```

---

### Backend `.env`

Create a `.env` file inside `server/`

```env
PORT=3001

CLIENT_URL=http://localhost:5173

GROQ_API_KEY=your_groq_api_key
```

---

## 🔥 Firebase Setup

### Enable Authentication

1. Open Firebase Console
2. Create a Firebase Project
3. Go to Authentication
4. Enable:

   * Google Authentication
   * Email/Password Authentication

---

### Enable Firestore Database

1. Open Firestore Database
2. Create Database
3. Start in test mode

---

## 🤖 Groq API Setup

1. Visit:
   https://console.groq.com

2. Generate an API key

3. Add it to:

```env
GROQ_API_KEY=your_key
```

---

## ▶️ Run the Project Locally

### Start Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

### Start Backend

Open another terminal:

```bash
cd server

npm run dev
```

Backend runs on:

```bash
http://localhost:3001
```

---

# 📁 Project Structure

```bash
Debugra/
│
├── src/
│   ├── components/       # UI Components
│   ├── hooks/            # Custom React Hooks
│   ├── services/         # API & Firebase services
│   ├── utils/            # Utility/helper functions
│   ├── config/           # Global constants/configs
│   └── assets/           # Static assets
│
├── server/
│   ├── routes/           # Express routes
│   ├── middleware/       # Backend middleware
│   ├── services/         # Backend services
│   └── server.js         # Backend entry point
│
├── public/
├── package.json
└── vite.config.js
```

---

# 🧩 Architecture Overview

Debugra follows an industry-level architecture where business logic is separated from UI using custom hooks.

## Important Hooks

| Hook           | Responsibility              |
| -------------- | --------------------------- |
| `useEditor`    | Editor state management     |
| `useExecution` | Code execution logic        |
| `useAI`        | AI debugging & explanations |
| `useRoom`      | Real-time collaboration     |
| `useIsMobile`  | Mobile responsiveness       |

---

# 🔄 Contribution Workflow

## 1. Keep Your Fork Updated

```bash
git fetch upstream

git checkout main

git merge upstream/main
```

---

## 2. Make Your Changes

* Follow the project structure
* Keep code clean and readable
* Avoid unrelated changes
* Follow existing design patterns

---

## 3. Test Your Changes

Before submitting:

* Test frontend functionality
* Test backend APIs
* Check responsiveness
* Ensure no console errors

---

## 4. Commit Changes

### Commit Convention

```bash
feat: add AI response copy button

fix: resolve mobile navbar overlap

docs: improve contributing documentation

refactor: optimize editor hook
```

### Example

```bash
git commit -m "docs: improve setup documentation"
```

---

## 5. Push Changes

```bash
git push origin your-branch-name
```

---

## 6. Create Pull Request

After pushing:

1. Open your fork on GitHub
2. Click **Compare & Pull Request**
3. Add proper title & description
4. Link the related issue

Example:

```bash
Closes #500
```

---

# 📝 Pull Request Guidelines

Before submitting your PR:

* [ ] Code works properly
* [ ] No merge conflicts
* [ ] Documentation updated if needed
* [ ] UI changes include screenshots
* [ ] PR focuses on one issue only

---

## PR Title Examples

```bash
feat: add contributors page

fix: resolve editor mobile overflow

docs: improve local setup guide
```

---

# 🐛 Bug Reports & Issues

## Before Creating an Issue

* Search existing issues first
* Verify the bug still exists
* Check the latest branch/version

---

## Bug Report Template

```md
## Bug Description
Explain the issue clearly

## Steps To Reproduce
1. Go to ...
2. Click ...
3. Observe ...

## Expected Behavior
What should happen

## Screenshots
Add screenshots if applicable

## Environment
- Browser:
- OS:
- Device:
```

---

# 🎨 Code Style Guidelines

## React & JavaScript

* Use functional components
* Use `const` and `let`
* Avoid unnecessary re-renders
* Keep components modular
* Use meaningful naming

---

## CSS

* Keep styling responsive
* Use consistent spacing
* Follow existing design system
* Avoid unnecessary inline styles

---

## File Naming

| Type       | Convention                  |
| ---------- | --------------------------- |
| Components | PascalCase                  |
| Hooks      | camelCase with `use` prefix |
| Utilities  | camelCase                   |
| CSS Files  | ComponentName.css           |

---

# 🛠 Troubleshooting

## npm install errors

```bash
npm cache clean --force

npm install
```

---

## Port Already In Use

```bash
npx kill-port 5173
```

or

```bash
npx kill-port 3001
```

---

## Firebase Errors

Check:

* Firebase config values
* Firestore enabled
* Authentication enabled

---

## Backend Not Connecting

Make sure:

* Backend server is running
* `VITE_API_URL` is correct
* Port `3001` is available

---

## Vite Build Errors

```bash
rm -rf node_modules

npm install
```

---

# 📞 Getting Help

If you need help:

* Ask in issue comments
* Reach out to maintainers
* Request clarification politely

We are happy to help beginner contributors ✦

---

# 📜 Code of Conduct

Please maintain respectful and inclusive behavior in all interactions.

We aim to create a welcoming environment for everyone regardless of experience level.

---

# 🌟 Thank You for Contributing to Debugra! 🌟

Your contributions help improve the project and support developers around the world 🚀

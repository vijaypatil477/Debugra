# Debugra

[![Live](https://img.shields.io/badge/Live-debugra.tech-8b5cf6?style=flat-square&logo=vercel&logoColor=white)](https://debugra.tech)
[![GitHub](https://img.shields.io/badge/GitHub-omkhandare55%2FDebugra-181717?style=flat-square&logo=github)](https://github.com/omkhandare55/Debugra)
[![Backend](https://img.shields.io/badge/Backend-Cloud%20Run-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Accessibility](https://img.shields.io/badge/Accessibility-100%2F100-success?style=flat-square&logo=lighthouse)](https://debugra.tech)

> **Live at → [https://debugra.tech](https://debugra.tech)**

A professional, real-time collaborative code editor for developers and CS students. Built with a VS Code-inspired UI, AI-powered debugging, multi-language code execution, and an industry-level component architecture.

---

## Features

- **VS Code-Like UI** — Professional dark-mode interface with status bar, tab bar, and keyboard shortcuts (`Ctrl+Enter` to run)
- **Multi-Language Execution** — Run 18+ languages (Python, Java, C++, JavaScript, Go, Rust, SQLite and more) powered by the Wandbox API — permanently free
- **Monaco Editor** — Syntax highlighting, autocomplete, bracket matching, snippets, and code formatting
- **AI Time-Travel Debugger** — Step-by-step execution visualization, error explanations, logic breakdown, and test case generation
- **AI Fix with "Apply Solution"** — Click "Fix" to generate an AI solution, review it in the AI panel, and apply it to the editor with a single click
- **Encrypted Personal Groq Keys** — Optional user-provided Groq keys are encrypted locally with AES-GCM and unlocked only for the current browser session
- **Real-Time Collaboration** — Create rooms, share a Room ID, and code together with live Firebase sync
- **Persistent Rooms & Easy Exit** — Auto-rejoin rooms on page refresh, and easily leave a room with the "Exit Room" button
- **Access Control & Presence** — Author-managed edit permissions with request/approve/deny/revoke flow, displaying real user names
- **Live User Tracking** — Clickable status bar showing all connected members with a dropdown list
- **Team Chat** — In-editor real-time messaging for collaborators
- **Saved Code History** — Authenticated users can save code with custom file names to Firestore and reload it anytime
- **User Input (stdin)** — Auto-detects input functions and syncs stdin across all room members
- **Clean & Aesthetic UI** — Minimalist design system using geometric symbols (`✦`, `⟡`) and language badges (`PY`, `JS`, `C++`) instead of generic emojis
- **100/100 Accessibility** — Perfect Lighthouse A11y score with ARIA labels, semantic HTML, and high-contrast visuals
- **Smart Branding** — High-resolution SVG logos and a smart favicon that automatically adapts to the user's OS-level dark/light mode preferences
- **Mobile Responsive** — Bootstrap-powered responsive layout with a dedicated mobile bottom navigation bar
- **SQLite (SQL)** — SQL execution uses SQLite 3.46.1 via Wandbox — no `CREATE DATABASE` needed

---

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Frontend        | React 18, Vite, Monaco Editor                     |
| Styling         | Vanilla CSS + Bootstrap 5 (dark VS Code theme)    |
| Auth & Database | Firebase Auth, Cloud Firestore                    |
| Code Execution  | Wandbox API (free, serverless)                    |
| AI Features     | Groq SDK — `llama-3.3-70b-versatile` + node-cache |
| Backend         | Express.js (Node.js) with Rate Limiting & Helmet  |
| Icons           | Bootstrap Icons                                   |

---

## Architecture

Debugra follows an **industry-level** component architecture — business logic is fully decoupled from UI through custom React hooks.

### Custom Hooks (`src/hooks/`)

| Hook           | Responsibility                                            |
| -------------- | --------------------------------------------------------- |
| `useEditor`    | Code, language, font size, stdin, save to cloud, download |
| `useExecution` | Run code via Wandbox, stdout/stderr, execution timing     |
| `useAI`        | Fix, Explain, Visualize, Generate Tests via Groq          |
| `useRoom`      | Firebase room sync, create/join, access control, presence |
| `useIsMobile`  | Reactive viewport detection for responsive layout         |

### Project Structure

```
debugra/
├── src/
│   ├── config/
│   │   └── constants.js          # All app-wide constants (breakpoints, defaults, enums)
│   ├── hooks/
│   │   ├── index.js              # Barrel export for all hooks
│   │   ├── useEditor.js          # Local editor state
│   │   ├── useExecution.js       # Code execution logic
│   │   ├── useAI.js              # Groq AI features
│   │   ├── useRoom.js            # Firebase room & collaboration
│   │   └── useIsMobile.js        # Responsive viewport hook
│   ├── components/
│   │   ├── Auth/                 # Login/Signup modal
│   │   ├── Chat/                 # Team chat panel
│   │   ├── Editor/
│   │   │   ├── EditorPage.jsx            # Orchestrator (~250 lines)
│   │   │   ├── AIResponsePanel.jsx       # AI output renderer
│   │   │   ├── CollaborationControls.jsx # Room access control UI
│   │   │   ├── EditorStatusBar.jsx       # VS Code-style status bar
│   │   │   ├── MobileBottomNav.jsx       # Mobile tab navigation
│   │   │   └── HistoryPanel.jsx          # Saved code history sidebar
│   │   ├── Landing/              # Landing page
│   │   ├── Output/               # Visualization panel
│   │   └── Problem/              # Problem description panel
│   ├── services/
│   │   ├── api.js                # Axios instance with interceptors + all API calls
│   │   └── firebase.js           # Firebase config
│   ├── utils/
│   │   ├── languageConfig.js     # Language templates and Monaco mappings
│   │   └── snippetsConfig.js     # Monaco code snippet definitions
│   ├── App.jsx
│   └── index.css                 # Global design system tokens + responsive styles
├── server/                       # Backend (Express.js)
│   ├── routes/
│   │   ├── execute.js            # /api/execute — Wandbox code execution
│   │   └── ai.js                 # /api/ai/* — Groq AI endpoints
│   ├── services/
│   │   └── judge0Service.js      # Wandbox API wrapper
│   ├── middleware/
│   │   └── errorHandler.js
│   └── server.js
├── index.html
├── package.json
└── vite.config.js
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repo

```bash
git clone https://github.com/omkhandare55/Debugra.git
cd Debugra
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Firebase Configuration

Debugra uses Firebase for authentication and real-time collaboration data. You need a Firebase project to run the app locally.

**Step 1 — Create a Firebase project**

1. Go to the [Firebase Console](https://console.firebase.google.com) and click **Create a project** (or select an existing one).
2. Disable Google Analytics (or enable — optional, not used by Debugra).
3. Once created, click **Authentication** in the left sidebar → **Get started** → enable at least **Email/Password** (and optionally **Google**).
4. Click **Firestore Database** → **Create database** → choose a location → **Start in test mode** (you can lock it down later).

**Step 2 — Get your Firebase config**

1. In the Firebase Console, click **Project Overview** → **Project Settings** (gear icon) → **General**.
2. Under **Your apps**, click the **Web** icon (`</>`).
3. Register the app (nickname: `Debugra`) → copy the `firebaseConfig` values shown.
4. Open `.env.example` from the project root, copy its contents to a new `.env` file, and fill in the six `VITE_FIREBASE_*` values from the snippet.

The frontend `.env` should look like this after setup:

```env
VITE_FIREBASE_API_KEY=AIzaSyD-...
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project
VITE_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_URL=http://localhost:3001
```

> 💡 The `firebaseConfig` snippet from Firebase Console already uses these exact variable names — you can paste it straight in.

**Step 3 — Add localhost as an authorized domain (optional but recommended)**

1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
2. Click **Add domain** → enter `localhost`.

This prevents sign-in errors during local development.

### 4. Configure environment variables

**Frontend** — if you haven't already, create `.env` in root following the guide above, or paste this template:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```
> ⚠️ **`VITE_API_URL` is required.** If not set, the app falls back to
> `http://localhost:3001` in development and logs a browser console warning.
> Code execution and AI features will fail if the backend is unreachable.

**Backend** — create `.env` in `server/`:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSP_REPORT_URI=/api/security/csp-report
GROQ_API_KEY=your_groq_api_key
DEBUGRA_ADMIN_TOKEN=choose_a_long_random_admin_token
```

`CORS_ORIGINS` accepts a comma-separated list of trusted frontend origins. `CSP_REPORT_URI` enables browser CSP violation reports through `/api/security/csp-report`.
`DEBUGRA_ADMIN_TOKEN` is required for `/api/admin/memory-profile` diagnostic endpoints. Send it as either `Authorization: Bearer <token>` or `x-admin-token: <token>`.

### 5. Start development servers

#### Option A: Using NPM

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd server
npm run dev
```

#### Option B: Using Docker (Recommended for quick setup)

Make sure Docker Desktop is running, then use Docker Compose to spin up both the frontend and backend with hot-reloading:

```bash
docker-compose up --build
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

---

## Deployment

### Frontend — Vercel + Custom Domain

1. Push code to GitHub.
2. Import the repository at [vercel.com](https://vercel.com) — Vite is auto-detected.
3. Add all `VITE_*` environment variables in the Vercel dashboard.
4. Set `VITE_API_URL` to your Cloud Run backend URL.
5. Click **Deploy**.
6. Go to **Settings → Domains** → add `debugra.tech` and `www.debugra.tech`.
7. Add these DNS records at your domain registrar:

| Type    | Name  | Value                |
| ------- | ----- | -------------------- |
| `A`     | `@`   | `76.76.21.21`        |
| `CNAME` | `www` | `cns.vercel-dns.com` |

> Vercel automatically provisions a free SSL certificate once DNS propagates (5 min – 48 hrs).

> **Firebase** → Authentication → Settings → Authorized Domains → add `debugra.tech` and `www.debugra.tech` to prevent sign-in errors on the live domain.

### Backend — Google Cloud Run

```bash
cd server

gcloud run deploy debugra-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GROQ_API_KEY=your_key,CLIENT_URL=https://your-app.vercel.app,CORS_ORIGINS=https://your-app.vercel.app,CSP_REPORT_URI=/api/security/csp-report"
```

After deploying, update your frontend `.env`:

```env
VITE_API_URL=https://debugra-api-xxxxx-uc.a.run.app
```

---

## Supported Languages

Python, JavaScript, TypeScript, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Perl, Lua, Scala, Haskell, SQLite (SQL), Bash

> **SQL Note:** The execution engine uses SQLite 3.46.1. Statements like `CREATE DATABASE` are not supported — begin directly with `CREATE TABLE`.

---

## Design Principles

- **Aesthetic** — No generic emojis. Geometric symbols (`✦`, `⟡`) and text badges (`PY`, `JS`) maintain a premium developer aesthetic.
- **Accessible & Inclusive** — Perfect 100/100 Lighthouse accessibility score.
- **Separation of Concerns** — All business logic lives in custom hooks, not inside components.
- **Single Source of Truth** — All constants (breakpoints, defaults, enums) in `src/config/constants.js`.
- **Mobile-First** — Bootstrap 5 grid + dedicated `MobileBottomNav` for seamless mobile experience.
- **Centralized API** — All HTTP calls go through a single Axios instance with error interceptors.

---

## Team

Built for **Coders** — Debugra Team
# TODO: [feature]: add "resume last search" functionality for a better user experience (#876)

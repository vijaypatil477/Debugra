# Contributing to Debugra ✦

We are absolutely thrilled that you want to contribute to **Debugra**! This project participated in GSSoC 2026 to bring developers and student coders a real-time, premium, and zero-friction coding environment.

---

## ⟡ Code of Conduct
Please be respectful and supportive to other community members in issues and PR comments.

---

## ✦ Getting Started & Local Setup

### Prerequisites
- **Git** installed on your local machine
- **Node.js** (v18+) — only needed if running without Docker
- A free **Firebase** Account (Auth + Firestore enabled)
- A free **Groq API** key (from [console.groq.com](https://console.groq.com))
- **Docker Desktop** (recommended) — [Download here](https://www.docker.com/products/docker-desktop/)

### Setup Steps
1. **Fork the Repository** on GitHub to your own account.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/Debugra.git
   cd Debugra
   ```
   
3. **Create your `.env` files** from the templates:
   `env.example` → `.env` (for frontend)
   `env.example` → `server/.env` (for backend)
   Open `.env` and fill in your Firebase keys. Open `server/.env` and add your Groq API key.

---

## 🐳 Running with Docker (Recommended)

Docker is the easiest way to get the full development environment running with a single command. No need to install Node.js separately — everything runs inside containers.

### Quick Start

```bash
# Build and start both frontend & backend
docker compose up --build

# That's it! Open http://localhost:5173 in your browser.
```

### What Happens

| Service    | URL                       | Description                        |
| ---------- | ------------------------- | ---------------------------------- |
| Frontend   | http://localhost:5173      | Vite React dev server (hot-reload) |
| Backend    | http://localhost:3001      | Express API server (auto-restart)  |

### Common Docker Commands

```bash
# Start in background (detached mode)
docker compose up -d --build

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f frontend
docker compose logs -f backend

# Stop all containers
docker compose down

# Rebuild from scratch (e.g., after changing dependencies)
docker compose down
docker compose up --build

# Remove all containers, volumes, and cached layers
docker compose down -v --rmi local
```

### Hot Reload

- **Frontend** — Edit any file in `src/` and the browser will auto-refresh instantly.
- **Backend** — Edit any file in `server/` and Node.js will auto-restart using `--watch`.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Stop any local dev servers running on ports 5173 or 3001 |
| Changes not reflecting | Try `docker compose down && docker compose up --build` |
| `npm install` errors | Delete containers and rebuild: `docker compose down -v --rmi local && docker compose up --build` |
| File permission issues (Linux) | Run `sudo chown -R $USER:$USER .` in the project root |

---

## 💻 Running without Docker

If you prefer running without Docker:

```bash
# Terminal 1 — Frontend
npm install
npm run dev

# Terminal 2 — Backend
cd server
npm install
npm run dev
```

Frontend: http://localhost:5173 | Backend: http://localhost:3001

> Both Docker and non-Docker workflows use the same env files — frontend reads root `.env`, backend reads `server/.env`.

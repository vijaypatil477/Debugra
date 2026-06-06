# Contributing to Debugra ✦

We are absolutely thrilled that you want to contribute to **Debugra**! This project participated in GSSoC 2026 to bring developers and student coders a real-time, premium, and zero-friction coding environment.

---

## ⟡ Code of Conduct
Please be respectful and supportive to other community members in issues and PR comments.

---

## ✦ Getting Started & Local Setup

### Prerequisites
- Node.js (v18+)
- Git installed on your local machine
- A free Firebase Account
- A free Groq API key (from [console.groq.com](https://console.groq.com))

### Setup Steps
1. **Fork the Repository** on GitHub to your own account.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/Debugra.git
   cd Debugra
   ```

### Local Firebase Emulator

For offline development or if you don't have a Firebase billing account, you can run the Firebase emulators locally.

```bash
firebase emulators:start --only auth,firestore
```

Set the environment variable so the app connects to the emulators instead of production services:
```
VITE_FIREBASE_USE_EMULATOR=true
```

When this flag is enabled, the Firebase SDK will automatically point to the local emulators.

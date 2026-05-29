import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/Landing/LandingPage';
import EditorPage from './components/Editor/EditorPage';
import VideoCall from './components/Editor/VideoCall';
import OfflineBanner from './components/Editor/OfflineBanner';

const THEME_STORAGE_KEY = 'debugra-theme';

function getInitialAppTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;

    const prefersLight = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches;

    return prefersLight ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [appTheme, setAppTheme] = useState(getInitialAppTheme);


  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    try {
      document.body.classList.toggle('light-theme', appTheme === 'light');
      localStorage.setItem(THEME_STORAGE_KEY, appTheme);
    } catch {
      // ignore
    }
  }, [appTheme]);

  // Test helper: allow forcing a fake user via URL query param `?testUser=1`
  useEffect(() => {

    try {
      const params = new URLSearchParams(window.location.search);
      if (!user && params.get('testUser') === '1') {
        setUser({ uid: 'test-user', displayName: 'Playwright Tester', email: 'pw@test' });
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [user]);

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/editor"
          element={<EditorPage user={user} appTheme={appTheme} setAppTheme={setAppTheme} />}
        />

        {/* Test route to render VideoCall directly for e2e tests */}
        <Route
          path="/voice-test"
          element={<VideoCall roomId={'__playwright_test'} userName={'Playwright'} audioOnly />}
        />
        {/* Local-only test route that does not use Firestore/room presence */}
        <Route path="/voice-test-local" element={<VideoCall userName={'Playwright'} audioOnly />} />
      </Routes>
    </BrowserRouter>
  );
}

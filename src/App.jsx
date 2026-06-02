import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/Landing/LandingPage';
import OfflineBanner from './components/Editor/OfflineBanner';
import Footer from './components/Footer.jsx';
import FeedbackPage from './components/FeedbackPage';
import { ThemeProvider } from './context/ThemeContext';

// Lazy-loaded routes — keeps the heavy Monaco editor and WebRTC bundles out of
// the initial landing-page load so they download only when their route opens.
const EditorPage = lazy(() => import('./components/Editor/EditorPage'));
const VideoCall = lazy(() => import('./components/Editor/VideoCall'));

function RouteFallback() {
  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-0, #1e1e1e)',
        color: 'var(--text-1, #9d9d9d)',
        fontSize: '0.85rem',
      }}
    >
      <span className="spinner" style={{ marginRight: 8 }} />
      Loading…
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

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
    <ThemeProvider>
      <BrowserRouter>
        {/* This wrapper layout forces the footer to stick to the bottom
          of the screen even if the page content is short.
        */}
        <div className="flex flex-col min-h-screen bg-transparent">
          <OfflineBanner />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              },
            }}
          />

          {/* The main tag expands to fill all available empty space */}
          <main className="flex-grow">
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/editor" element={<EditorPage user={user} />} />
              {/* Test route to render VideoCall directly for e2e tests */}
              <Route
                path="/voice-test"
                element={<VideoCall roomId={'__playwright_test'} userName={'Playwright'} audioOnly />}
              />
              {/* Local-only test route that does not use Firestore/room presence */}
              <Route path="/voice-test-local" element={<VideoCall userName={'Playwright'} audioOnly />} />
            </Routes>
            </Suspense>
          </main>

          {/* Footer is safely placed outside <Routes> so it renders globally */}
          <Footer />
          
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

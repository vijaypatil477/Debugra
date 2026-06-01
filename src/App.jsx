import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/Landing/LandingPage';
import EditorPage from './components/Editor/EditorPage';
import VideoCall from './components/Editor/VideoCall';
import OfflineBanner from './components/Editor/OfflineBanner';
import Footer from './components/Footer.jsx';
import FeedbackPage from './components/FeedbackPage';

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
    <BrowserRouter>
      {/* This wrapper layout forces the footer to stick to the bottom 
        of the screen even if the page content is short.
      */}
      <div className="flex flex-col min-h-screen bg-[#1e1e1e]">
        
        <OfflineBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e3a',
              color: '#e2e8f0',
              border: '1px solid #2a2a4a',
            },
          }}
        />
        
        {/* The main tag expands to fill all available empty space */}
        <main className="flex-grow">
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
        </main>

        {/* Footer is safely placed outside <Routes> so it renders globally */}
        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

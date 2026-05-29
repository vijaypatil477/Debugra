import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/Landing/LandingPage';
import EditorPage from './components/Editor/EditorPage';
import OfflineBanner from "./components/Editor/OfflineBanner";
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <ThemeProvider>
    <BrowserRouter>
    <OfflineBanner />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
             background: 'var(--bg-1)',
              color: 'var(--text-0)',
              border: '1px solid var(--border)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/editor" element={<EditorPage user={user} />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>);
}

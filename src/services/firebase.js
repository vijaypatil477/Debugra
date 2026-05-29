import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
// Optionally use local Firebase emulators during development.
// Set VITE_FIREBASE_USE_EMULATOR=true in .env.local to enable.
if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  // Auth emulator default: http://localhost:9099
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (e) {
    // ignore in environments where emulator libs are unavailable
  }
  // Firestore emulator default: localhost:8080
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (e) {
    // ignore
  }
}
export default app;

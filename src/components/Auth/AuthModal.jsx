import { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../services/firebase';
import { X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthModal({ onClose, initialMode = 'login', mode }) {
  const [isLogin, setIsLogin] = useState((mode || initialMode) === 'login');

  useEffect(() => {
    if (mode) {
      setIsLogin(mode === 'login');
    }
  }, [mode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [touched, setTouched] = useState({});

  const saveUser = async (user) => {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: user.displayName || name || 'Anonymous',
        displayNameLower: (user.displayName || name || 'Anonymous').toLowerCase(),
        email: user.email,
        photoURL: user.photoURL || null,
        createdAt: new Date(),
      },
      { merge: true }
    );
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await saveUser(result.user);
      toast.success('Welcome, ' + (result.user.displayName || 'Developer') + '!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!isLogin && !name.trim()) {
      toast.error('Please enter a display name');
      return;
    }
    if (!isLogin && !acceptTerms) {
      toast.error('Please accept the Terms & Privacy Policy');
      return;
    }
    try {
      setLoading(true);
      let result;
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = await getDocs(
          query(collection(db, 'users'), where('displayNameLower', '==', name.trim().toLowerCase()))
        );
        if (q && !q.empty) {
          toast.error('This username is unavailable');
          setLoading(false);
          return;
        }
        result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
      }
      await saveUser(result.user);
      toast.success('Welcome!');
      onClose();
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak (min 6 characters)');
      } else if (code === 'auth/wrong-password') {
        toast.error('Wrong password');
      } else if (code === 'auth/user-not-found') {
        toast.error('No account found for that email');
      } else {
        toast.error(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Enter your email');
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success('Reset link sent! Check your inbox.');
      setForgotMode(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    display: 'block',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  };

  const inputFocusStyle = {
    borderColor: '#4ec9b0',
    boxShadow: '0 0 0 3px rgba(78,201,176,0.15)',
    background: 'rgba(255,255,255,0.06)',
  };

  const [focusedField, setFocusedField] = useState(null);

  const getInputStyle = (fieldName) => ({
    ...inputStyle,
    ...(focusedField === fieldName ? inputFocusStyle : {}),
  });

  const btnPrimaryStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 600,
    background: loading ? 'rgba(78,201,176,0.5)' : '#4ec9b0',
    color: '#09090b',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    boxSizing: 'border-box',
    transition: 'all 0.2s, transform 0.1s',
    transform: 'scale(1)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: "'Inter', system-ui, sans-serif",
        animation: 'authFadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '32px',
          width: '400px',
          maxWidth: '90vw',
          color: '#e2e8f0',
          animation: 'authSlideUp 0.25s ease',
        }}
      >
        <style>{`
          @keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes authSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .auth-input:focus { border-color: #4ec9b0 !important; box-shadow: 0 0 0 3px rgba(78,201,176,0.15) !important; background: rgba(255,255,255,0.06) !important; }
          .auth-btn-primary:hover:not(:disabled) { background: #3db896 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(78,201,176,0.3); }
          .auth-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }
          .auth-btn-google:hover:not(:disabled) { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.2) !important; }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-24px' }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <X size={20} />
          </button>
        </div>
        <h2
          style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}
        >
          {forgotMode ? 'Reset Password' : !isLogin ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p
          style={{
            fontSize: '0.8rem',
            color: '#8897aa',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          {forgotMode
            ? 'Enter your email to receive a reset link'
            : !isLogin
              ? 'Sign up to save code & collaborate'
              : 'Sign in to access saved code'}
        </p>

        {forgotMode ? (
          <form onSubmit={handleForgotPassword}>
            <input
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              required
              className="auth-input"
              style={{ ...inputStyle, marginBottom: '16px' }}
              onFocus={() => setFocusedField('resetEmail')}
              onBlur={() => setFocusedField(null)}
            />
            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary"
              style={btnPrimaryStyle}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p
              style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '0.78rem',
                color: '#8897aa',
              }}
            >
              Remember your password?{' '}
              <button
                onClick={() => setForgotMode(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4ec9b0',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Back to Sign In
              </button>
            </p>
          </form>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="auth-btn-google"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 500,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>or use email</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="auth-input"
                  style={{ ...getInputStyle('name'), marginBottom: '10px' }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => { setFocusedField(null); setTouched(prev => ({ ...prev, name: true })); }}
                  required
                />
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                required
                className="auth-input"
                style={{ ...getInputStyle('email'), marginBottom: '10px' }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => { setFocusedField(null); setTouched(prev => ({ ...prev, email: true })); }}
              />
              <div style={{ position: 'relative', marginBottom: isLogin ? '8px' : '12px' }}>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="auth-input"
                  style={{
                    ...getInputStyle('password'),
                    paddingRight: '40px',
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => { setFocusedField(null); setTouched(prev => ({ ...prev, password: true })); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isLogin && (
                <p style={{ textAlign: 'right', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setResetEmail(email);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4ec9b0',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      padding: 0,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#6edcb9'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#4ec9b0'}
                  >
                    Forgot password?
                  </button>
                </p>
              )}
              {!isLogin && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.72rem',
                    color: '#8897aa',
                    marginBottom: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    style={{
                      accentColor: '#4ec9b0',
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer',
                    }}
                  />
                  I accept the{' '}
                  <a href="#" style={{ color: '#4ec9b0', textDecoration: 'underline' }}>
                    Terms
                  </a>{' '}
                  &{' '}
                  <a href="#" style={{ color: '#4ec9b0', textDecoration: 'underline' }}>
                    Privacy Policy
                  </a>
                </label>
              )}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn-primary"
                style={btnPrimaryStyle}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="auth-spinner" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(9,9,11,0.2)', borderTopColor: '#09090b', borderRadius: '50%', animation: 'authSpin 0.6s linear infinite' }} />
                    {!isLogin ? 'Creating Account...' : 'Signing In...'}
                  </span>
                ) : (
                  !isLogin ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <p
              style={{
                textAlign: 'center',
                marginTop: '16px',
                fontSize: '0.78rem',
                color: '#8897aa',
              }}
            >
              {!isLogin ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(!isLogin);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4ec9b0',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6edcb9'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#4ec9b0'}
              >
                {!isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </p>

            <style>{`
              @keyframes authSpin { to { transform: rotate(360deg); } }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}

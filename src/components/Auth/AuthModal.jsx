import { useEffect, useMemo, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff, X, AlertCircle } from 'lucide-react';

import { auth, googleProvider, db } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function AuthModal({ onClose, initialMode = 'login', mode }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // support older callers that pass `mode` prop
  useEffect(() => {
    if (mode) {
      setIsLogin(mode === 'login');
    }
  }, [mode]);

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!name.trim()) {
        newErrors.name = 'Display name is required';
      }

      if (!acceptedTerms) {
        newErrors.terms = 'Please accept Terms & Privacy Policy';
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

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

      toast.success(`Welcome, ${result.user.displayName || 'Developer'}!`);

      onClose();
    } catch (err) {
      toast.error(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      let result;

      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // validate display name and check for duplicates
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

        await updateProfile(result.user, {
          displayName: name.trim(),
        });
      }

      await saveUser(result.user);

      toast.success('Welcome!');
      onClose();
    } catch (err) {
      const code = err?.code || '';

      if (code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak (minimum 6 characters)');
      } else if (code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (code === 'auth/user-not-found') {
        toast.error('No account found for that email');
      } else if (code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else {
        toast.error(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!validateEmail(resetEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, resetEmail);

      toast.success('Password reset link sent! Check your inbox.');

      setForgotMode(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = useMemo(
    () => ({
      width: '100%',
      padding: '12px 14px',
      borderRadius: '12px',
      fontSize: '0.88rem',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: '#f8fafc',
      outline: 'none',
      transition: 'all 0.2s ease',
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box',
    }),
    []
  );

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.8rem',
    color: '#e2e8f0',
    fontWeight: 500,
  };

  const errorStyle = {
    color: '#f87171',
    fontSize: '0.72rem',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <>
      <style>
        {`
          @keyframes modalFade {
            from {
              opacity: 0;
              transform: translateY(10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .auth-modal {
            animation: modalFade 0.22s ease;
          }

          .auth-input::placeholder {
            color: #94a3b8;
          }

          .auth-input:focus {
            border-color: #4ec9b0 !important;
            box-shadow: 0 0 0 4px rgba(78, 201, 176, 0.15);
          }

          .auth-btn {
            transition: all 0.2s ease;
          }

          .auth-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(78, 201, 176, 0.18);
          }

          .auth-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .google-btn:hover:not(:disabled) {
            background: rgba(255,255,255,0.08) !important;
            border-color: rgba(255,255,255,0.18) !important;
          }

          .switch-link:hover,
          .forgot-link:hover {
            color: #7dd3fc !important;
          }

          @media (max-width: 480px) {
            .auth-container {
              padding: 22px !important;
              border-radius: 14px !important;
            }
          }
        `}
      </style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onClick={onClose}
      >
        <div
          className="auth-modal auth-container"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #161625 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            padding: '28px',
            width: '100%',
            maxWidth: '400px',
            color: '#e2e8f0',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Close */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '-8px',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close authentication modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Header */}
          <h2
            id="auth-modal-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              marginBottom: '8px',
              textAlign: 'center',
              color: '#f8fafc',
            }}
          >
            {forgotMode ? 'Reset Password' : !isLogin ? 'Create Account' : 'Welcome Back'}
          </h2>

          <p
            style={{
              fontSize: '0.84rem',
              color: '#cbd5e1',
              textAlign: 'center',
              marginBottom: '22px',
              lineHeight: 1.5,
            }}
          >
            {forgotMode
              ? 'Enter your email to receive a password reset link'
              : !isLogin
                ? 'Sign up to save code and collaborate'
                : 'Sign in to continue to your workspace'}
          </p>

          {forgotMode ? (
            /* Forgot Password */
            <form onSubmit={handleForgotPassword}>
              <label htmlFor="reset-email" style={labelStyle}>
                Email Address
              </label>

              <input
                id="reset-email"
                className="auth-input"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                autoComplete="email"
                required
                style={{
                  ...inputStyle,
                  marginBottom: '16px',
                }}
              />

              <button
                type="submit"
                disabled={loading}
                className="auth-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: '#4ec9b0',
                  color: '#09090b',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>

              <p
                style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                }}
              >
                Remember your password?{' '}
                <button
                  type="button"
                  className="switch-link"
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
                    transition: '0.2s ease',
                  }}
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="google-btn auth-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
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

                {loading ? 'Please wait...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '14px 0 18px',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                />

                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                  }}
                >
                  or use email
                </span>

                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {!isLogin && (
                  <div style={{ marginBottom: '14px' }}>
                    <label htmlFor="name" style={labelStyle}>
                      Display Name
                    </label>

                    <input
                      id="name"
                      className="auth-input"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);

                        if (errors.name) {
                          setErrors((prev) => ({
                            ...prev,
                            name: '',
                          }));
                        }
                      }}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                      aria-invalid={!!errors.name}
                      style={{
                        ...inputStyle,
                        border: errors.name ? '1px solid #ef4444' : inputStyle.border,
                      }}
                    />

                    {errors.name && (
                      <div style={errorStyle}>
                        <AlertCircle size={14} />
                        {errors.name}
                      </div>
                    )}
                  </div>
                )}

                {/* Email */}
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="email" style={labelStyle}>
                    Email Address
                  </label>

                  <input
                    id="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);

                      if (errors.email) {
                        setErrors((prev) => ({
                          ...prev,
                          email: '',
                        }));
                      }
                    }}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={!!errors.email}
                    style={{
                      ...inputStyle,
                      border: errors.email ? '1px solid #ef4444' : inputStyle.border,
                    }}
                  />

                  {errors.email && (
                    <div style={errorStyle}>
                      <AlertCircle size={14} />
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div
                  style={{
                    marginBottom: isLogin ? '8px' : '14px',
                  }}
                >
                  <label htmlFor="password" style={labelStyle}>
                    Password
                  </label>

                  <div
                    style={{
                      position: 'relative',
                    }}
                  >
                    <input
                      id="password"
                      className="auth-input"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);

                        if (errors.password) {
                          setErrors((prev) => ({
                            ...prev,
                            password: '',
                          }));
                        }
                      }}
                      placeholder="Enter password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      aria-invalid={!!errors.password}
                      style={{
                        ...inputStyle,
                        paddingRight: '46px',
                        border: errors.password ? '1px solid #ef4444' : inputStyle.border,
                      }}
                    />

                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {errors.password && (
                    <div style={errorStyle}>
                      <AlertCircle size={14} />
                      {errors.password}
                    </div>
                  )}
                </div>

                {/* Forgot Password */}
                {isLogin && (
                  <div
                    style={{
                      textAlign: 'right',
                      marginBottom: '14px',
                    }}
                  >
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => {
                        setForgotMode(true);
                        setResetEmail(email);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4ec9b0',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: 0,
                        transition: '0.2s ease',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Terms */}
                {!isLogin && (
                  <div
                    style={{
                      marginBottom: '16px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '0.75rem',
                        color: '#cbd5e1',
                        lineHeight: 1.5,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        style={{
                          marginTop: '2px',
                        }}
                      />

                      <span>
                        I agree to the{' '}
                        <span
                          style={{
                            color: '#4ec9b0',
                          }}
                        >
                          Terms of Service
                        </span>{' '}
                        and{' '}
                        <span
                          style={{
                            color: '#4ec9b0',
                          }}
                        >
                          Privacy Policy
                        </span>
                      </span>
                    </label>

                    {errors.terms && (
                      <div style={errorStyle}>
                        <AlertCircle size={14} />
                        {errors.terms}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-btn"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    background: '#4ec9b0',
                    color: '#09090b',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.01em',
                  }}
                >
                  {loading ? 'Please wait...' : !isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              {/* Switch */}
              <p
                style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  fontSize: '0.8rem',
                  color: '#cbd5e1',
                }}
              >
                {!isLogin ? 'Already have an account? ' : "Don't have an account? "}

                <button
                  onClick={(e) => {
                    e.preventDefault();

                    setErrors({});
                    setIsLogin(!isLogin);
                  }}
                  className="switch-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4ec9b0',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    padding: 0,
                    transition: '0.2s ease',
                  }}
                >
                  {!isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

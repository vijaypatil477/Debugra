import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebase";

/**
 * ForgotPassword
 * Sends a Firebase password reset email.
 * Uses only Firebase Auth — no backend changes needed.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      setStatus("error");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setStatus("success");
    } catch (err) {
      // Firebase error codes
      switch (err.code) {
        case "auth/user-not-found":
          // Deliberate: don't reveal whether email is registered
          setStatus("success");
          break;
        case "auth/invalid-email":
          setErrorMsg("Invalid email address format.");
          setStatus("error");
          break;
        case "auth/too-many-requests":
          setErrorMsg("Too many attempts. Please wait a few minutes and try again.");
          setStatus("error");
          break;
        default:
          setErrorMsg("Something went wrong. Please try again.");
          setStatus("error");
      }
    }
  };

  return (
    <div className="fp-page">
      <div className="fp-card">
        <div className="fp-icon-wrapper">
          <span className="fp-icon">🔑</span>
        </div>

        <h1 className="fp-title">Forgot Password?</h1>
        <p className="fp-subtitle">
          Enter your account email and we'll send you a reset link.
        </p>

        {status === "success" ? (
          <div className="fp-success-block" role="alert">
            <span className="fp-success-icon">✅</span>
            <p className="fp-success-title">Check your inbox!</p>
            <p className="fp-success-body">
              If an account exists for that email, a password reset link has been sent. Check
              your spam folder if you don't see it.
            </p>
            <a href="/" className="fp-back-btn">
              ← Back to Home
            </a>
          </div>
        ) : (
          <form className="fp-form" onSubmit={handleSubmit} noValidate>
            <div className="fp-field">
              <label htmlFor="fp-email" className="fp-label">
                Email address
              </label>
              <input
                id="fp-email"
                type="email"
                className={`fp-input ${status === "error" ? "fp-input-error" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                disabled={status === "loading"}
                autoFocus
                autoComplete="email"
                aria-describedby={status === "error" ? "fp-error-msg" : undefined}
              />
              {status === "error" && errorMsg && (
                <p id="fp-error-msg" className="fp-error-msg" role="alert">
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="fp-submit-btn"
              disabled={status === "loading"}
              aria-busy={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <span className="fp-spinner" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <a href="/" className="fp-cancel-link">
              ← Back to Home
            </a>
          </form>
        )}
      </div>
    </div>
  );
}

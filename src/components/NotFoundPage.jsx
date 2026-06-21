import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center text-center"
      style={{ minHeight: '60vh', padding: '40px 24px' }}
    >
      <h1
        style={{
          fontSize: 'clamp(5rem, 15vw, 8rem)',
          fontWeight: 800,
          color: 'var(--brand)',
          lineHeight: 1,
          marginBottom: '8px',
        }}
      >
        404
      </h1>
      <p
        style={{
          color: 'var(--text-mid)',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          marginBottom: '32px',
          maxWidth: 480,
        }}
      >
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="landing-btn-primary"
        style={{
          padding: '12px 32px',
          borderRadius: '8px',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem',
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}

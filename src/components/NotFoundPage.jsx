import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        background: 'var(--bg-0)',
        color: 'var(--text-0)',
        padding: '2rem',
      }}
    >
      <h1
        className="text-6xl font-bold mb-4"
        style={{ color: 'var(--text-0)' }}
      >
        Page Not Found
      </h1>
      <p
        className="text-lg mb-8"
        style={{ color: 'var(--text-1)' }}
      >
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
        style={{
          background: 'var(--accent)',
          color: '#fff',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--accent-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--accent)';
        }}
      >
        Go Home
      </Link>
    </div>
  );
}

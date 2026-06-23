import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e] px-6">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-[#569cd6] mb-4">404</h1>
        <p className="text-[#cccccc] text-lg mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-[#569cd6] text-white font-semibold rounded-lg hover:bg-[#4a8bc2] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

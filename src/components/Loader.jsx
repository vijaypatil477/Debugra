import { useState, useEffect } from 'react';

const MESSAGES = [
  'Connecting to Judge0...',
  'Compiling code...',
  'Executing binary...',
  'Fetching output...'
];

/**
 * Premium developer-focused split-panel glassmorphic loading overlay.
 * Renders full-screen over the editor & terminal, blocking all user clicks.
 * 
 * @param {boolean} isVisible - Controls the visibility of the overlay
 */
export default function Loader({ isVisible }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 600);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="premium-loader-overlay" 
      id="premium-execution-loader"
      onClick={(e) => {
        // Prevent click events from propagating to Monaco or Terminal
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="premium-loader-card">
        {/* Left Side: Terminal-style Execution Trace */}
        <div className="loader-left-panel">
          <div className="terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot dot-red" />
              <div className="terminal-dot dot-yellow" />
              <div className="terminal-dot dot-green" />
            </div>
            <div className="terminal-title">bash — debugra-runner</div>
          </div>
          <div className="terminal-console">
            {MESSAGES.map((msg, i) => {
              let statusClass = 'pending';
              let bullet = '○';

              if (i < index) {
                statusClass = 'completed';
                bullet = '✓';
              } else if (i === index) {
                statusClass = 'active';
                bullet = '❯';
              }

              return (
                <div key={msg} className={`terminal-trace-line ${statusClass}`}>
                  <span className="terminal-bullet">{bullet}</span>
                  <span>{msg}</span>
                  {i === index && <span className="terminal-cursor" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: High-fidelity Neon Orbiting Visualizer */}
        <div className="loader-right-panel">
          <div className="orbit-container">
            <div className="orbit-core" />
            <div className="orbit-track-1" />
            <div className="orbit-track-2" />
            <div className="orbit-ring-1">
              <div className="orbit-dot-1" />
            </div>
            <div className="orbit-ring-2">
              <div className="orbit-dot-2" />
            </div>
          </div>
          <span className="right-panel-title">Running</span>
        </div>
      </div>
    </div>
  );
}

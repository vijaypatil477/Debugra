import { useEffect, useState } from 'react';

/**
 * TTSPlaybackControl
 * Renders TTS playback controls with progress indicator and status display.
 * Integrates with useStreamedTTS hook for audio playback management.
 */
export default function TTSPlaybackControl({
  isPlaying,
  isPaused,
  isSpeaking,
  progress,
  error,
  onPlay,
  onPause,
  onResume,
  onStop,
  text,
  disabled = false,
}) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  const handlePlayClick = () => {
    if (!isPlaying && !isPaused) {
      onPlay();
    } else if (isPaused) {
      onResume();
    }
  };

  return (
    <div style={styles.container}>
      {/* ── TTS Controls ── */}
      <div style={styles.controls}>
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayClick}
          disabled={disabled || !text}
          title={isPaused ? 'Resume' : 'Play'}
          style={{
            ...styles.button,
            ...(isPlaying || isPaused ? styles.buttonActive : {}),
            ...(disabled || !text ? styles.buttonDisabled : {}),
          }}
          aria-label={isPaused ? 'Resume audio' : 'Play audio'}
        >
          {isPaused ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
          <span style={styles.buttonText}>
            {isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Listen'}
          </span>
        </button>

        {/* Stop Button */}
        {(isPlaying || isPaused) && (
          <button
            onClick={onStop}
            title="Stop"
            style={{ ...styles.button, ...styles.stopButton }}
            aria-label="Stop audio"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
            <span style={styles.buttonText}>Stop</span>
          </button>
        )}

        {/* Status Indicator */}
        {isSpeaking && (
          <div style={styles.statusBadge}>
            <span style={styles.statusDot} />
            Speaking...
          </div>
        )}

        {error && (
          <div style={styles.errorBadge} title={error}>
            ⚠ Error
          </div>
        )}
      </div>

      {/* ── Progress Bar ── */}
      {(isPlaying || isPaused || displayProgress > 0) && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${displayProgress}%`,
              }}
            />
          </div>
          <span style={styles.progressText}>{displayProgress}%</span>
        </div>
      )}

      {/* ── Text Preview ── */}
      {text && (
        <div style={styles.textPreview}>
          <span style={styles.previewLabel}>Speaking:</span>
          <span style={styles.previewText}>
            {text.length > 100 ? text.substring(0, 100) + '...' : text}
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    background: 'rgba(78,201,176,0.08)',
    border: '1px solid rgba(78,201,176,0.2)',
    borderRadius: '6px',
    marginBottom: '10px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid rgba(78,201,176,0.3)',
    background: 'transparent',
    color: '#4ec9b0',
    fontSize: '0.7rem',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 500,
  },
  buttonActive: {
    background: 'rgba(78,201,176,0.15)',
    borderColor: 'rgba(78,201,176,0.5)',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    color: '#6a6a6a',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonText: {
    whiteSpace: 'nowrap',
  },
  stopButton: {
    color: '#f44747',
    borderColor: 'rgba(244,71,71,0.3)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'rgba(78,201,176,0.12)',
    border: '1px solid rgba(78,201,176,0.3)',
    borderRadius: '4px',
    fontSize: '0.65rem',
    color: '#4ec9b0',
    fontFamily: 'Inter, sans-serif',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4ec9b0',
    animation: 'pulse 1.5s infinite',
  },
  errorBadge: {
    padding: '4px 10px',
    background: 'rgba(244,71,71,0.12)',
    border: '1px solid rgba(244,71,71,0.3)',
    borderRadius: '4px',
    fontSize: '0.65rem',
    color: '#f44747',
    fontFamily: 'Inter, sans-serif',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  progressBar: {
    flex: 1,
    height: '4px',
    background: 'rgba(78,201,176,0.15)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#4ec9b0',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.62rem',
    color: '#6a6a6a',
    fontFamily: 'JetBrains Mono, monospace',
    minWidth: '30px',
    textAlign: 'right',
  },
  textPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.65rem',
    color: '#9d9d9d',
    fontFamily: 'Inter, sans-serif',
  },
  previewLabel: {
    fontWeight: 600,
    color: '#4ec9b0',
    flexShrink: 0,
  },
  previewText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

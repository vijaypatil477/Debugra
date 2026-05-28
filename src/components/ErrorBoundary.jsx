import React from 'react';

/**
 * ErrorBoundary
 * A class-based React Error Boundary component that catches uncaught
 * runtime exceptions inside child components, displaying a polished,
 * theme-compliant fallback UI with detailed diagnostics and recovery options.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for developers
    console.error('ErrorBoundary caught an uncaught exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.overlay}>
          <div style={styles.container}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Application Crash Caught</h1>
            <p style={styles.message}>
              Debugra encountered an unexpected runtime exception. The error has been intercepted
              safely to prevent a complete application white-screen.
            </p>

            {this.state.error && (
              <div style={styles.errorBox}>
                <div style={styles.errorName}>{this.state.error.toString()}</div>
                {this.state.errorInfo && (
                  <pre style={styles.stackTrace}>{this.state.errorInfo.componentStack}</pre>
                )}
              </div>
            )}

            <div style={styles.actions}>
              <button style={styles.reloadBtn} onClick={this.handleReload}>
                🔄 Reload Application
              </button>
              <button
                style={styles.resetBtn}
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Dismiss & Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  overlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0a0a16',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: '650px',
    width: '100%',
    backgroundColor: 'rgba(30, 30, 58, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '40px 30px',
    textAlign: 'center',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    boxSizing: 'border-box',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#f87171',
    letterSpacing: '-0.5px',
  },
  message: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#94a3b8',
    marginBottom: '25px',
  },
  errorBox: {
    textAlign: 'left',
    backgroundColor: '#0d0d1e',
    border: '1px solid #1e1e3a',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  errorName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f87171',
    fontFamily: 'monospace',
    marginBottom: '10px',
  },
  stackTrace: {
    fontSize: '11px',
    color: '#94a3b8',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    margin: 0,
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  reloadBtn: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  resetBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

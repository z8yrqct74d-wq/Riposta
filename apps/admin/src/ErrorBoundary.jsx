import React from 'react';

/**
 * Last resort so a crash during render shows *something*. React unmounts the
 * whole tree on an uncaught render error, which on this app means a blank white
 * page — indistinguishable from a failed deploy. The admin surfaces are plain
 * JSX with no typecheck, so this is the only net under them.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Admin console crashed', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--paper)', fontFamily: 'var(--font-ui)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          width: '100%', maxWidth: 460, background: 'var(--surface)', border: '1px solid var(--hairline)',
          borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-raise)', padding: '32px',
        }}>
          <h1 className="r-display" style={{ margin: 0, fontSize: 22, color: 'var(--ink)' }}>Something broke</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            The console hit an unexpected error and stopped. Reloading usually clears it; if it
            keeps happening, the details are in the browser console.
          </p>
          <p className="r-mono" style={{
            margin: '14px 0 0', padding: '10px 12px', borderRadius: 'var(--r-btn)',
            border: '1px solid var(--hairline)', background: 'var(--paper)',
            fontSize: 12, color: 'var(--danger)', lineHeight: 1.6, overflowWrap: 'anywhere',
          }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button onClick={() => window.location.reload()} className="r-focusable" style={{
            marginTop: 20, font: 'inherit', cursor: 'pointer', width: '100%', padding: '11px',
            borderRadius: 'var(--r-btn)', border: '1px solid var(--hairline)', background: 'transparent',
            color: 'var(--ink)', fontSize: 13.5, fontWeight: 600,
          }}>Reload</button>
        </div>
      </div>
    );
  }
}

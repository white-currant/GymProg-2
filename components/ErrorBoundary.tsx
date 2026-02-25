
import React from 'react';

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crash:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#f4f4f5', fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>:(</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Что-то сломалось</h1>
          <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '1.5rem' }}>Попробуйте перезагрузить приложение</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 2rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
          >
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

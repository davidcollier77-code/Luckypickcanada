'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <p style={{ color: '#f87171', fontWeight: 'bold' }}>Failed to load map data. Please try refreshing the page.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#facc15', color: '#000', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

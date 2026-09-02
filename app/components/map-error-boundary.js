"use client";

import { ErrorBoundary } from 'react-error-boundary';

function MapErrorFallback({ error }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div style={{ color: '#ef4444', fontSize: '3rem' }}>⚠️</div>
      <h2 style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 'bold' }}>Unable to Load Map</h2>
      <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
        We're having trouble loading the Lucky Map. Please try again later.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#facc15', color: '#000', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Retry
      </button>
    </div>
  );
}

export function MapErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={MapErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

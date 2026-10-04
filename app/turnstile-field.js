'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export default function TurnstileField({ siteKey, submitButtonId }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('loading');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !isReady || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;

    if (window.turnstile && typeof window.turnstile.render === 'function') {
      try {
        if (widgetIdRef.current !== null) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          'refresh-expired': 'auto',
          callback: (newToken) => {
            if (cancelled) return;
            setToken(newToken || '');
            setError('');
            setStatus(newToken ? 'verified' : 'loading');
          },
          'expired-callback': () => {
            if (cancelled) return;
            setToken('');
            setStatus('loading');
          },
          'error-callback': () => {
            if (cancelled) return;
            setToken('');
            setStatus('error');
            setError('The security check had a problem. Please use Troubleshoot or refresh, then try again.');
          },
          'response-field': false,
        });
      } catch (err) {
        console.error("Turnstile render error", err);
        if (!cancelled) {
          setStatus('error');
          setError('The security check could not load. Please refresh and try again.');
        }
      }
    }

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, isReady]);

  useEffect(() => {
    if (!submitButtonId || !containerRef.current) {
      return undefined;
    }

    const form = containerRef.current.closest('form');
    const submitButton = document.getElementById(submitButtonId);

    if (!form || !submitButton) {
      return undefined;
    }

    submitButton.disabled = !token;
    const preventUnverifiedSubmit = (event) => {
      if (token) {
        return;
      }

      event.preventDefault();
      setError(status === 'loading'
        ? 'Security check loading, please wait a moment.'
        : 'Please complete the security check before sending.');
    };

    form.addEventListener('submit', preventUnverifiedSubmit);
    return () => {
      submitButton.disabled = false;
      form.removeEventListener('submit', preventUnverifiedSubmit);
    };
  }, [status, submitButtonId, token]);

  if (!siteKey) {
    return (
      <p style={{ margin: 0, padding: '0.75rem 1rem', borderRadius: 14, background: 'rgba(185, 28, 28, 0.16)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.36)', fontWeight: 700 }}>
        Spam check is not configured. Please try again later.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '0.45rem' }}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onReady={() => setIsReady(true)}
        onError={() => {
            setStatus('error');
            setError('The security check could not load. Please refresh and try again.');
        }}
      />
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
      <div ref={containerRef} />
      {error ? <p role="status" style={{ margin: 0, color: '#fecaca', fontWeight: 700 }}>{error}</p> : null}
      {status === 'loading' && !error ? <p role="status" style={{ margin: 0, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 700 }}>Security check loading, please wait a moment.</p> : null}
      {status === 'verified' ? <p role="status" style={{ margin: 0, color: '#bbf7d0', fontWeight: 700 }}>Security check verified.</p> : null}
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 247, 214, 0.72)', lineHeight: 1.45 }}>
        Complete this quick check before sending. It helps keep spam out without affecting checkout or payment processing.
      </p>
    </div>
  );
}

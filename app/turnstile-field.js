'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTurnstile } from './turnstile-loader';

const TURNSTILE_ERROR_MESSAGE =
  'The security check had a problem. Please use Troubleshoot or refresh, then try again.';

export default function TurnstileField({ siteKey, submitButtonId }) {
  const containerRef = useRef(null);
  const turnstileApiRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return undefined;
    }

    let cancelled = false;

    const initializeWidget = async () => {
      try {
        setStatus('loading');
        setError('');
        setToken('');

        const turnstile = await loadTurnstile();

        if (cancelled || !containerRef.current) {
          return;
        }

        turnstileApiRef.current = turnstile;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          'refresh-expired': 'auto',
          'response-field': false,
          callback: (newToken) => {
            if (cancelled) {
              return;
            }

            setToken(newToken || '');
            setError('');
            setStatus('verified');
          },
          'expired-callback': () => {
            if (cancelled) {
              return;
            }

            setToken('');
            setStatus('loading');
          },
          'error-callback': () => {
            if (cancelled) {
              return true;
            }

            setToken('');
            setStatus('error');
            setError(TURNSTILE_ERROR_MESSAGE);

            // Returning true tells Turnstile that the application handled the
            // error while preserving its configured automatic retry behavior.
            return true;
          },
          'timeout-callback': () => {
            if (cancelled) {
              return;
            }

            setToken('');
            setStatus('loading');
            setError('');

            const currentTurnstile = turnstileApiRef.current;
            const currentWidgetId = widgetIdRef.current;

            if (currentTurnstile && currentWidgetId !== null) {
              currentTurnstile.reset(currentWidgetId);
            }
          },
          'unsupported-callback': () => {
            if (cancelled) {
              return;
            }

            setToken('');
            setStatus('error');
            setError(TURNSTILE_ERROR_MESSAGE);
          },
        });
      } catch {
        if (cancelled) {
          return;
        }

        setToken('');
        setStatus('error');
        setError(TURNSTILE_ERROR_MESSAGE);
      }
    };

    initializeWidget();

    return () => {
      cancelled = true;

      const turnstile = turnstileApiRef.current;
      const widgetId = widgetIdRef.current;

      if (turnstile && widgetId !== null) {
        try {
          turnstile.remove(widgetId);
        } catch {
          // The widget may already have been removed by a browser teardown.
        }
      }

      turnstileApiRef.current = null;
      widgetIdRef.current = null;
    };
  }, [siteKey]);

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
      setError(
        status === 'loading'
          ? 'Security check loading, please wait a moment.'
          : 'Please complete the security check before sending.',
      );
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
    <div style={{ display: 'grid', gap: '0.45rem' }} ref={containerRef}>
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
      {error ? <p role="status" style={{ margin: 0, color: '#fecaca', fontWeight: 700 }}>{error}</p> : null}
      {status === 'loading' && !error ? <p role="status" style={{ margin: 0, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 700 }}>Security check loading, please wait a moment.</p> : null}
      {status === 'verified' ? <p role="status" style={{ margin: 0, color: '#bbf7d0', fontWeight: 700 }}>Security check verified.</p> : null}
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 247, 214, 0.72)', lineHeight: 1.45 }}>
        Complete this quick check before sending. It helps keep spam out without affecting checkout or payment processing.
      </p>
    </div>
  );
}

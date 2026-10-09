'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { fetchTurnstileSiteKey } from './turnstile-actions';
import { TURNSTILE_SITE_KEY } from './turnstile-config';

const TURNSTILE_ERROR_MESSAGE =
  'The security check had a problem. Please use Troubleshoot or refresh, then try again.';

export default function TurnstileField({ submitButtonId, action }) {
  const containerRef = useRef(null);
  const turnstileRef = useRef(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('loading');
  const [siteKey, setSiteKey] = useState(TURNSTILE_SITE_KEY);
  const [keyError, setKeyError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadKey() {
      if (TURNSTILE_SITE_KEY) return;
      try {
        const key = await fetchTurnstileSiteKey();
        if (isMounted) {
          if (!key) {
            setKeyError(true);
          } else {
            setSiteKey(key);
          }
        }
      } catch (err) {
        console.error('Failed to load Turnstile configuration:', err);
        if (isMounted) {
          setKeyError(true);
        }
      }
    }
    loadKey();
    return () => {
      isMounted = false;
    };
  }, []);

  const onSuccess = useCallback((newToken) => {
    setToken(newToken || '');
    setError('');
    setStatus('verified');
  }, []);

  const onExpire = useCallback(() => {
    setToken('');
    setStatus('loading');
  }, []);

  const onError = useCallback(() => {
    setToken('');
    setStatus('error');
    setError(TURNSTILE_ERROR_MESSAGE);
  }, []);

  const onTimeout = useCallback(() => {
    setToken('');
    setStatus('loading');
    setError('');
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
  }, []);

  const onRetry = useCallback(() => {
    setToken('');
    setStatus('loading');
    setError('');
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
  }, []);

  const onUnsupported = useCallback(() => {
    setToken('');
    setStatus('error');
    setError(TURNSTILE_ERROR_MESSAGE);
  }, []);

  useEffect(() => {
    if (!submitButtonId || !containerRef.current) {
      return undefined;
    }

    const form = containerRef.current.closest('form');
    const submitButton = document.getElementById(submitButtonId);

    if (!form || !submitButton) {
      return undefined;
    }

    // Submit button disabled logic correctly handles siteKey loading state
    submitButton.disabled = status !== 'verified' || !token;

    const preventUnverifiedSubmit = (event) => {
      if (token) {
        return;
      }

      event.preventDefault();
      setError(
        status === 'loading' || !siteKey
          ? 'Security check loading, please wait a moment.'
          : 'Please complete the security check before sending.',
      );
    };

    form.addEventListener('submit', preventUnverifiedSubmit);

    return () => {
      submitButton.disabled = false;
      form.removeEventListener('submit', preventUnverifiedSubmit);
    };
  }, [status, submitButtonId, token, siteKey]);

  return (
    <div style={{ display: 'grid', gap: '0.45rem' }} ref={containerRef}>
      {keyError ? (
        <p style={{ margin: 0, padding: '0.75rem 1rem', borderRadius: 14, background: 'rgba(185, 28, 28, 0.16)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.36)', fontWeight: 700 }}>
          Spam check is not configured. Please try again later.
        </p>
      ) : !siteKey ? (
        <p role="status" style={{ margin: 0, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 700 }}>Initializing security check...</p>
      ) : (
        <>
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        options={{
          theme: 'auto',
          responseField: false,
          action: action,
        }}
        scriptOptions={{
          onError,
        }}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        onTimeout={onTimeout}
        onUnsupported={onUnsupported}
      />
      {error ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <p role="status" style={{ margin: 0, color: '#fecaca', fontWeight: 700 }}>{error}</p>
          <button type="button" aria-label="Retry security check" onClick={onRetry} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : null}
      {status === 'loading' && !error ? <p role="status" style={{ margin: 0, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 700 }}>Security check loading, please wait a moment.</p> : null}
      {status === 'verified' ? <p role="status" style={{ margin: 0, color: '#bbf7d0', fontWeight: 700 }}>Security check verified.</p> : null}
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 247, 214, 0.72)', lineHeight: 1.45 }}>
        Complete this quick check before sending. It helps keep spam out without affecting checkout or payment processing.
      </p>
        </>
      )}
    </div>
  );
}

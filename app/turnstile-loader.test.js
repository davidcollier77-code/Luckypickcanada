// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadTurnstile', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    window.turnstile = undefined;
  });

  afterEach(() => {
    vi.resetModules();
    vi.useRealTimers();
  });

  it('resolves immediately when the Turnstile API is already available', async () => {
    const api = { render: vi.fn() };
    window.turnstile = api;

    const { loadTurnstile } = await import('./turnstile-loader');

    await expect(loadTurnstile()).resolves.toBe(api);
    expect(document.querySelectorAll('script').length).toBe(0);
  });

  it('waits for an existing script and resolves when the API becomes available', async () => {
    const script = document.createElement('script');
    script.id = 'cloudflare-turnstile-api';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    document.head.appendChild(script);

    const { loadTurnstile } = await import('./turnstile-loader');
    const promise = loadTurnstile();

    const api = { render: vi.fn() };
    window.turnstile = api;
    script.dispatchEvent(new Event('load'));

    await expect(promise).resolves.toBe(api);
  });

  it('clears a failed load so a subsequent attempt can create a fresh script', async () => {
    const { loadTurnstile } = await import('./turnstile-loader');

    const firstAttempt = loadTurnstile();
    const firstScript = document.getElementById('cloudflare-turnstile-api');

    firstScript.dispatchEvent(new Event('error'));

    await expect(firstAttempt).rejects.toThrow('Unable to load the Cloudflare Turnstile script.');
    expect(document.getElementById('cloudflare-turnstile-api')).toBeNull();

    const secondAttempt = loadTurnstile();
    const secondScript = document.getElementById('cloudflare-turnstile-api');

    expect(secondScript).not.toBeNull();

    const api = { render: vi.fn() };
    window.turnstile = api;
    secondScript.dispatchEvent(new Event('load'));

    await expect(secondAttempt).resolves.toBe(api);
  });

  it('fails cleanly instead of waiting indefinitely for the API', async () => {
    vi.useFakeTimers();

    const { loadTurnstile } = await import('./turnstile-loader');
    const attempt = loadTurnstile();

    vi.advanceTimersByTime(15000);

    await expect(attempt).rejects.toThrow(
      'Timed out waiting for Cloudflare Turnstile to initialize.',
    );
    expect(document.getElementById('cloudflare-turnstile-api')).toBeNull();
  });
});

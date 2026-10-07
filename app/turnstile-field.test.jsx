// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@marsidev/react-turnstile', () => {
  return {
    Turnstile: vi.fn(({ onSuccess, onError, onExpire, onTimeout }) => (
      <div
        data-testid="turnstile-widget"
      />
    ))
  };
});

import { Turnstile } from '@marsidev/react-turnstile';
import TurnstileField from './turnstile-field';

describe('TurnstileField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps the submit button disabled until a valid token is returned', async () => {
    render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const submitButton = screen.getByRole('button', { name: 'Send' });
    expect(submitButton).toBeDisabled();

    const turnstileMock = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMock.onSuccess('valid-token');
    });

    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getByDisplayValue('valid-token')).toHaveAttribute(
      'name',
      'cf-turnstile-response',
    );
    expect(screen.getByText('Security check verified.')).toBeInTheDocument();
  });

  it('clears the token on expiry and sets status to loading', async () => {
    render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMock = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMock.onSuccess('valid-token');
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());

    act(() => {
      turnstileMock.onExpire();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled());
    expect(screen.queryByDisplayValue('valid-token')).not.toBeInTheDocument();
    expect(screen.getByText('Security check loading, please wait a moment.')).toBeInTheDocument();
  });

  it('shows an error state when the client integration fails', async () => {
    render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMock = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMock.onError();
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          'The security check had a problem. Please use Troubleshoot or refresh, then try again.',
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});

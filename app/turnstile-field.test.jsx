// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

// Implementation.apply is not a function means the mock was created incorrectly.
// Let's create a functional component for the mock.
const MockTurnstile = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    reset: vi.fn(),
  }));
  return <div data-testid="turnstile-widget" />;
});

// Mock module with named export Turnstile mapping to a vi.fn wrapping our functional component.
// Actually, vi.mock does not need Turnstile to be a vi.fn if we don't spy on it directly in the same way,
// but the test uses `const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];`
// So Turnstile MUST be a vi.fn() that returns JSX.
vi.mock('@marsidev/react-turnstile', () => {
  const React = require('react');
  const TurnstileMock = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      reset: vi.fn(),
    }));
    return <div data-testid="turnstile-widget" />;
  });
  // If we wrap forwardRef in vi.fn, React might not like it because it's an object with $$typeof, not a function.
  // Oh! forwardRef returns an object, not a function.
  // vi.fn() requires a function! That's why it throws.

  // We can just make Turnstile a mock function that renders TurnstileMock and captures props.
  return {
    Turnstile: vi.fn((props) => <TurnstileMock {...props} />)
  };
});

vi.mock('./turnstile-config', () => ({
  TURNSTILE_SITE_KEY: 'test-site-key'
}));

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
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const submitButton = screen.getByRole('button', { name: 'Send' });
    expect(submitButton).toBeDisabled();

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMockProps.onSuccess('valid-token');
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
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMockProps.onSuccess('valid-token');
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());

    act(() => {
      turnstileMockProps.onExpire();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled());
    expect(screen.queryByDisplayValue('valid-token')).not.toBeInTheDocument();
    expect(screen.getByText('Security check loading, please wait a moment.')).toBeInTheDocument();
  });

  it('shows an error state when the Turnstile script fails to load', async () => {
    render(
      <form>
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];
    expect(turnstileMockProps.scriptOptions?.onError).toEqual(expect.any(Function));

    act(() => {
      turnstileMockProps.scriptOptions.onError();
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

  it('shows an error state when the client integration fails', async () => {
    render(
      <form>
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMockProps.onError();
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

  it('clears the token and resets the widget on timeout', async () => {
    render(
      <form>
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMockProps.onSuccess('valid-token');
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());

    act(() => {
      turnstileMockProps.onTimeout();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled());
    expect(screen.queryByDisplayValue('valid-token')).not.toBeInTheDocument();
    expect(screen.getByText('Security check loading, please wait a moment.')).toBeInTheDocument();
  });

  it('shows an error state when the browser is unsupported', async () => {
    render(
      <form>
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMockProps.onUnsupported();
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

  it('allows retrying after an error', async () => {
    render(
      <form>
        <TurnstileField submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const turnstileMockProps = vi.mocked(Turnstile).mock.calls[0][0];

    act(() => {
      turnstileMockProps.onError();
    });

    await waitFor(() =>
      expect(screen.getByText('The security check had a problem. Please use Troubleshoot or refresh, then try again.')).toBeInTheDocument()
    );

    const retryBtn = screen.getByRole('button', { name: /Retry/i });

    act(() => {
      retryBtn.click();
    });

    await waitFor(() =>
      expect(screen.getByText('Security check loading, please wait a moment.')).toBeInTheDocument()
    );
    expect(screen.queryByText('The security check had a problem. Please use Troubleshoot or refresh, then try again.')).not.toBeInTheDocument();
  });

});

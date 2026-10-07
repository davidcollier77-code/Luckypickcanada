// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./turnstile-loader', () => ({
  loadTurnstile: vi.fn(),
}));

import TurnstileField from './turnstile-field';
import { loadTurnstile } from './turnstile-loader';

describe('TurnstileField', () => {
  let turnstile;

  beforeEach(() => {
    turnstile = {
      render: vi.fn(() => 'widget-1'),
      reset: vi.fn(),
      remove: vi.fn(),
    };
    vi.mocked(loadTurnstile).mockResolvedValue(turnstile);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps the submit button disabled until a valid token is returned', async () => {
    render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    const submitButton = screen.getByRole('button', { name: 'Send' });

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));
    expect(submitButton).toBeDisabled();

    const options = turnstile.render.mock.calls[0][1];

    act(() => {
      options.callback('valid-token');
    });

    await waitFor(() => expect(submitButton).toBeEnabled());
    expect(screen.getByDisplayValue('valid-token')).toHaveAttribute(
      'name',
      'cf-turnstile-response',
    );
    expect(screen.getByText('Security check verified.')).toBeInTheDocument();
  });

  it('clears the token on expiry and resets a timed-out widget', async () => {
    render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));

    const options = turnstile.render.mock.calls[0][1];

    act(() => {
      options.callback('valid-token');
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());

    act(() => {
      options['expired-callback']();
      options['timeout-callback']();
    });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled());
    expect(screen.queryByDisplayValue('valid-token')).not.toBeInTheDocument();
    expect(turnstile.reset).toHaveBeenCalledWith('widget-1');
  });

  it('shows an error state when the client integration fails', async () => {
    vi.mocked(loadTurnstile).mockRejectedValueOnce(new Error('network'));

    render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          'The security check had a problem. Please use Troubleshoot or refresh, then try again.',
        ),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('removes the widget when the component unmounts', async () => {
    const { unmount } = render(
      <form>
        <TurnstileField siteKey="site-key" submitButtonId="submit" />
        <button id="submit" type="submit">Send</button>
      </form>,
    );

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));

    unmount();

    expect(turnstile.remove).toHaveBeenCalledWith('widget-1');
  });
});

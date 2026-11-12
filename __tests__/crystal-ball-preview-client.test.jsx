import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import CrystalBallPreviewClient from '../app/crystal-ball-client/CrystalBallPreviewClient';
import { DAILY_STORAGE_KEY } from '../app/crystal-ball-client/daily-usage';

vi.mock('howler', () => ({
  Howler: { unload: vi.fn(), volume: vi.fn() },
  Howl: vi.fn().mockImplementation(function MockHowl() {
    this.play = vi.fn();
    this.pause = vi.fn();
    this.stop = vi.fn();
    this.volume = vi.fn();
    this.unload = vi.fn();
    this.playing = vi.fn(() => false);
    this.state = vi.fn(() => 'loaded');
  }),
}));

describe('Crystal Ball preview client', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(
      {},
      '',
      '/crystal-ball/preview?previewDate=2026-12-24&previewTime=20:30',
    );

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    global.fetch = vi.fn(async (_url, options) => {
      const body = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          reading:
            body.mode === 'fortune'
              ? 'A preview fortune for Christmas Eve.'
              : 'A preview follow-up answer.',
        }),
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the selected local moment without touching the real daily allowance', async () => {
    render(<CrystalBallPreviewClient />);

    await waitFor(() => {
      expect(screen.getByLabelText('Local date')).toHaveValue('2026-12-24');
    });

    expect(screen.getByLabelText('Local time')).toHaveValue('20:30');
    expect(screen.getByText('Preview mode — daily allowance bypassed')).toBeInTheDocument();
    expect(screen.getByText(/Previewing/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('crystal-ball-greeting')).toHaveTextContent('Good evening.');
    });

    expect(localStorage.getItem(DAILY_STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Generate My Fortune/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/oracle');
    expect(JSON.parse(options.body)).toMatchObject({
      mode: 'fortune',
      localDate: '2026-12-24',
      localTime: '20:30',
    });

    await waitFor(() => {
      expect(screen.getAllByText(/A preview fortune for Christmas Eve\./).length).toBeGreaterThan(0);
    });

    expect(localStorage.getItem(DAILY_STORAGE_KEY)).toBeNull();
  });
});

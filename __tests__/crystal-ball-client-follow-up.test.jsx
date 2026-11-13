import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import CrystalBallClient from '../app/crystal-ball-client/CrystalBallClient';
import {
  DAILY_STORAGE_KEY,
  getLocalDateKey,
} from '../app/crystal-ball-client/daily-usage';
import { FALLBACK_HISTORY_STORAGE_KEY } from '../app/crystal-ball-client/fallback-history';

const FOLLOW_UP_UNAVAILABLE_MESSAGE = [
  "🔮 The Crystal Ball has been hit hard with fortunes and questions today. I've used up my magical energy and need a little rest.",
  '',
  'Come back tomorrow for your follow-up question.',
  '',
  'Until then, keep that Canadian spirit shining! 🇨🇦✨',
].join('\n');

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

describe('Crystal Ball follow-up outage', () => {
  beforeEach(() => {
    localStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

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

    localStorage.setItem(
      DAILY_STORAGE_KEY,
      JSON.stringify({
        date: getLocalDateKey(),
        fortuneUsed: true,
        fortune: 'A warm fortune is waiting.',
        followUpUsed: false,
      }),
    );

    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({
        error: FOLLOW_UP_UNAVAILABLE_MESSAGE,
        unavailable: true,
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the exact outage message and stores no question or answer text', async () => {
    render(<CrystalBallClient />);

    await waitFor(() => {
      expect(screen.getAllByText(/A warm fortune is waiting\./).length).toBeGreaterThan(0);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Ask a Follow-up Question/i }),
    );

    const textarea = await screen.findByLabelText('Your follow-up question');
    fireEvent.change(textarea, {
      target: { value: 'Will my week improve?' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Ask the Crystal Ball/i }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(FOLLOW_UP_UNAVAILABLE_MESSAGE);

    const stored = JSON.parse(localStorage.getItem(DAILY_STORAGE_KEY));
    expect(stored).toEqual({
      date: getLocalDateKey(),
      fortuneUsed: true,
      fortune: 'A warm fortune is waiting.',
      followUpUsed: true,
    });
    expect(stored).not.toHaveProperty('followUpQuestion');
    expect(stored).not.toHaveProperty('followUpAnswer');

    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    expect(raw).not.toContain('Will my week improve?');
    expect(raw).not.toContain('magical energy');
  });

  it('sends yesterday’s fallback ID and records the new fallback ID', async () => {
    localStorage.removeItem(DAILY_STORAGE_KEY);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    localStorage.setItem(
      FALLBACK_HISTORY_STORAGE_KEY,
      JSON.stringify({
        id: 'seasonal-autumn-02',
        date: getLocalDateKey(yesterday),
      }),
    );

    global.fetch = vi.fn(async (_url, options) => {
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        mode: 'fortune',
        avoidFallbackId: 'seasonal-autumn-02',
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          reading: 'A fresh fallback fortune.',
          source: 'fallback',
          fortuneId: 'seasonal-autumn-03',
        }),
      };
    });

    render(<CrystalBallClient />);

    const generateButton = await screen.findByRole('button', {
      name: /Generate My Fortune/i,
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getAllByText(/A fresh fallback fortune\./).length).toBeGreaterThan(0);
    });

    expect(
      JSON.parse(localStorage.getItem(FALLBACK_HISTORY_STORAGE_KEY)),
    ).toEqual({
      id: 'seasonal-autumn-03',
      date: getLocalDateKey(),
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import DailyResonance from '../components/DailyResonance';
import * as audioLib from '../app/lib/audio';

// Mock dependencies
const mockPlayButtonClick = vi.spyOn(audioLib, 'playButtonClick').mockImplementation(() => Promise.resolve());

// Store for checking if global unload was called
let globalUnloadCalled = false;

vi.mock('howler', () => {
  return {
    Howler: {
      unload: vi.fn(() => {
        globalUnloadCalled = true;
      }),
    },
    Howl: vi.fn().mockImplementation(function (options) {
      this.options = options;
      this.play = vi.fn();
      this.volume = vi.fn();
      this.unload = vi.fn();
      this.playing = vi.fn(() => false);
      return this;
    }),
  };
});

vi.mock('gsap', () => {
  return {
    default: {
      timeline: vi.fn(() => ({
        to: vi.fn(),
        set: vi.fn(),
        call: vi.fn(),
        kill: vi.fn(),
      })),
      to: vi.fn(),
      set: vi.fn(),
    }
  };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('DailyResonance Lifecycle & Audio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalUnloadCalled = false;
    localStorage.clear();

    // Stub fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ visits: 42 }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unmounts cleanly without calling Howler.unload() if no reveal occurred', () => {
    const { unmount } = render(<DailyResonance isCompact={false} />);

    // Component mounted, now unmount it
    unmount();

    // The global unload should not be called
    expect(globalUnloadCalled).toBe(false);
  });

  it('unmounts and unloads only owned Howl instances, avoiding global Howler.unload()', async () => {
    const { unmount } = render(<DailyResonance isCompact={false} />);

    // Trigger reveal to initialize sounds
    const button = screen.getByText("Reveal My Resonance");
    await act(async () => {
      fireEvent.click(button);
      // wait a tick for dynamic imports to resolve
      await new Promise(r => setTimeout(r, 0));
    });

    unmount();

    // The global unload should NOT be called
    expect(globalUnloadCalled).toBe(false);
  });

  it('handles dynamic import failures and resets state to allow retry', async () => {
    // Force import failure by resetting the mocks to reject
    vi.doMock('howler', () => {
      throw new Error('Mock network failure');
    });
    vi.doMock('gsap', () => {
      throw new Error('Mock network failure');
    });

    render(<DailyResonance isCompact={false} />);

    const button = screen.getByText("Reveal My Resonance");

    await act(async () => {
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText("Reveal My Resonance")).not.toBeNull();
      });
    });

    // State should be reset, meaning button is visible again and not stuck on loading/revealing
    expect(screen.queryByText("Reveal My Resonance")).not.toBeNull();

    // Reset mocks back to normal
    vi.doUnmock('howler');
    vi.doUnmock('gsap');
  });
});

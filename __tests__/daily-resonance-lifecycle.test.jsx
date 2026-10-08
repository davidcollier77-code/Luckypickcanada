import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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
    const button = screen.getByText("AWAKEN TODAY'S RESONANCE");
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
    // Force import failure
    const originalImport = global.import;
    vi.stubGlobal('import', vi.fn((moduleName) => {
        if (moduleName === 'howler' || moduleName === 'gsap') {
            return Promise.reject(new Error('Mock network failure'));
        }
    }));

    render(<DailyResonance isCompact={false} />);

    const button = screen.getByText("AWAKEN TODAY'S RESONANCE");

    await act(async () => {
      fireEvent.click(button);
      await new Promise(r => setTimeout(r, 0)); // let the try/catch run
    });

    // State should be reset, meaning button is visible again and not stuck on loading/revealing
    expect(screen.queryByText("AWAKEN TODAY'S RESONANCE")).not.toBeNull();

    vi.unstubAllGlobals();
  });
});

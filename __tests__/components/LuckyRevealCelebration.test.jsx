import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LuckyRevealCelebration from '../../app/lucky-reveal-celebration';

/**
 * Behavioural guard for `specs/076-lucky-reveal-celebration-image-optimization`.
 *
 * A browser is unavailable in this environment, so the burst is exercised through
 * a stubbed particle library: the celebration must wait for the final number, play
 * the already-preloaded confetti pop as it fires, launch from both edges with the
 * shared leaf shape, render the settled-leaf finish, and skip all of it for
 * reduced-motion visitors.
 */

const audio = vi.hoisted(() => ({
  preloadConfettiPop: vi.fn(() => Promise.resolve()),
  playConfettiPop: vi.fn(() => Promise.resolve()),
}));

const fired = vi.hoisted(() => []);

vi.mock('../../app/lib/audio', () => ({
  preloadConfettiPop: audio.preloadConfettiPop,
  playConfettiPop: audio.playConfettiPop,
  playButtonClick: vi.fn(),
}));

vi.mock('../../app/lib/mapleLeafConfetti', () => ({
  MAPLE_LEAF_PATH: 'm-90 2030 45-863z',
  MAPLE_LEAF_MATRIX: [1, 0, 0, 1, 0, 0],
  createMapleLeafShape: vi.fn(() => ({ mapleLeaf: true })),
  loadConfetti: vi.fn(() =>
    Promise.resolve({
      // canvas-confetti returns a callable instance with reset(); mirror that so
      // the cleanup path is exercised exactly as it runs in the browser.
      create: () =>
        Object.assign(
          (options) => {
            fired.push(options);
          },
          { reset: vi.fn() },
        ),
    }),
  ),
}));

function setReducedMotion(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('LuckyRevealCelebration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fired.length = 0;
    audio.preloadConfettiPop.mockClear();
    audio.playConfettiPop.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('waits for the final number and preloads the homepage confetti pop', async () => {
    setReducedMotion(false);

    const { container } = render(<LuckyRevealCelebration startDelayMs={4700} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4699);
    });

    expect(container.querySelector('.lucky-celebration')).toBeNull();
    expect(audio.preloadConfettiPop).toHaveBeenCalled();
    expect(audio.playConfettiPop).not.toHaveBeenCalled();
    expect(fired).toHaveLength(0);
  });

  it('bursts from both sides, plays the pop, and renders the settled finish', async () => {
    setReducedMotion(false);

    const { container } = render(<LuckyRevealCelebration startDelayMs={4700} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4700);
    });
    // The waves are now scheduled rather than fired in one tick.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(audio.playConfettiPop).toHaveBeenCalledTimes(1);
    expect(fired).toHaveLength(5);
    expect(fired.reduce((total, options) => total + options.particleCount, 0)).toBeLessThanOrEqual(
      96,
    );

    const origins = fired.map((options) => options.origin?.x);
    expect(origins).toContain(0);
    expect(origins).toContain(1);
    for (const options of fired) {
      expect(options.shapes).toEqual([{ mapleLeaf: true }]);
      expect(options.colors).toEqual(['#FBBF24', '#F59E0B', '#D97706']);
    }

    expect(container.querySelector('.lucky-celebration')).not.toBeNull();
    expect(container.querySelector('.lucky-celebration-flash')).not.toBeNull();
    expect(container.querySelector('.lucky-celebration-glow')).not.toBeNull();
    // A layered pile, not an even row.
    expect(container.querySelectorAll('.lucky-settled-leaf')).toHaveLength(18);
    // The canvas lives inside the reveal, not on <body>.
    expect(container.querySelectorAll('canvas')).toHaveLength(1);
    expect(document.querySelectorAll('body > canvas')).toHaveLength(0);
  });

  it('shows the static finish without burst, sparkle, or sound for reduced motion', async () => {
    setReducedMotion(true);

    const { container } = render(<LuckyRevealCelebration startDelayMs={4700} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4700);
    });

    expect(audio.playConfettiPop).not.toHaveBeenCalled();
    expect(fired).toHaveLength(0);
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
    expect(container.querySelectorAll('.lucky-settled-leaf')).toHaveLength(18);
  });

  it('removes the particle canvas when the reveal closes', async () => {
    setReducedMotion(false);

    const { container, unmount } = render(<LuckyRevealCelebration startDelayMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(container.querySelectorAll('canvas')).toHaveLength(1);

    unmount();
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
  });

  it('removes the layer and canvas when the celebration finishes', async () => {
    setReducedMotion(false);

    const { container } = render(<LuckyRevealCelebration startDelayMs={1000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(container.querySelector('.lucky-celebration')).not.toBeNull();
    expect(container.querySelector('.lucky-celebration-particles')).not.toBeNull();

    // 3500 ms of confetti plus the fade, then the layer unmounts.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4300);
    });

    expect(container.querySelector('.lucky-celebration')).toBeNull();
    expect(container.querySelector('.lucky-celebration-particles')).toBeNull();
    expect(container.querySelectorAll('canvas')).toHaveLength(0);
  });
});

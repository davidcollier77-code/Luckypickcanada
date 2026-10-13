'use client';

import confetti from 'canvas-confetti';
import { playMagicalChime, preloadMagicalChime } from '../lib/audio';

import { useState, useCallback, useEffect, useRef } from 'react';
let mapleLeafShape = null;

// Same golden maple-leaf outline used by public/images/maple-leaf.svg.
// The fixed transform keeps the path at a regular confetti-particle size.
const MAPLE_LEAF_PATH = 'm-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27L0-2000l332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z';
const MAPLE_LEAF_MATRIX = [0.0025, 0, 0, 0.0025, 0, 0];

function getMapleLeafShape() {
  if (mapleLeafShape) return mapleLeafShape;
  if (typeof confetti.shapeFromPath !== 'function') return null;

  try {
    mapleLeafShape = confetti.shapeFromPath({
      path: MAPLE_LEAF_PATH,
      matrix: MAPLE_LEAF_MATRIX,
    });
  } catch {
    // Browsers without Path2D/DOMMatrix keep using the visible gold fallback.
    return null;
  }

  return mapleLeafShape;
}

const COOLDOWN_MS = 15_000;
const SCROLL_DURATION = 1_500;
const SCROLL_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  ' ',
]);

export default function ExploreLuckButton() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
    const isAnimatingRef = useRef(false);
  const isCoolingDownRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const interruptCleanupRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    setIsHydrated(true);

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Load the sound before activation so playback can start on the tap.
    preloadMagicalChime().catch((error) => {
      console.warn('Magical chime preload failed', error);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      interruptCleanupRef.current?.();
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const activateExplore = useCallback(() => {
    if (isAnimatingRef.current || isCoolingDownRef.current) return;

    const luckyMeter = document.getElementById('play-explore');
    if (!luckyMeter) return;

    // Set cooldown immediately after confirming activation is valid
    isCoolingDownRef.current = true;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
    cooldownTimeoutRef.current = setTimeout(() => {
      isCoolingDownRef.current = false;
      cooldownTimeoutRef.current = null;
    }, COOLDOWN_MS);

    if (prefersReducedMotion) {
      luckyMeter.scrollIntoView({ behavior: 'auto' });
      return;
    }

    isAnimatingRef.current = true;

    // Trigger magical chime
    playMagicalChime().catch(err => console.error("Audio playback failed", err));

    // Magical Golden Confetti Burst
    const count = 72;

    const fireConfetti = () => {
      // Find the button element by traversing up or querying
      const btn = document.querySelector('.homepage-hero-welcome button[aria-label^="Explore your luck"]');
      let originY = 0.9;
      let originX = 0.5;

      if (btn) {
        const btnRect = btn.getBoundingClientRect();
        // Fire from the center of the button, relative to viewport
        originY = Math.min((btnRect.top + btnRect.height / 2) / window.innerHeight, 1);
        originX = (btnRect.left + btnRect.width / 2) / window.innerWidth;
      } else {
        // Fallback to luckyMeter element's relative position if button can't be found
        const lmRect = luckyMeter.getBoundingClientRect();
        originY = Math.min(Math.max((lmRect.top - window.innerHeight / 2) / window.innerHeight, 0), 0.9);
      }

      const leafShape = getMapleLeafShape();
      const defaults = {
        origin: { x: originX, y: originY },
        colors: ['#FBBF24', '#F59E0B', '#D97706'], // Amber, Yellow, Gold
        shapes: leafShape ? [leafShape] : ['star', 'circle'],
        zIndex: 100,
        ticks: 200,
        gravity: 1.2,
        scalar: 1.8,
      };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 40,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 70,
      });
      fire(0.35, {
        spread: 110,
        decay: 0.91,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 130,
        startVelocity: 35,
        decay: 0.92,
        scalar: 1.8
      });
      fire(0.1, {
        spread: 130,
        startVelocity: 45,
      });
    };

    // Fire immediately: no image request may delay the particles until after scrolling.
    fireConfetti();

    // Calculate the current scroll target and distance.
    const startY = window.scrollY;
    const rect = luckyMeter.getBoundingClientRect();
    const targetY = startY + rect.top;
    const distance = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = (progress) => progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const removeInterruptListeners = () => {
      window.removeEventListener('wheel', handleUserInterrupt);
      window.removeEventListener('touchstart', handleUserInterrupt);
      window.removeEventListener('touchmove', handleUserInterrupt);
      window.removeEventListener('keydown', handleUserInterrupt);
      if (interruptCleanupRef.current === removeInterruptListeners) {
        interruptCleanupRef.current = null;
      }
    };

    const cancelForUser = () => {
      if (!isAnimatingRef.current) return;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      isAnimatingRef.current = false;
            removeInterruptListeners();
    };

    const handleUserInterrupt = (event) => {
      if (event.type === 'keydown' && !SCROLL_KEYS.has(event.key)) return;
      cancelForUser();
    };

    window.addEventListener('wheel', handleUserInterrupt, { passive: true });
    window.addEventListener('touchstart', handleUserInterrupt, { passive: true });
    window.addEventListener('touchmove', handleUserInterrupt, { passive: true });
    window.addEventListener('keydown', handleUserInterrupt);
    interruptCleanupRef.current = removeInterruptListeners;

    const scrollStep = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION, 1);
      const easedProgress = easeInOutCubic(progress);

      // Use explicit instant per-frame scrolling so the global smooth-scroll CSS cannot
      // restart a native animation on every animation frame.
      window.scrollTo({
        top: startY + distance * easedProgress,
        behavior: 'instant',
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(scrollStep);
      } else {
        isAnimatingRef.current = false;
        animationFrameRef.current = null;
        removeInterruptListeners();
      }
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);
  }, [prefersReducedMotion]);

  const handleClick = useCallback(() => {
    activateExplore();
  }, [activateExplore]);

  const handlePointerDown = useCallback((event) => {
    // Mouse and keyboard activation use the native click path. Touch and pen
    // activation occurs from pointerup so the compatibility click is suppressed.
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      event.preventDefault();
    }
  }, []);

  const handlePointerUp = useCallback((event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    activateExplore();
  }, [activateExplore]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex h-[30%] min-h-24 max-h-[300px] items-end justify-center">
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="pointer-events-auto h-full w-full max-w-[min(32rem,90vw)] cursor-pointer appearance-none touch-manipulation select-none rounded-xl border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        aria-label="Explore your luck. Scroll down to the Play and Explore section."
        data-hydrated={isHydrated ? 'true' : 'false'}
      >
        <span className="sr-only">Explore your luck</span>
      </button>
    </div>
  );
}

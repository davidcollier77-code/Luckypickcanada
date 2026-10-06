'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

const COOLDOWN_MS = 10_000;
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
  const [particles, setParticles] = useState([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const particleIdCounter = useRef(0);
  const isAnimatingRef = useRef(false);
  const isCoolingDownRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);
  const interruptCleanupRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
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

    const newParticles = [];

    // Generate exactly 6 leaves.
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 90 + 90; // 90-180px
      newParticles.push({
        id: `leaf-${particleIdCounter.current++}`,
        type: 'leaf',
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 70, // bias downwards
        rotation: Math.random() * 360,
        scale: Math.random() * 0.4 + 0.6,
        duration: SCROLL_DURATION / 1000,
      });
    }

    // Generate exactly 12 confetti pieces.
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 100 + 80; // 80-180px
      newParticles.push({
        id: `confetti-${particleIdCounter.current++}`,
        type: 'confetti',
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 90, // bias downwards more
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        duration: SCROLL_DURATION / 1000,
      });
    }

    setParticles(newParticles);

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
      setParticles([]);
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
        setParticles([]);
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
        aria-label="Explore your luck. Scroll down to the Lucky Meter."
      >
        <span className="sr-only">Explore your luck</span>
      </button>

      {/* Particles Container */}
      <div className="absolute top-[80%] left-1/2 pointer-events-none overflow-visible">
        {particles.map((particle) => {
          if (particle.type === 'leaf') {
            return (
              <div
                key={particle.id}
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 animate-magic-burst"
                style={{
                  '--tx': `${particle.x}px`,
                  '--ty': `${particle.y}px`,
                  '--r': `${particle.rotation}deg`,
                  '--s': particle.scale,
                  animationDuration: `${particle.duration}s`,
                }}
              >
                <Image
                  src="/BackgroundEraser_20260724_163638777.png"
                  alt=""
                  width={24}
                  height={24}
                  className="object-contain drop-shadow-md"
                />
              </div>
            );
          }

          return (
            <div
              key={particle.id}
              className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-gradient-to-br from-yellow-300 to-amber-500 animate-magic-burst shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              style={{
                '--tx': `${particle.x}px`,
                '--ty': `${particle.y}px`,
                '--r': `${particle.rotation}deg`,
                '--s': particle.scale,
                animationDuration: `${particle.duration}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

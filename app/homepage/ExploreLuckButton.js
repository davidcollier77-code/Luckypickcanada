'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ExploreLuckButton() {
  const [particles, setParticles] = useState([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const particleIdCounter = useRef(0);
    const isAnimatingRef = useRef(false);
  const isCoolingDownRef = useRef(false);
  const cooldownTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);



  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);


const activateExplore = useCallback(() => {
    if (isAnimatingRef.current || isCoolingDownRef.current) return;

    isCoolingDownRef.current = true;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
    cooldownTimeoutRef.current = setTimeout(() => {
      isCoolingDownRef.current = false;
    }, 10000); // 10 second cooldown

    const luckyMeter = document.getElementById('lucky-meter');
    if (!luckyMeter) return;

    if (prefersReducedMotion) {
      luckyMeter.scrollIntoView({ behavior: 'auto' });
      return;
    }

    isAnimatingRef.current = true;

    const newParticles = [];
    const SCROLL_DURATION = 1200; // ms
    const durationInSeconds = SCROLL_DURATION / 1000;

    // Generate exactly 6 Leaves
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 80 + 70; // 70-150px (increased distance)
      newParticles.push({
        id: `leaf-${particleIdCounter.current++}`,
        type: 'leaf',
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 60, // bias downwards
        rotation: Math.random() * 360,
        scale: Math.random() * 0.4 + 0.6,
        duration: durationInSeconds
      });
    }

    // Generate exactly 12 Confetti
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 90 + 60; // 60-150px (increased distance)
      newParticles.push({
        id: `confetti-${particleIdCounter.current++}`,
        type: 'confetti',
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 80, // bias downwards more
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        duration: durationInSeconds
      });
    }

    setParticles(newParticles); // Replaces any existing particles immediately

    // Calculate scroll target and distance
    const startY = window.scrollY;
    const rect = luckyMeter.getBoundingClientRect();
    const targetY = startY + rect.top;
    const distance = targetY - startY;
    const startTime = performance.now();

    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const scrollStep = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION, 1);
      const easedProgress = easeOutQuart(progress);

      window.scrollTo(0, startY + distance * easedProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(scrollStep);
      } else {
        // Scroll exactly finished, clean up particles
        setParticles([]);
        isAnimatingRef.current = false;
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

  }, [prefersReducedMotion]);

  const handleClick = useCallback(() => {
    // Mouse and keyboard activation use the native click path.
    activateExplore();
  }, [activateExplore]);

  const handlePointerDown = useCallback((event) => {
    // Cancel the browser's compatibility click for touch/pen input because
    // pointerup performs the activation directly.
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
        {particles.map((p) => {
          if (p.type === 'leaf') {
            return (
              <div
                key={p.id}
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 animate-magic-burst"
                style={{
                  '--tx': `${p.x}px`,
                  '--ty': `${p.y}px`,
                  '--r': `${p.rotation}deg`,
                  '--s': p.scale,
                  animationDuration: `${p.duration}s`
                }}
              >
                <Image src="/BackgroundEraser_20260724_163638777.png" alt="" width={24} height={24} className="object-contain drop-shadow-md" />
              </div>
            );
          } else {
            return (
              <div
                key={p.id}
                className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-gradient-to-br from-yellow-300 to-amber-500 animate-magic-burst shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                style={{
                  '--tx': `${p.x}px`,
                  '--ty': `${p.y}px`,
                  '--r': `${p.rotation}deg`,
                  '--s': p.scale,
                  animationDuration: `${p.duration}s`
                }}
              />
            );
          }
        })}
      </div>
    </div>
  );
}

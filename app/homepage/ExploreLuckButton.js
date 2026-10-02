'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ExploreLuckButton() {
  const [particles, setParticles] = useState([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const particleIdCounter = useRef(0);
  const timeoutsRef = useRef(new Set());
  const isAnimatingRef = useRef(false);
  const lastTouchActivationRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, []);

  const activateExplore = useCallback(() => {
    if (isAnimatingRef.current) return;

    if (prefersReducedMotion) {
      const luckyMeter = document.getElementById('lucky-meter');
      if (luckyMeter) {
        luckyMeter.scrollIntoView({ behavior: 'auto' });
      }
      return;
    }

    isAnimatingRef.current = true;

    const newParticles = [];

    // Generate Leaves
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 60 + 50; // 50-110px
      newParticles.push({
        id: `leaf-${particleIdCounter.current++}`,
        type: 'leaf',
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 50, // bias downwards
        rotation: Math.random() * 360,
        scale: Math.random() * 0.4 + 0.6,
        duration: Math.random() * 0.3 + 0.9 // 0.9 - 1.2s
      });
    }

    // Generate Confetti
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 70 + 40; // 40-110px
      newParticles.push({
        id: `confetti-${particleIdCounter.current++}`,
        type: 'confetti',
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity + 70, // bias downwards more
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        duration: Math.random() * 0.4 + 0.8 // 0.8 - 1.2s
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Cleanup after max duration
    const timerId = setTimeout(() => {
      timeoutsRef.current.delete(timerId);
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      isAnimatingRef.current = false;

      // Re-query after the animation so a replaced Lucky Meter element is still targeted.
      const luckyMeter = document.getElementById('lucky-meter');
      if (luckyMeter) {
        luckyMeter.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1250);
    timeoutsRef.current.add(timerId);
  }, [prefersReducedMotion]);

  const handleClick = useCallback(() => {
    // Touch devices fire a synthetic click after pointerup. The pointer path below
    // handles the activation directly, so ignore that follow-up click.
    if (Date.now() - lastTouchActivationRef.current < 1000) return;
    activateExplore();
  }, [activateExplore]);

  const handlePointerUp = useCallback((event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;

    event.preventDefault();
    lastTouchActivationRef.current = Date.now();
    activateExplore();
  }, [activateExplore]);

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex h-[30%] min-h-24 max-h-40 items-end justify-center">
      <button
        type="button"
        onClick={handleClick}
        onPointerUp={handlePointerUp}
        className="h-full w-full max-w-[min(32rem,90vw)] cursor-pointer appearance-none touch-manipulation select-none rounded-xl border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
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

'use client'

import { useMemo } from 'react'

/**
 * A decorative starry aurora backdrop used behind the lucky reveal.
 * Pure CSS animation, respects prefers-reduced-motion, and is aria-hidden.
 */
export function AuroraReveal({ children }: { children: React.ReactNode }) {
  // Generate a stable set of stars so they don't jump on re-render.
  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 2.5 + 2,
        delay: Math.random() * 4,
      })),
    [],
  )

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Night sky base */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 120%, oklch(0.28 0.09 250) 0%, oklch(0.18 0.06 265) 45%, oklch(0.12 0.04 270) 100%)',
        }}
      />

      {/* Aurora bands */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="animate-aurora absolute -top-1/4 left-0 h-[80%] w-[140%] blur-2xl"
          style={{
            background:
              'linear-gradient(100deg, transparent 10%, oklch(0.72 0.16 155 / 0.55) 35%, oklch(0.78 0.15 190 / 0.5) 55%, transparent 85%)',
          }}
        />
        <div
          className="animate-aurora-slow absolute top-0 left-0 h-[85%] w-[140%] blur-2xl"
          style={{
            background:
              'linear-gradient(80deg, transparent 15%, oklch(0.7 0.17 300 / 0.4) 45%, oklch(0.75 0.18 340 / 0.35) 65%, transparent 90%)',
          }}
        />
      </div>

      {/* Stars */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="animate-twinkle absolute rounded-full bg-white"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              ['--twinkle-duration' as string]: `${s.duration}s`,
              ['--twinkle-delay' as string]: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Content sits above the sky */}
      <div className="relative">{children}</div>
    </div>
  )
}

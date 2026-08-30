'use client';

import { useEffect } from 'react';
import Image from 'next/image';

const heroLinks = [
  { href: '/lucky-meter', label: 'Lucky Meter' },
  { href: '/reveal', label: "Today's Lucky Moment" },
  { href: '#community-map', label: 'Community Map' },
  { href: '#crystal-ball', label: 'Crystal Ball' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {

  return (
    <header className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 py-6 md:py-10 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950">

      {/* Layer 1 (Background): Full-bleed absolute container */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#020609]">
        {/* Full-Page Aurora Breathing Pulse */}
        <div className="absolute inset-0 pointer-events-none -z-10 animate-breathe-aurora opacity-25" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(24, 185, 120, 0.4) 0%, rgba(191, 139, 255, 0.2) 50%, transparent 80%)' }} />
      </div>

      {/* Layer 2 (UI Overlay): Relative container for all interactive elements */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-between">

        {/* Top Nav: Glassmorphism pill */}
        <nav className="w-full max-w-3xl mx-auto relative z-20 pointer-events-auto" aria-label="Primary navigation">
          <div className="backdrop-blur-xl bg-white/5 border border-white/20 md:border-amber-400/20 rounded-full px-4 py-3 flex items-center justify-around gap-2 md:gap-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {heroLinks.map(({ href, label, external }) => (
              <a
                key={href}
                href={href}
                className="pointer-events-auto text-[11px] sm:text-xs md:text-sm font-medium text-amber-50 hover:text-amber-200 transition-colors py-1 px-2 rounded-full hover:bg-white/5"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Center Content: Logo and Typography */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-10">

          {/* Logo with spark portal and drop shadow */}
          <div className="relative overflow-hidden w-48 h-48 md:w-56 md:h-56 mb-8 flex items-center justify-center pointer-events-none">
            {/* Spark Portal Glow - Radial (ambient only, no pulse/spin) */}
            <div className="absolute inset-[-20%] bg-radial-gradient from-amber-500/30 to-transparent blur-2xl rounded-full mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }}>
            </div>

            {/* Spark Portal Glow - Spinning Conic (ambient only, no pulse/spin) */}
            <div className="absolute inset-[-10%] bg-conic-gradient from-amber-300/0 via-amber-400/20 to-amber-300/0 blur-xl rounded-full mix-blend-screen" style={{ backgroundImage: 'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.3) 180deg, transparent 360deg)' }}></div>

            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada Logo"
              width={224}
              height={224}
              className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
              priority
            />
            <span className="absolute inset-0 block w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20 animate-medallion-sheen mix-blend-overlay"></span>
          </div>

          {/* Top Subhead */}
          <p className="text-[#FFF0AC] text-[10px] sm:text-xs md:text-sm tracking-[0.25em] font-semibold uppercase max-w-lg mb-4 leading-relaxed px-2 drop-shadow-md">
            A LITTLE CANADIAN MAGIC MADE FOR TODAY — DISCOVER YOUR LUCK & SHARE THE MAGIC.
          </p>

          {/* Main Heading (3D Gold Typography) */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.0] my-2 text-gold-gradient drop-shadow-3d">
            Your daily<br />
            lucky<br />
            moment.
          </h1>

          {/* Bottom Subhead */}
          <p className="text-white text-sm md:text-base font-sans font-medium tracking-wide mt-6 mb-8 drop-shadow-md">
            A Canadian digital entertainment
          </p>
        </div>

      </div>
    </header>
  );
}

'use client';

import Image from 'next/image';

const heroLinks = [
  { href: '/lucky-meter', label: 'Lucky Meter' },
  { href: '#cards', label: 'Today’s Lucky Moment' },
  { href: '#community-map', label: 'Community Map' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {
  return (
    <header className="relative min-h-screen w-full flex flex-col items-center justify-between px-4 py-6 md:py-10 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950">

      {/* Layer 1 (Background): Full-bleed absolute container */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-background-high-def.jpg"
          layout="fill"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Layer 2 (UI Overlay): Relative container for all interactive elements */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-between">

        {/* Top Nav: Glassmorphism pill */}
        <nav className="w-full max-w-3xl mx-auto" aria-label="Primary navigation">
          <div className="backdrop-blur-xl bg-white/5 border border-white/20 md:border-amber-400/20 rounded-full px-4 py-3 flex items-center justify-around gap-2 md:gap-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {heroLinks.map(({ href, label, external }) => (
              <a
                key={href}
                href={href}
                className="text-[11px] sm:text-xs md:text-sm font-medium text-amber-50 hover:text-amber-200 transition-colors py-1 px-2 rounded-full hover:bg-white/5"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Center Content: Logo and Typography */}
        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-10">

          {/* Logo with drop shadow */}
          <div className="relative w-48 h-48 md:w-56 md:h-56 mb-8 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] flex items-center justify-center">
            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada Logo"
              width={224}
              height={224}
              className="object-contain"
              priority
            />
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
        </main>

        {/* CTA Button */}
        <div className="relative group mt-4">
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-amber-600 rounded-full blur-xl opacity-60 animate-pulse-glow"></div>

          <a
            href="/lucky-meter"
            className="cta-glow relative z-10 inline-flex items-center justify-center px-10 py-4 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 text-slate-950 font-black text-sm md:text-base tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.8)] transition-transform hover:scale-105 duration-300 active:scale-95"
          >
            REVEAL TODAY'S LUCK &gt;
          </a>
        </div>

      </div>
    </header>
  );
}

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
    <header className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden selection:bg-amber-500 selection:text-slate-950">

      {/* Layer 1 (Background) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-background-high-def.jpg"
          alt="Hero background with starry sky, aurora borealis, and vortex of golden sparks"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Layer 2 (UI Overlay) */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-between px-4 py-6 md:py-10">

        {/* Navigation Bar (Glassmorphism) */}
        <nav className="w-full max-w-3xl mx-auto" aria-label="Primary navigation">
          <div className="backdrop-blur-md bg-white/5 border border-amber-400/20 rounded-full px-4 py-2.5 shadow-lg flex items-center justify-around gap-1 md:gap-4 text-center">
            {heroLinks.map(({ href, label, external }) => (
              <a
                key={href}
                href={href}
                className="text-[11px] sm:text-xs md:text-sm font-medium text-amber-100/90 hover:text-amber-300 transition-colors py-1 px-2 rounded-full hover:bg-white/10"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        {/* Main Content (Center) */}
        <main className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto my-8">

          {/* Logo */}
          <div className="relative w-48 h-48 md:w-60 md:h-60 flex items-center justify-center mb-6">
            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada official logo"
              width={240}
              height={240}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          {/* Typography */}
          <p className="text-amber-100 text-[10px] sm:text-xs md:text-sm tracking-[0.3em] font-semibold uppercase max-w-lg mb-2 leading-relaxed px-2">
            A LITTLE CANADIAN MAGIC MADE FOR TODAY — DISCOVER YOUR LUCK &amp; SHARE THE MAGIC.
          </p>

          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.0] my-2 text-gold-gradient drop-shadow-3d">
            Your daily<br />
            lucky<br />
            moment.
          </h1>

          <p className="font-sans text-white text-sm md:text-base font-medium tracking-wide mt-4 mb-8">
            A Canadian digital entertainment
          </p>

          {/* Call to Action Button */}
          <a
            href="/lucky-meter"
            className="cta-glow group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 text-slate-950 font-black text-sm md:text-base tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:shadow-[0_0_50px_rgba(245,158,11,0.9)] animate-pulse-glow transition-transform hover:scale-105 duration-300 active:scale-95"
          >
            <span>REVEAL TODAY'S LUCK &gt;</span>
          </a>

        </main>
      </div>
    </header>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <header className="relative w-full flex flex-col items-center pt-0 mt-0 pb-2 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950">
      {/* Background layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none -z-10 animate-breathe-aurora opacity-25"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.8) 0%, rgba(139, 92, 246, 0.6) 50%, transparent 80%)',
          }}
        />
      </div>

      {/* Main Content Stack */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Navigation */}
        <nav
          className="w-full max-w-3xl mx-auto relative z-20 pointer-events-auto mt-0 mb-2 md:mb-3 px-4"
          aria-label="Primary navigation"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4 py-2 px-4 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-xs sm:text-sm font-medium">
            <Link
              href="/"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Home
            </Link>
            <span className="text-white/20">•</span>
            <Link
              href="/lucky-meter"
              className="text-white/80 hover:text-white transition-colors"
            >
              Lucky Meter
            </Link>
            <span className="text-white/20">•</span>
            <Link
              href="/reveal"
              className="text-white/80 hover:text-white transition-colors"
            >
              Today&apos;s Lucky Moment
            </Link>
          </div>
        </nav>

        {/* Hero Center Content */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mt-0 mb-2 px-4">
          {/* Logo with spark portal */}
          <div className="relative mb-1 flex items-center justify-center pointer-events-none">
            <div
              className="absolute inset-[-20%] blur-2xl rounded-full mix-blend-screen pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)',
              }}
            />
            <Image
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada Logo"
              width={130}
              height={130}
              className="object-cover object-center w-[130px] h-[130px] md:w-[160px] md:h-[160px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
              priority
            />
          </div>

          {/* Top Subhead */}
          <p className="text-[#FFF0AC] text-[10px] sm:text-xs md:text-sm tracking-[0.25em] font-semibold uppercase max-w-lg mb-2 leading-relaxed px-2 drop-shadow-lg [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            A LITTLE CANADIAN MAGIC MADE FOR TODAY — DISCOVER YOUR LUCK &amp; SHARE THE MAGIC.
          </p>

          {/* Main Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] my-1 text-gold-gradient drop-shadow-3d">
            Your daily<br /> lucky<br /> moment.
          </h1>

          {/* Bottom Subhead */}
          <p className="text-white text-xs sm:text-sm md:text-base font-sans font-medium tracking-wide mt-2 mb-2 drop-shadow-lg [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            A Canadian digital entertainment
          </p>
        </div>
      </div>
    </header>
  );
}

import Image from 'next/image';
import Link from 'next/link';

/**
 * Renders the homepage's primary navigation, logo, heading, and introduction.
 *
 * @returns {import('react').ReactElement} The homepage hero header.
 */
export default function Hero() {
  return (
    <header className="relative w-full flex flex-col items-center pt-0 mt-0 pb-0 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950 homepage-hero-welcome" style={{ minHeight: '100svh' }}>
      {/* Main Content Stack */}
      <div className="relative z-10 w-full min-h-[100svh] flex flex-col items-center">
        {/* Navigation */}
        <nav
          className="homepage-main-nav w-full max-w-3xl mx-auto relative z-20 pointer-events-auto mt-0 mb-2 md:mb-3 px-4"
          aria-label="Primary navigation"
        >
          <div className="homepage-main-nav-surface flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 md:gap-4 py-1.5 sm:py-2 px-3 sm:px-4 rounded-[2rem] sm:rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-[11px] sm:text-xs md:text-sm font-medium leading-tight">
            <Link
              href="/lucky-meter"
              className="text-amber-400 hover:text-amber-300 transition-colors"
            >
              Lucky Meter
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="#community-stories"
              className="text-white/80 hover:text-white transition-colors"
            >
              Community Stories
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/crystal-ball"
              className="text-white/80 hover:text-white transition-colors"
            >
              Consult the Crystal Ball
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/map"
              className="text-white/80 hover:text-white transition-colors"
            >
              Lucky Map
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/reveal"
              className="text-white/80 hover:text-white transition-colors"
            >
              Daily Card Reveal
            </Link>
          </div>
        </nav>

        {/* Hero Center Content */}
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mt-0 mb-0 px-4">
          {/* Logo with spark portal */}
          <div className="homepage-logo-stage relative mb-0 sm:mb-1 flex items-center justify-center pointer-events-none">
            {/* Polished Gold Emblem Ring */}
            <div
              className="absolute m-auto rounded-full z-0"
              style={{
                width: 'clamp(144px, 20vw, 178px)',
                height: 'clamp(144px, 20vw, 178px)',
                background: 'radial-gradient(circle at 35% 26%, #fff6ba 0%, #eec35d 22%, #9b6516 57%, #ffe69a 78%, #6d3c08 100%)',
                boxShadow: 'inset 0 0 12px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.8), 0 0 8px rgba(255,230,154,0.3)',
                border: '1px solid rgba(255, 246, 186, 0.5)',
              }}
              aria-hidden="true"
            />
            <div
              className="absolute m-auto rounded-full z-[5] bg-[#071811]"
              style={{
                width: 'clamp(130px, 18vw, 160px)',
                height: 'clamp(130px, 18vw, 160px)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)',
                border: '2px solid rgba(246, 215, 116, 0.4)',
              }}
              aria-hidden="true"
            />
            <Image
              className="homepage-logo object-cover object-center w-[130px] h-[130px] md:w-[160px] md:h-[160px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10"
              src="/BackgroundEraser_20260724_163638777.png"
              alt="Lucky Pick Canada Logo"
              width={130}
              height={130}
              priority
            />
          </div>

          {/* Top Subhead */}
          <p
            className="text-[#FFF5C3] text-[10px] sm:text-xs md:text-sm tracking-[0.25em] font-semibold uppercase max-w-lg mb-1 sm:mb-2 leading-relaxed px-3 py-1 rounded-sm"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 70%)',
            }}
          >
            A LITTLE CANADIAN MAGIC MADE FOR TODAY — DISCOVER YOUR LUCK &amp; SHARE THE MAGIC.
          </p>

          {/* Main Heading */}
          <h1
            className="homepage-hero-title font-serif text-[2rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight my-2"
            style={{
              color: '#f8d36f',
              backgroundImage: 'linear-gradient(170deg, #ffffff 0%, #fff6d9 10%, #f1c34a 35%, #a66a1a 50%, #f7d46c 65%, #fff0ad 85%, #d7942e 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              WebkitTextStroke: '0.75px rgba(89, 48, 7, 0.85)',
              filter: 'drop-shadow(0 2px 0 rgba(110, 60, 10, 0.95)) drop-shadow(0 3px 2px rgba(42, 20, 3, 0.9)) drop-shadow(0 10px 24px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 15px rgba(255, 207, 100, 0.25))',
            }}
          >
            Lucky Pick Canada:<br /> Your daily lucky<br /> moment.
          </h1>

          {/* Bottom Subhead */}
          <p className="text-white text-xs sm:text-sm md:text-base font-sans font-medium tracking-wide mt-3 mb-0 drop-shadow-lg [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            A Canadian digital entertainment experience made to bring a little luck and a little magic to your day.
          </p>
          </div>
        </div>

        {/* Welcome-to-experience transition */}
        <a
          href="#lucky-meter"
          className="homepage-hero-scroll-cue group mt-auto mb-5 sm:mb-7 md:mb-9 flex w-full max-w-xl flex-col items-center px-4 text-center no-underline"
          aria-label="Explore your luck"
        >
          <span className="flex w-full items-center gap-4" aria-hidden="true">
            <span
              className="h-px flex-1"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 213, 113, 0.25) 30%, rgba(255, 213, 113, 0.9) 100%)',
              }}
            />
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="leafGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#fff3bd" />
                  <stop offset="35%" stopColor="#f8d36f" />
                  <stop offset="65%" stopColor="#c98328" />
                  <stop offset="100%" stopColor="#9b6516" />
                </linearGradient>
                <filter id="leafGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#f8d36f" floodOpacity="0.4" />
                </filter>
              </defs>
              <path
                d="M12.000 21.000 L11.500 13.500 L8.000 15.000 L9.000 11.500 L5.000 11.500 L8.500 8.000 L7.500 4.000 L12.000 6.500 L16.500 4.000 L15.500 8.000 L19.000 11.500 L15.000 11.500 L16.000 15.000 L12.500 13.500 Z"
                fill="url(#leafGrad)"
                stroke="#ffe69a"
                strokeWidth="0.5"
                filter="url(#leafGlow)"
              />
            </svg>
            <span
              className="h-px flex-1"
              style={{
                background: 'linear-gradient(90deg, rgba(255, 213, 113, 0.9) 0%, rgba(255, 213, 113, 0.25) 70%, transparent 100%)',
              }}
            />
          </span>

          <span className="mt-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d56f] drop-shadow-[0_2px_8px_rgba(0,0,0,0.82)] transition-transform duration-300 group-hover:-translate-y-0.5">
            Explore your luck
          </span>

          <span className="mt-3 flex h-10 items-center justify-center text-[#f7d56f] drop-shadow-[0_0_14px_rgba(255,207,91,0.5)] transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true">
            <svg width="32" height="38" viewBox="0 0 32 38" fill="none">
              <path d="M5 9 16 20 27 9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 20 16 31 27 20" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </header>
  );
}

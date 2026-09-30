import Image from 'next/image';
import Link from 'next/link';

/**
 * Renders the homepage's primary navigation, logo, heading, and introduction.
 *
 * @returns {import('react').ReactElement} The homepage hero header.
 */
export default function Hero() {
  return (
    <header className="relative w-full flex flex-col items-center pt-0 mt-0 pb-0 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950">
      {/* Main Content Stack */}
      <div className="relative z-10 w-full flex flex-col items-center">
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
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mt-0 mb-0 px-4">
          {/* Logo with spark portal */}
          <div className="homepage-logo-stage relative mb-0 sm:mb-1 flex items-center justify-center pointer-events-none">
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
          <p className="text-[#FFF0AC] text-[10px] sm:text-xs md:text-sm tracking-[0.25em] font-semibold uppercase max-w-lg mb-1 sm:mb-2 leading-relaxed px-2 drop-shadow-lg [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            A LITTLE CANADIAN MAGIC MADE FOR TODAY — DISCOVER YOUR LUCK &amp; SHARE THE MAGIC.
          </p>

          {/* Main Heading */}
          <h1 className="homepage-hero-title font-serif text-[1.75rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight my-1 text-gold-gradient drop-shadow-3d">
            Lucky Pick Canada:<br /> Your daily lucky<br /> moment.
          </h1>

          {/* Bottom Subhead */}
          <p className="text-white text-xs sm:text-sm md:text-base font-sans font-medium tracking-wide mt-1 mb-2 drop-shadow-lg [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
            A Canadian digital entertainment experience made to bring a little luck and a little magic to your day.
          </p>
        </div>
      </div>
    </header>
  );
}

import { preload } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import ExploreLuckButton from './ExploreLuckButton';

/**
 * Renders the interactive homepage hero with primary navigation and the hero artwork.
 *
 * @returns {import('react').ReactElement} The homepage hero header.
 */
export default function Hero() {
  preload("/homepage-hero-lucky-pick-canada.webp", { as: "image", fetchPriority: "high" });
  return (
    <header className="relative w-full flex flex-col items-center pt-0 mt-0 pb-0 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950 homepage-hero-welcome" style={{ minHeight: '100svh' }}>
      {/* Main Content Stack */}
      <div className="relative z-10 w-full h-[100svh] min-h-0 flex flex-col items-center">
        {/* Navigation */}
        <nav
          className="homepage-main-nav w-full max-w-3xl mx-auto relative z-20 pointer-events-auto mt-0 mb-2 md:mb-3 px-4"
          aria-label="Primary navigation"
        >
          <div className="homepage-main-nav-surface flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 md:gap-4 py-1.5 sm:py-2 px-3 sm:px-4 rounded-[2rem] sm:rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-[11px] sm:text-xs md:text-sm font-medium leading-tight">
            <Link
              href="/lucky-meter"
              className="text-amber-400 hover:text-amber-300 transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Lucky Meter
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="#community-stories"
              className="text-white/80 hover:text-white transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Community Stories
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/crystal-ball"
              className="text-white/80 hover:text-white transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Consult the Crystal Ball
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/map"
              className="text-white/80 hover:text-white transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Lucky Map
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/reveal"
              className="text-white/80 hover:text-white transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Daily Card Reveal
            </Link>
          </div>
        </nav>

        {/* Hero Center Content */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center w-full max-w-[1100px] mx-auto mt-4 mb-4 px-4 sm:px-6 relative">
            <div className="relative w-full hero-image-container flex items-center justify-center pointer-events-none">
              <Image
                className="pointer-events-none object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)] relative z-10"
                src="/homepage-hero-lucky-pick-canada.webp"
                alt="Lucky Pick Canada Hero Composition"
                fill
                sizes="(max-width: 768px) 100vw, 1100px"
                priority
                fetchPriority="high"
              />
              <ExploreLuckButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

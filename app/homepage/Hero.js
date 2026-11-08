import "../../themes/default/hero.css";
import Link from 'next/link';
import { preload } from 'react-dom';
import ExploreLuckButton from './ExploreLuckButton';

/**
 * Renders the interactive homepage hero with primary navigation and the hero artwork.
 *
 * @returns {import('react').ReactElement} The homepage hero header.
 */
export default function Hero() {
  // PERFORMANCE (specs/088-live-performance-readiness): hint only the AVIF
  // artwork. A preload hint's `type` only filters formats the browser cannot
  // decode, so hinting AVIF *and* WebP made every AVIF-capable browser download
  // both files (~492 KiB instead of ~199 KiB) for one painted image. AVIF is
  // what those browsers paint; browsers without AVIF support ignore this hint
  // and take the WebP <source> below, which is unchanged.
  preload("/homepage-hero-lucky-pick-canada.avif", {
    as: "image",
    fetchPriority: "high",
    type: "image/avif",
    imageSrcSet: "/homepage-hero-lucky-pick-canada-669w.avif 669w, /homepage-hero-lucky-pick-canada.avif 1024w",
    imageSizes: "(max-width: 768px) 100vw, 1024px"
  });

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
              Luck Generator
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="#community-stories"
              className="text-white/80 hover:text-white transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Lucky Community Stories
            </Link>
            <span className="text-white/20 text-[10px] sm:text-xs" aria-hidden="true">•</span>
            <Link
              href="/crystal-ball"
              className="text-white/80 hover:text-white transition-colors relative before:absolute before:-inset-2 before:content-['']"
            >
              Crystal Ball
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

        {/* First-screen introduction (specs/115-first-screen-clarity-naming-csp):
            what Lucky Pick Canada is, why it is fun, and a free way in — all
            visible before any scrolling. Artwork, navigation and animations are
            unchanged. */}
        <div className="hero-welcome">
          <h1 className="hero-welcome-title">Lucky Pick Canada</h1>
          <p className="hero-welcome-lede">A fun, free place to explore what luck means to you.</p>
          <p className="hero-welcome-copy">
            Try the Luck Generator for a daily reading, ask the Crystal Ball a question, and read
            Lucky Community Stories shared from across Canada. Luck is about more than fortune and
            fame — it lives in everyday moments, hope and possibility.
          </p>
          <a href="#play-explore" className="hero-welcome-cta gold-3d-btn">
            <span className="gold-cta-emoji" aria-hidden="true">🍀</span>
            Explore free experiences
            <span aria-hidden="true">→</span>
          </a>
          <p className="hero-welcome-note">Free to enjoy · For fun and entertainment only</p>
        </div>

        {/* Hero Center Content */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center w-full max-w-[1100px] mx-auto mt-4 mb-4 px-4 sm:px-6 relative">
            <div className="relative w-full hero-image-container flex items-center justify-center pointer-events-none">
              <picture className="absolute inset-0 w-full h-full relative z-10 pointer-events-none flex items-center justify-center">
                <source type="image/avif" srcSet="/homepage-hero-lucky-pick-canada-669w.avif 669w, /homepage-hero-lucky-pick-canada.avif 1024w" sizes="(max-width: 768px) 100vw, 1024px" />
                <source type="image/webp" srcSet="/homepage-hero-lucky-pick-canada-669w.webp 669w, /homepage-hero-lucky-pick-canada.webp 1024w" sizes="(max-width: 768px) 100vw, 1024px" />
                <img
                  className="pointer-events-none object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)] w-full h-full"
                  src="/homepage-hero-lucky-pick-canada.webp"
                  srcSet="/homepage-hero-lucky-pick-canada-669w.webp 669w, /homepage-hero-lucky-pick-canada.webp 1024w"
                  sizes="(max-width: 768px) 100vw, 1024px"
                  alt="Lucky Pick Canada emblem with a maple leaf and clover set against a starry sky."
                  fetchPriority="high"
                />
              </picture>
              {/* Decorative gold shimmer (specs/089-homepage-nav-gold-shimmer):
                  three masked light bands that drift across the emblem's gold
                  ring, the gold wordmark and the Explore Your Luck line/arrow.
                  The frame reproduces the painted artwork box, so no image,
                  wording, colour or layout changes and no input is captured. */}
              <span className="hero-gold-shimmer-frame" aria-hidden="true">
                <span className="hero-gold-shimmer hero-gold-shimmer--ring" />
                <span className="hero-gold-shimmer hero-gold-shimmer--wordmark" />
                <span className="hero-gold-shimmer hero-gold-shimmer--explore" />
              </span>
              <ExploreLuckButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

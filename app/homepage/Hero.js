import "../../themes/default/hero.css";
import Link from 'next/link';
import { preload } from 'react-dom';
import ExploreLuckButton from './ExploreLuckButton';

/**
 * The hero artwork is one flattened painting (1024 x 1536) that carries the gold
 * ring, the tagline, the gold wordmark, a painted subtitle, a maple-leaf divider
 * and the "EXPLORE YOUR LUCK" line with its chevron.
 *
 * specs/117-homepage-hero-reference-layout shows that same painting through
 * measured row windows so the reference layout can place the existing welcome
 * panel between the painting's own maple-leaf divider and the Explore line.
 * Nothing is redrawn or resized: every window renders the same file at the same
 * scale, cropped by CSS. Row bands measured from the painting's alpha profile:
 * emblem/tagline/wordmark 14-1085, divider 1222-1306, Explore line 1325-1502;
 * the windows cut on the near-empty rows between them.
 *
 * @param {{ alt?: string }} props Decorative slices omit `alt`; the emblem slice
 *   keeps the artwork's description.
 * @returns {import('react').ReactElement} One artwork window.
 */
function HeroArtwork({ alt = '' }) {
  return (
    <picture className="hero-art-picture">
      <source type="image/avif" srcSet="/homepage-hero-lucky-pick-canada-669w.avif 669w, /homepage-hero-lucky-pick-canada.avif 1024w" sizes="(max-width: 768px) 100vw, 1024px" />
      <source type="image/webp" srcSet="/homepage-hero-lucky-pick-canada-669w.webp 669w, /homepage-hero-lucky-pick-canada.webp 1024w" sizes="(max-width: 768px) 100vw, 1024px" />
      <img
        className="hero-art-image"
        src="/homepage-hero-lucky-pick-canada.webp"
        srcSet="/homepage-hero-lucky-pick-canada-669w.webp 669w, /homepage-hero-lucky-pick-canada.webp 1024w"
        sizes="(max-width: 768px) 100vw, 1024px"
        alt={alt}
        fetchPriority="high"
      />
    </picture>
  );
}

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
    <header className="relative w-full flex flex-col items-center pt-0 mt-0 pb-0 overflow-hidden text-white selection:bg-amber-500 selection:text-slate-950 homepage-hero-welcome">
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

        {/* Reference composition (specs/117-homepage-hero-reference-layout):
            emblem + tagline + wordmark, maple-leaf divider, the existing welcome
            panel, the same divider again, then the painted Explore line. The
            hero grows with its content instead of shrinking the branding into a
            fixed screen height. */}
        <div className="hero-artwork-column">
          <div className="hero-art-slice hero-art-slice--emblem">
            <HeroArtwork alt="Lucky Pick Canada emblem with a maple leaf and clover set against a starry sky." />
            {/* Decorative gold shimmer (specs/089-homepage-nav-gold-shimmer):
                masked light bands that drift across the emblem's gold ring and
                the gold wordmark. The frame reproduces the painted artwork box,
                so no image, wording, colour or layout changes and no input is
                captured. */}
            <span className="hero-gold-shimmer-frame" aria-hidden="true">
              <span className="hero-gold-shimmer hero-gold-shimmer--ring" />
              <span className="hero-gold-shimmer hero-gold-shimmer--wordmark" />
            </span>
          </div>

          <div className="hero-art-slice hero-art-slice--divider hero-art-divider hero-art-divider--top" aria-hidden="true">
            <HeroArtwork />
          </div>

          {/* First-screen introduction (specs/115-first-screen-clarity-naming-csp):
              what Lucky Pick Canada is, why it is fun, and a free way in. Content
              and controls are unchanged; the panel framing comes from the
              reference layout. */}
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

          <div className="hero-art-slice hero-art-slice--divider hero-art-divider hero-art-divider--bottom" aria-hidden="true">
            <HeroArtwork />
          </div>

          <div className="hero-art-slice hero-art-slice--explore hero-image-container pointer-events-none">
            <HeroArtwork />
            {/* The third shimmer band tracks the painted "EXPLORE YOUR LUCK" line
                and its chevron inside this window. */}
            <span className="hero-gold-shimmer-frame" aria-hidden="true">
              <span className="hero-gold-shimmer hero-gold-shimmer--explore" />
            </span>
            <ExploreLuckButton />
          </div>
        </div>
      </div>
    </header>
  );
}

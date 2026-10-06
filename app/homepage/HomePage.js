'use client';
import { playButtonClick } from '../lib/audio';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createLuckyReveal } from '../lucky-reveal';
const FAQSection = dynamic(() => import('./FAQSection'));

// PERFORMANCE OPTIMIZATION (Bolt ⚡):
// Lazy load non-critical modal components to reduce the initial JS bundle size.
// These components are only needed upon user interaction (e.g. checkout or reveal completion).
// Expected impact: Faster initial page load and improved Time to Interactive.
const CheckoutModal = dynamic(() => import('../checkout-modal'));
const LuckyRevealPopup = dynamic(() => import('../lucky-reveal-popup'));
import { TURNSTILE_SITE_KEY } from '../turnstile-config';
import { DEFAULT_THEME } from '../../themes/default/theme';
const TurnstileField = dynamic(() => import('../turnstile-field'), { ssr: false });

function SectionHeading({ eyebrow, id, title, children }) {
  return (
    <div className="homepage-section-heading">
      <p>{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {children && <span className="homepage-section-heading-copy">{children}</span>}
    </div>
  );
}

const VERIFY_SESSION_RETRY_DELAYS_MS = [400, 1200, 2500];

/**
 * Verifies a paid checkout session, retrying the transient 409/503 responses
 * that occur while a reveal lock is held or persistence is briefly unavailable.
 *
 * @param {string} sessionId Stripe checkout session id.
 * @param {number} attempt Current retry attempt index.
 * @returns {Promise<object>} Parsed verification payload.
 */
async function fetchVerifiedSession(sessionId, attempt = 0) {
  const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);

  if ((res.status === 409 || res.status === 503) && attempt < VERIFY_SESSION_RETRY_DELAYS_MS.length) {
    await new Promise((resolve) => setTimeout(resolve, VERIFY_SESSION_RETRY_DELAYS_MS[attempt]));
    return fetchVerifiedSession(sessionId, attempt + 1);
  }

  if (!res.ok) throw new Error('Invalid session');
  return res.json();
}

/**
 * Renders the interactive homepage content and animated star canvas.
 * Manages visit counts, checkout and reveal modals, and suggestion feedback.
 *
 * @returns {import('react').ReactElement} The homepage content and modal elements.
 */
export default function HomePage() {
  const [checkoutType, setCheckoutType] = useState(null);
  const [luckyReveal, setLuckyReveal] = useState(null);
  const [suggested, setSuggested] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get('payment') === 'success' && searchParams.get('session_id')) {
      const sessionId = searchParams.get('session_id');

      // SECURITY HARDENING: Verify the paid session server-side and use the
      // persisted server-generated reveal for this specific checkout session.
      fetchVerifiedSession(sessionId)
        .then(data => {
          if (data.success && data.reveal?.numbers?.length) {
            setLuckyReveal({
              game: {
                name: data.game === '7' ? '7 Pick' : '6 Pick',
                numbers: data.reveal.numbers,
              },
              luckyColor: data.reveal.luckyColor,
              luckyDay: data.reveal.luckyDay,
            });
          } else if (data.success) {
            console.error('Lucky reveal data missing from verified session');
            setSuggestionError('Unable to load your lucky reveal. Please contact support if you were charged.');
          } else {
            console.error('Session verification failed:', data.error);
            setSuggestionError('Unable to verify payment. Please contact support if you were charged.');
          }
        })
        .catch(err => {
          console.error('Session verification error:', err);
          setSuggestionError('Unable to verify payment. Please contact support if you were charged.');
        });
    }

    setSuggested(searchParams.get('suggested') === '1');
    setSuggestionError(searchParams.get('suggestionError') || '');
  }, []);

  // Total Visits state
  const [totalVisits, setTotalVisits] = useState(null);

  useEffect(() => {
    // Fetch initial visits count for the homepage
    fetch('/api/visits')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.visits === 'number') {
          setTotalVisits(data.visits);
        }
      })
      .catch((err) => console.error("Failed to fetch visits:", err));
  }, []);


  // Viewport-Wide Shooting Stars & Constellation Twinkle
  const backgroundCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    let ambientStars = [];
    let shootingStars = [];


    /**
     * Creates randomly positioned stars, each with a ~16% chance of independent
     * twinkling. Twinkle speeds are in radians per millisecond; phases are in radians.
     *
     * @param {number} width - Canvas width in pixels.
     * @param {number} height - Canvas height in pixels.
     * @returns {Object[]} New star records, one per 2,000 square pixels rounded down;
     * empty when the nonnegative canvas area is less than 2,000 square pixels.
     */
    const initAmbientStars = (width, height) => {
      const numStars = Math.floor((width * height) / 2000); // Moderate density
      const newStars = [];
      for (let i = 0; i < numStars; i++) {
        // Only a small subset (~16%) of stars will twinkle independently
        const canTwinkle = Math.random() < 0.16;

        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.8 + 0.5, // ~0.5px-1.3px radius (1px-2.6px diameter) to prevent sub-pixel blur
          baseAlpha: Math.random() * 0.5 + 0.2, // Slightly brighter base alpha
          canTwinkle: canTwinkle,
          twinkleSpeed: canTwinkle ? (Math.random() * 0.004 + 0.002) : 0, // Perceptible but gentle twinkle speed
          twinklePhase: canTwinkle ? Math.random() * Math.PI * 2 : 0, // Random starting phase
        });
      }
      return newStars;
    };

    const spawnShootingStar = (width, height) => {
      if (reducedMotion) return;
      if (shootingStars.length >= 3) return;

      const startX = Math.random() * width;
      const startY = Math.random() * (height * 0.8);

      const length = Math.random() * 40 + 40;
      const angle = (Math.random() * 90 + 20) * (Math.PI / 180);
      const finalAngle = Math.random() > 0.5 ? angle : Math.PI - angle;
      const speed = Math.random() * 10 + 8;

      shootingStars.push({
        x: startX,
        y: startY,
        length: length,
        angle: finalAngle,
        speed: speed,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.01,
        coreGlow: Math.random() * 0.5 + 0.5,
      });
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ambientStars = initAmbientStars(canvas.width, canvas.height);
    };

    // Initial setup
    canvas.width = window.innerWidth || 1024;
    canvas.height = window.innerHeight || 768;
    resizeCanvas();

    // Timers
    let shootingStarTimeout;
    let doubleStarTimeout;
    /**
     * Schedules recurring shooting-star spawn attempts 30–60 seconds apart, with
     * a 15% chance of a second attempt 0.5–2 seconds later. Schedules nothing if
     * reduced motion was preferred when the effect initialized.
     */
    const scheduleShootingStar = () => {
      if (reducedMotion) return;
      const delay = Math.random() * 20000 + 10000; // 10s to 30s
      shootingStarTimeout = setTimeout(() => {
        spawnShootingStar(canvas.width, canvas.height);

        if (Math.random() < 0.15) {
          const doubleDelay = Math.random() * 1500 + 500;
          clearTimeout(doubleStarTimeout);
          doubleStarTimeout = setTimeout(() => {
            spawnShootingStar(canvas.width, canvas.height);
          }, doubleDelay);
        }

        scheduleShootingStar();
      }, delay);
    };
    scheduleShootingStar();



    /**
     * Repaints the star canvas, advances shooting stars, removes expired ones,
     * and schedules the next animation frame. If reduced motion was preferred
     * when the effect initialized, paints without ambient twinkling and does not
     * schedule another frame.
     *
     * @throws {TypeError} If the canvas has no 2D rendering context.
     */
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentTime = Date.now();
      const width = canvas.width;
      const height = canvas.height;

      // Ensure composite operation and globalAlpha are clean for ambient stars
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;

      // Draw Ambient Stars
      for (let i = 0; i < ambientStars.length; i++) {
        const star = ambientStars[i];

        let currentAlpha = star.baseAlpha;

        // Add subtle independent twinkling for the sparse subset of active stars
        if (star.canTwinkle && !reducedMotion) {
          // Slow sine wave based on time, phase, and speed
          currentAlpha += Math.sin(currentTime * star.twinkleSpeed + star.twinklePhase) * 0.4;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x - star.radius, star.y - star.radius, star.radius * 2, star.radius * 2);
      }

      // Draw Shooting Stars
      ctx.globalCompositeOperation = 'lighter';
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];

        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= star.decay;

        if (star.life <= 0) {
            shootingStars.splice(i, 1);
            continue;
        }

        const currentLength = star.length * Math.min(1, star.life * 2);
        const tailX = star.x - Math.cos(star.angle) * currentLength;
        const tailY = star.y - Math.sin(star.angle) * currentLength;

        // PERFORMANCE OPTIMIZATION (Bolt ⚡):
        // Replaced string interpolation for `rgba(...)` with static hex colors
        // and manipulated opacity via `ctx.globalAlpha`.
        ctx.globalAlpha = Math.max(0, star.life);

        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        gradient.addColorStop(0, 'rgb(255, 240, 200)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(0.5, star.life * 1.5);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(star.x - 0.5, star.y - 0.5, 1.5, 1.5);
      }
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';

      if (!reducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
        if (reducedMotion) draw();
      }, 200);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(shootingStarTimeout);
      clearTimeout(doubleStarTimeout);
      if (typeof resizeTimeout !== 'undefined') clearTimeout(resizeTimeout);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  function startLuckyReveal(luckyPickGame) {
    setLuckyReveal(createLuckyReveal(luckyPickGame));
  }

  function openLuckyPickCheckout(event) {
    event.currentTarget.blur();
    setCheckoutType('lucky_pick');
  }

  function openGiftCheckout(event) {
    event.currentTarget.blur();
    setCheckoutType('gift_package');
  }

  function openTipJar(event) {
    event.currentTarget.blur();
    setCheckoutType('tip');
  }

  function closeLuckyReveal() {
    setLuckyReveal(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    url.searchParams.delete('session_id');
    window.history.replaceState(null, '', url);
  }

  return (
    <div className="lucky-site-shell homepage-experience block pt-0 mt-0 pb-12 px-4 w-full mx-auto">



      {/* 1. & 3. Viewport-Wide Shooting Stars & Constellation Twinkle */}
      <canvas
        ref={backgroundCanvasRef}
        className="homepage-star-canvas fixed inset-0 w-full h-full pointer-events-none -z-10"
        style={{ position: 'fixed' }}
      />
      <section id="play-explore" className="homepage-section" aria-labelledby="play-explore-heading">
        <SectionHeading eyebrow="Free to explore" id="play-explore-heading" title="Play & Explore">
          Discover a little magic, everyday.
        </SectionHeading>
        <div className="homepage-community-grid">
        <article id="lucky-meter" className="homepage-community-card backdrop-blur-sm bg-black/20">
          <p className="homepage-offer-kicker">DAILY RESONANCE RITUAL</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">LUCKY METER</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">Take a moment, tune in to today’s energy, and discover what your luck has in store. Your daily resonance is waiting.</p>
          <div className="flex flex-col items-center gap-2">
            <Link href="/lucky-meter" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">Check Lucky Meter <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
            {totalVisits !== null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Total visits: {totalVisits.toLocaleString()}
              </div>
            )}
          </div>
        </article>
        <article id="daily-card-reveal" className="homepage-community-card backdrop-blur-sm bg-black/20">
          <p className="homepage-offer-kicker">DAILY CARD REVEAL</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Today's Lucky Card</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">A new Lucky Card awaits your collection. Open today's Lucky Card, enjoy the reveal, and keep building your collection.</p>
          <Link href="/reveal" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">Reveal Today&apos;s Card <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
        <article id="crystal-ball" className="homepage-community-card backdrop-blur-sm bg-black/20">
          <p className="homepage-offer-kicker">MYSTICAL ORACLE</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Crystal Ball</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">Have a question in mind? Focus your intention, ask the Crystal Ball, and see what mysterious answer appears.</p>
          <Link href="/crystal-ball" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">CONSULT THE ORACLE <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
        </div>
      </section>

      <section id="community-section" className="homepage-section" aria-labelledby="community-group-heading">
        <SectionHeading eyebrow="Shared experiences" id="community-group-heading" title="Community">
          Connect and share with others.
        </SectionHeading>
        <div className="homepage-community-grid" style={{ gridTemplateColumns: '1fr' }}>
          <article id="community-stories" className="homepage-community-card backdrop-blur-sm bg-black/20">
          <p className="homepage-offer-kicker">COMMUNITY STORIES</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Lucky Stories</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">A community space to share your own experiences of luck and good fortune. From amazing coincidences and unexpected opportunities, to finding money or simply a small everyday moment where you felt unusually lucky—big or small, we want to hear about it! (Please note: these are not business reviews or testimonials.)</p>
          <Link href="/map" className="cta-secondary relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">EXPLORE LUCKY STORIES →<span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
      </div>
      </section>

      <section id="personalized" className="homepage-section" aria-labelledby="picks-heading">
        <SectionHeading eyebrow="Made for your next moment" id="picks-heading" title="Lucky Pick Experience">
          Create a personal LuckyPickCanada moment, send a thoughtful digital gift, or support the experience.
        </SectionHeading>
        <div className="homepage-offer-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <article className="homepage-offer homepage-offer-featured">
            <img className="homepage-offer-image" src="/1784862459046.png" alt="Personalized Lucky Pick card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">$1 Lucky Pick</p>
            <h3 className="homepage-offer-title text-xl sm:text-2xl font-semibold mb-2">Make your moment personal.</h3>
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed mb-5">Ready for today’s pick? Discover a fresh set of lucky numbers and see what combination finds its way to you.</p>
            <div className="homepage-choice-row"><span>6 Pick</span><span>7 Pick</span></div>
            <p className="homepage-offer-note">CAD $1 · Entertainment only</p>
            <button type="button" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={(e) => { playButtonClick(); openLuckyPickCheckout(e); }}>Choose a Lucky Pick<span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784889264858.png" alt="Lucky Pick gift package card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">$2.99 Gift Experience</p>
            <h3 className="homepage-offer-title text-xl sm:text-2xl font-semibold mb-2">Gift Experience</h3>
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed mb-5">Share a little Canadian magic with someone you know. The Gift Experience turns Lucky Pick Canada into a fun surprise made to brighten someone’s day.</p>
            <p className="homepage-offer-note">Gift package · CAD $2.99</p>
            <button type="button" className="cta-secondary relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={(e) => { playButtonClick(); openGiftCheckout(e); }}>Gift a Lucky Pick<span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></button>
          </article>
          </div>
      </section>

      <section id="tip-jar-section" className="homepage-section" aria-labelledby="tip-jar-heading">
        <SectionHeading eyebrow="Keep the lights glowing" id="tip-jar-heading" title="Tip Jar">
          Leave a tip for the journey.
        </SectionHeading>
        <div className="homepage-offer-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '400px', margin: '0 auto' }}>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784931654864.png" alt="Lucky Pick tip jar card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">Keep the lights glowing</p>
            <h3 className="homepage-offer-title text-xl sm:text-2xl font-semibold mb-2">Leave a tip for the journey.</h3>
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed mb-5">Enjoying Lucky Pick Canada? If you’d like to show a little extra support, the Tip Jar is always here. Completely optional, always appreciated.</p>
            <p className="homepage-offer-note">Tip jar · Choose your amount</p>
            <div className="inline-block"><button type="button" className="animate-donate-pulse cta-secondary relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={(e) => { playButtonClick(); openTipJar(e); }}>Open the tip jar<span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></button></div>
          </article>
        </div>
      </section>

      <section id="community" className="homepage-community-banner" aria-labelledby="community-heading">
        <div>
          <p className="homepage-offer-kicker">The Lucky Pick Canada community</p>
          <h2 id="community-heading">Keep the good energy moving.</h2>
          <p>Share a story, celebrate a small win, and connect with fellow Lucky Pick Canada explorers.</p>
        </div>
        <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" className="homepage-community-image">
          <img src={DEFAULT_THEME.assets.communityCover} alt="Lucky Pick Canada Community Facebook group cover" width="769" height="1376" />
        </a>
      </section>

      <FAQSection />

      <section id="suggestion-box" className="suggestion-box premium-surface" aria-labelledby="suggestion-box-heading">
        <div className="suggestion-box-copy">
          <p className="suggestion-box-kicker">Suggestion Box</p>
          <h2 id="suggestion-box-heading">Help make Lucky Pick Canada better</h2>
          <p>Have an idea, a suggestion, or something you’d love to see on Lucky Pick Canada? Drop it in the Suggestion Box and help us make the experience even better.</p>
        </div>
        {suggested && <p className="suggestion-box-notice suggestion-box-notice-success" role="status">Thanks for the suggestion. I’ll review it soon.</p>}
        {suggestionError && <p className="suggestion-box-notice suggestion-box-notice-error" role="alert">{suggestionError}</p>}
        <form action="/api/suggestions" method="post" className="suggestion-box-form">
          <div className="suggestion-box-fields">
            <label>Name <span>(optional)</span><input name="name" type="text" maxLength="40" placeholder="Your name" /></label>
            <label>Email <span>(optional)</span><input name="email" type="email" maxLength="120" placeholder="you@example.com" /></label>
          </div>
          <label>Your suggestion<textarea name="message" minLength="10" maxLength="1000" rows={5} placeholder="What would make this site better?" required /></label>
          <label aria-hidden="true" className="suggestion-box-honeypot">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
          <TurnstileField siteKey={TURNSTILE_SITE_KEY} submitButtonId="suggestion-box-submit" />
          <button id="suggestion-box-submit" type="submit" onClick={playButtonClick} className="cta-glow transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">Send suggestion <span aria-hidden="true">→</span></button>
        </form>
      </section>

      {/* About the Creator teaser */}
      <section
        className="homepage-about-teaser premium-surface"
        style={{

          padding: '32px 24px',
          maxWidth: '700px',
          marginInline: 'auto',
          textAlign: 'center'
        }}
      >
        <p className="homepage-offer-kicker" style={{ color: '#eabe52', marginBottom: '8px' }}>MEET THE CREATOR</p>
        <h2 style={{ fontSize: '1.75rem', color: 'white', marginBottom: '12px' }}>About the Creator & Our Story</h2>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '20px' }}>
          Discover the story behind Lucky Pick Canada and the journey that brought this digital experience to life.
        </p>
        <Link 
          href="/about" 
          className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          Read Our Story <span aria-hidden="true">→</span>
          <span className="absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span>
        </Link>
      </section>


      {checkoutType && <CheckoutModal type={checkoutType} onClose={() => setCheckoutType(null)} onRevealTestStart={(revealType, luckyPickGame) => {
        if (revealType === 'lucky_pick' || revealType === 'gift_package') {
          setCheckoutType(null);
          startLuckyReveal(luckyPickGame);
        }
      }} />}
      {luckyReveal && <LuckyRevealPopup reveal={luckyReveal} onClose={closeLuckyReveal} />}
    </div>
  );
}

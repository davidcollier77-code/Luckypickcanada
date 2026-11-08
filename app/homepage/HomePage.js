'use client';
import "../../themes/default/homepage.css";


import { playButtonClick } from '../lib/audio';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { buildLuckyReveal } from '../lucky-reveal';
const FAQSection = dynamic(() => import('./FAQSection'));

// PERFORMANCE OPTIMIZATION (Bolt ⚡):
// Lazy load non-critical modal components to reduce the initial JS bundle size.
// These components are only needed upon user interaction (e.g. checkout or reveal completion).
// Expected impact: Faster initial page load and improved Time to Interactive.
const CheckoutModal = dynamic(() => import('../checkout-modal'), { ssr: false });
const LuckyRevealPopup = dynamic(() => import('../lucky-reveal-popup'), { ssr: false });
import { DEFAULT_THEME } from '../../themes/default/theme';
import TurnstileField from '../turnstile-field';
import LuckyRevealsCounter from './LuckyRevealsCounter';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingTimeoutRef = useRef(null);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted) {
        clearTimeout(submittingTimeoutRef.current);
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    return () => clearTimeout(submittingTimeoutRef.current);
  }, []);

  function handleSuggestionSubmit(event) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    setIsSubmitting(true);
    if (submittingTimeoutRef.current) clearTimeout(submittingTimeoutRef.current);
    submittingTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 8000);
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get('payment') === 'success' && searchParams.get('session_id')) {
      const sessionId = searchParams.get('session_id');

      // SECURITY HARDENING: Verify the paid session server-side and use the
      // persisted server-generated reveal for this specific checkout session.
      fetchVerifiedSession(sessionId)
        .then(data => {
          // Both purchase options share this one presentation mapping, so the
          // paid Lucky Reveal always renders the server-verified results.
          const verifiedReveal = data.success
            ? buildLuckyReveal({
                game: data.game,
                numbers: data.reveal?.numbers,
                luckyColor: data.reveal?.luckyColor,
                luckyDay: data.reveal?.luckyDay,
              })
            : null;

          if (verifiedReveal) {
            setLuckyReveal(verifiedReveal);
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

    // SECURITY HARDENING: Remove suggestion parameters from the URL so they
    // do not fabricate a false success/error state on subsequent page reloads.
    if (searchParams.has('suggested') || searchParams.has('suggestionError')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('suggested');
      newUrl.searchParams.delete('suggestionError');
      window.history.replaceState(null, '', newUrl.toString());
    }
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
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        ambientStars = initAmbientStars(canvas.width, canvas.height);
      }
    };

    // Initial setup
    canvas.width = window.innerWidth || 1024;
    canvas.height = window.innerHeight || 768;
    ambientStars = initAmbientStars(canvas.width, canvas.height);

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
      ctx.fillStyle = '#ffffff'; // Bolt: Static fillStyle hoisted outside loop
      for (let i = 0; i < ambientStars.length; i++) {
        const star = ambientStars[i];

        // Add subtle independent twinkling for the sparse subset of active stars
        if (star.canTwinkle && !reducedMotion) {
          // Slow sine wave based on time, phase, and speed
          const currentAlpha = star.baseAlpha + Math.sin(currentTime * star.twinkleSpeed + star.twinklePhase) * 0.4;
          if (currentAlpha <= 0) continue;
          ctx.globalAlpha = currentAlpha > 1 ? 1 : currentAlpha;
        } else {
          ctx.globalAlpha = star.baseAlpha;
        }

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

  /**
   * Opens the single Lucky Reveal selection popup, where the customer chooses
   * 6 Pick or 7 Pick and then the Personal or Gift delivery option.
   */
  function openLuckyRevealCheckout(event) {
    event.currentTarget.blur();
    setCheckoutType('lucky_reveal');
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
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">LUCK GENERATOR</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">How's your luck looking today? Give the Luck Generator a try and discover your daily reading. Sit back and enjoy the show as your result comes to life with a little sparkle and Canadian inspiration!</p>
          <div className="flex flex-col items-center gap-2">
            <Link href="/lucky-meter" className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span className="gold-cta-emoji" aria-hidden="true">✨</span>Check Luck Generator <span aria-hidden="true">→</span></Link>
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
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">A little surprise is waiting for you! Discover today's Lucky Card, enjoy the reveal, and add another special card to your collection. Keep collecting, because you never know when new cards might be added!</p>
          <Link href="/reveal" className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span className="gold-cta-emoji" aria-hidden="true">♠</span>Reveal Today&apos;s Card <span aria-hidden="true">→</span></Link>
        </article>
        <article id="crystal-ball" className="homepage-community-card backdrop-blur-sm bg-black/20">
          <p className="homepage-offer-kicker">MYSTICAL CRYSTAL BALL</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Crystal Ball</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-5">Have something on your mind? Take a moment, focus on your question, and let the Crystal Ball reveal a little mystery. You never know what kind of unexpected message might be waiting for you!</p>
          <Link href="/crystal-ball" className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span className="gold-cta-emoji" aria-hidden="true">🔮</span>ASK THE CRYSTAL BALL <span aria-hidden="true">→</span></Link>
        </article>
        </div>
      </section>

      <section id="community-section" className="homepage-section" aria-labelledby="community-stories-heading">
        <div className="homepage-community-grid" style={{ gridTemplateColumns: '1fr' }}>
          <article id="community-stories" className="homepage-community-card relative overflow-hidden" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: '28px', border: '1px solid rgba(255, 235, 160, 0.15)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
          <img src="/community-stars-bg.webp" alt="" className="absolute inset-0 z-0 object-cover opacity-40 mix-blend-screen" sizes="(max-width: 1000px) 100vw, 1000px" />
          <div className="relative z-10">
          <p className="homepage-offer-kicker">COMMUNITY</p>
          <h2 id="community-stories-heading" className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Lucky Community Stories</h2>
          <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-3">Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.</p>
          <p className="homepage-offer-note">Please note: these are not business reviews or testimonials.</p>
          <Link href="/map" className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span className="gold-cta-emoji" aria-hidden="true">🍀</span>EXPLORE LUCKY COMMUNITY STORIES →</Link>
          </div>
        </article>
      </div>
      </section>

      <section id="personalized" className="homepage-section" aria-labelledby="picks-heading">
        <SectionHeading eyebrow="One reveal, two ways to receive it" id="picks-heading" title="Lucky Reveals — Your Little Touch of Luck">
          Get ready to discover your own little touch of luck! Enjoy a fun and exciting reveal featuring your special set of lucky numbers, a colour to wear for a little extra luck, and a lucky day to look forward to. Who knows what little surprises the day might bring? Enjoy it yourself or share a little luck with someone special!
        </SectionHeading>
        <div className="homepage-offer-grid" style={{ gridTemplateColumns: '1fr' }}>
          <article className="homepage-offer homepage-offer-featured">
            <picture><source type="image/avif" srcSet="/1784889264858-352w.avif 352w, /1784889264858.avif 704w" sizes="(max-width: 768px) 352px, 704px" /><source type="image/webp" srcSet="/1784889264858-352w.webp 352w, /1784889264858.webp 704w" sizes="(max-width: 768px) 352px, 704px" /><img className="homepage-offer-image" src="/1784889264858.png" srcSet="/1784889264858-352w.webp 352w, /1784889264858.webp 704w" sizes="(max-width: 768px) 352px, 704px" alt="" width="704" height="1524" loading="lazy" suppressHydrationWarning={true} /></picture>
            <p className="homepage-offer-kicker">Lucky Reveals · CAD $1.00 or CAD $1.99</p>
            <h3 className="homepage-offer-title text-xl sm:text-2xl font-semibold mb-2">Lucky Reveals</h3>
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed mb-5">One reveal, and you choose how it reaches you. Pick 6 Pick or 7 Pick for your numbers, lucky color, and lucky day — then keep it for yourself on the website, or send the very same reveal to someone by email.</p>
            <div className="homepage-choice-row"><span>6 Pick</span><span>7 Pick</span><span>Personal Reveal</span><span>Gift Reveal</span></div>
            <p className="homepage-offer-note">Personal Reveal · CAD $1.00 — no email delivery. Gift Reveal · CAD $1.99 — same reveal, email delivery included.</p>
            <button type="button" className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={(e) => { playButtonClick(); openLuckyRevealCheckout(e); }}><span className="gold-cta-emoji" aria-hidden="true">🎁</span>Choose Your Reveal</button>
          </article>
        </div>
      </section>

      {/* Paid Lucky Reveal counter: the reserved slot below the reveal section and
          above the Tip Jar. It shows a public total only; no location lookup or
          location data is involved. */}
      <LuckyRevealsCounter />

      <section id="tip-jar-section" className="homepage-section" aria-labelledby="tip-jar-heading">
        <div className="homepage-offer-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '760px', margin: '0 auto' }}>
          <article className="homepage-offer homepage-tip-jar">

            <p className="homepage-offer-kicker">Keep the lights glowing</p>
            <h2 id="tip-jar-heading" className="homepage-offer-title text-xl sm:text-2xl font-semibold mb-2">Tip Jar — Help Keep the Luck Rolling</h2>
            <div className="homepage-copy-stack">
              <p>Enjoying Lucky Pick Canada? If you've had a little fun exploring the site, consider leaving a little something in our Tip Jar. Your support helps keep Lucky Pick Canada going, improving, and growing.</p>
              <p>Whether you're simply enjoying the site and would like to show your appreciation, or you have an idea for something you'd love to see in the future, we'd be delighted to hear from you. Every contribution, big or small, helps us build on what we've started.</p>
              <p>Whether it's a tip, a donation, or a suggestion, it's sincerely appreciated. Thank you for being part of the journey!</p>
            </div>
            <p className="homepage-offer-note">Tip jar · Choose your amount</p>
            <div className="inline-block"><button type="button" className="gold-3d-btn gold-btn-glow relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={(e) => { playButtonClick(); openTipJar(e); }}><span className="gold-cta-emoji" aria-hidden="true">❤️</span>Open the tip jar<span className="gold-shimmer absolute inset-0 block w-full h-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none" aria-hidden="true"></span></button></div>
          </article>
        </div>
      </section>

      <section id="community" className="homepage-community-banner" aria-labelledby="community-heading">
        <div>
          <p className="homepage-offer-kicker">Facebook Group</p>
          <h2 id="community-heading">Keep the good energy moving.</h2>
          <p>Share a story, celebrate a small win, and connect with fellow Lucky Pick Canada explorers.</p>
        </div>
        <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" className="homepage-community-image">
          <picture><source type="image/avif" srcSet="/FB_IMG_1785107325979-551w.avif 551w, /FB_IMG_1785107325979-800w.avif 800w, /FB_IMG_1785107325979.avif 1376w" sizes="(max-width: 768px) 100vw, 551px" /><source type="image/webp" srcSet="/FB_IMG_1785107325979-551w.webp 551w, /FB_IMG_1785107325979-800w.webp 800w, /FB_IMG_1785107325979.webp 1376w" sizes="(max-width: 768px) 100vw, 551px" /><img src={DEFAULT_THEME.assets.communityCover} srcSet="/FB_IMG_1785107325979-551w.jpg 551w, /FB_IMG_1785107325979-800w.jpg 800w, /FB_IMG_1785107325979.jpg 1376w" sizes="(max-width: 768px) 100vw, 551px" alt="Lucky Pick Canada Community Facebook group cover" width="1376" height="768" loading="lazy" /></picture>
        </a>
      </section>

      <FAQSection />

      <section id="suggestion-box" className="suggestion-box premium-surface" aria-labelledby="suggestion-box-heading">
        <div className="suggestion-box-copy">
          <h2 id="suggestion-box-heading">Suggestion Box — Your Ideas Help Shape What's Next</h2>
          <div className="homepage-copy-stack suggestion-box-intro">
            <p>Lucky Pick Canada is always growing, and we'd love you to be part of that journey!</p>
            <p>Have an idea for something new, a feature you'd enjoy, or an improvement you'd like to see? We'd love to hear from you.</p>
            <p>Big ideas, little ideas, and everything in between are welcome. Your suggestions help inspire what comes next and make Lucky Pick Canada an even better place for everyone to enjoy.</p>
            <p>Thanks for helping us shape the future!</p>
          </div>
        </div>
        {suggested && <p className="suggestion-box-notice suggestion-box-notice-success" role="status">Thanks for the suggestion. I’ll review it soon.</p>}
        {suggestionError && <p className="suggestion-box-notice suggestion-box-notice-error" role="alert">{suggestionError}</p>}
        <form action="/api/suggestions" method="post" onSubmit={handleSuggestionSubmit} className="suggestion-box-form">
          <div className="suggestion-box-fields">
            <label>Name <span>(optional)</span><input name="name" type="text" maxLength="40" placeholder="Your name" /></label>
            <label>Email <span>(optional)</span><input name="email" type="email" maxLength="120" placeholder="you@example.com" /></label>
          </div>
          <label>Your suggestion <span>(required)</span><textarea name="message" minLength="10" maxLength="1000" rows={5} placeholder="Tell us what's on your mind. What would you love to see on Lucky Pick Canada?" required /></label>
          <label aria-hidden="true" className="suggestion-box-honeypot">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
          <TurnstileField submitButtonId="suggestion-box-submit" action="suggestion-box" />
          <button id="suggestion-box-submit" type="submit" disabled={isSubmitting} onClick={playButtonClick} className={`gold-3d-btn gold-btn-glow relative group overflow-hidden inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${isSubmitting ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}><span className="gold-cta-emoji" aria-hidden="true">💡</span>{isSubmitting ? 'Please wait...' : 'Share Your Idea'} {!isSubmitting && <span aria-hidden="true">→</span>}{!isSubmitting && <span className="gold-shimmer absolute inset-0 block h-full w-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer pointer-events-none group-hover:animate-none" aria-hidden="true"></span>}</button>
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
          className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          <span className="gold-cta-emoji" aria-hidden="true">ℹ️</span>Read Our Story <span aria-hidden="true">→</span>

        </Link>
      </section>


      {checkoutType && <CheckoutModal type={checkoutType} onClose={() => setCheckoutType(null)} />}
      {luckyReveal && <LuckyRevealPopup reveal={luckyReveal} onClose={closeLuckyReveal} />}
    </div>
  );
}

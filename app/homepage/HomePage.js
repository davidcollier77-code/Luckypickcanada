'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createLuckyReveal } from '../lucky-reveal';

// PERFORMANCE OPTIMIZATION (Bolt ⚡):
// Lazy load non-critical modal components to reduce the initial JS bundle size.
// These components are only needed upon user interaction (e.g. checkout or reveal completion).
// Expected impact: Faster initial page load and improved Time to Interactive.
const CheckoutModal = dynamic(() => import('../checkout-modal'));
const LuckyRevealPopup = dynamic(() => import('../lucky-reveal-popup'));
import { TURNSTILE_SITE_KEY } from '../turnstile-config';
import { DEFAULT_THEME } from '../../themes/default/theme';
import TurnstileField from '../turnstile-field';
import Hero from './Hero';
import FAQSection from './FAQSection';
import { LUCKY_CARDS } from '../lucky-card-data';

function SectionHeading({ eyebrow, id, title, children }) {
  return (
    <div className="homepage-section-heading">
      <p>{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {children && <span>{children}</span>}
    </div>
  );
}

export default function HomePage() {
  const [checkoutType, setCheckoutType] = useState(null);
  const [luckyReveal, setLuckyReveal] = useState(null);
  const [suggested, setSuggested] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get('payment') === 'success' && searchParams.get('session_id')) {
      setLuckyReveal(createLuckyReveal(searchParams.get('pick')));
    }

    setSuggested(searchParams.get('suggested') === '1');
    setSuggestionError(searchParams.get('suggestionError') || '');
  }, []);


  // Viewport-Wide Shooting Stars & Constellation Twinkle
  const backgroundCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;

    let ambientStars = [];
    let shootingStars = [];
    let isConstellationTwinkling = false;
    let constellationTwinklePhase = 0; // 0 to 1

    const initAmbientStars = (width, height) => {
      const numStars = Math.floor((width * height) / 2000); // Moderate density
      const newStars = [];
      for (let i = 0; i < numStars; i++) {
        newStars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 0.6 + 0.2, // Tiny stars
          baseAlpha: Math.random() * 0.4 + 0.1, // Dim base alpha
          alpha: 0, // Current alpha
          twinkleSpeed: Math.random() * 0.01 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
          isCluster: false // Will mark cluster stars later
        });
      }

      // Select 3-4 stars for cluster twinkling
      const clusterCount = Math.floor(Math.random() * 2) + 3;
      for (let i = 0; i < clusterCount; i++) {
        if (newStars.length > 0) {
          const index = Math.floor(Math.random() * newStars.length);
          newStars[index].isCluster = true;
        }
      }
      return newStars;
    };

    const spawnShootingStar = (width, height) => {
      const startX = Math.random() * (width * 0.9);
      const startY = Math.random() * (height * 0.7) + (height * 0.05); // 5% - 75%
      const length = Math.random() * 150 + 100; // Trail length

      // Angle: 30 to 60 degrees (in radians)
      const angle = (Math.random() * 30 + 30) * (Math.PI / 180);
      const speed = Math.random() * 15 + 10;

      shootingStars.push({
        x: startX,
        y: startY,
        length: length,
        angle: angle,
        speed: speed,
        alpha: 1,
        life: 1.0, // 1 to 0
        decay: Math.random() * 0.02 + 0.015, // Roughly 0.9s-1.3s lifespan
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
    window.addEventListener('resize', resizeCanvas);

    // Timers
    let shootingStarTimeout;
    const scheduleShootingStar = () => {
      const delay = Math.random() * 15000 + 30000; // 30s to 45s
      shootingStarTimeout = setTimeout(() => {
        try {
          spawnShootingStar(canvas.width, canvas.height);
        } catch (e) {
          console.error('Error spawning shooting star:', e);
        } finally {
          scheduleShootingStar();
        }
      }, delay);
    };
    scheduleShootingStar();

    let twinkleTimeout;
    const scheduleTwinkle = () => {
      const delay = Math.random() * 15000 + 45000; // 45s to 60s
      twinkleTimeout = setTimeout(() => {
        isConstellationTwinkling = true;
        constellationTwinklePhase = 0;
        scheduleTwinkle();
      }, delay);
    };
    scheduleTwinkle();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Handle Constellation Twinkle Phase
      if (isConstellationTwinkling) {
        constellationTwinklePhase += 0.005; // Adjust for ~3s cycle
        if (constellationTwinklePhase >= Math.PI) {
          isConstellationTwinkling = false;
          constellationTwinklePhase = 0;
        }
      }

      // Draw Ambient Stars
      const now = Date.now();
      for (let i = 0; i < ambientStars.length; i++) {
        const star = ambientStars[i];

        let currentAlpha = star.baseAlpha + Math.sin(now * star.twinkleSpeed) * 0.2;

        if (star.isCluster && isConstellationTwinkling) {
            // Brighten up during constellation pulse
            currentAlpha += Math.sin(constellationTwinklePhase) * 0.6;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.radius * 2, star.radius * 2);
      }

      // Draw Shooting Stars
      ctx.globalCompositeOperation = 'lighter';
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];

        // Update position
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.life -= star.decay;

        if (star.life <= 0) {
            shootingStars.splice(i, 1);
            continue;
        }

        // Draw tail
        const tailX = star.x - Math.cos(star.angle) * star.length * star.life;
        const tailY = star.y - Math.sin(star.angle) * star.length * star.life;

        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        // Gold to white
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.life})`);
        gradient.addColorStop(0.2, `rgba(255, 215, 0, ${star.life * 0.8})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over'; // Reset

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(shootingStarTimeout);
      clearTimeout(twinkleTimeout);
      cancelAnimationFrame(animationFrameId);
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
    url.searchParams.delete('pick');
    url.searchParams.delete('session_id');
    window.history.replaceState(null, '', url);
  }

  return (
    <div className="lucky-site-shell homepage-experience">

      {/* 1. & 3. Viewport-Wide Shooting Stars & Constellation Twinkle */}
      <canvas
        ref={backgroundCanvasRef}
        className="fixed inset-0 pointer-events-none overflow-hidden -z-10 w-full h-full"
      />

      {/* 2. Full-Page Aurora Breathing Pulse */}
      <div className="fixed inset-0 pointer-events-none -z-10 animate-breathe-aurora" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(24, 185, 120, 0.4) 0%, rgba(191, 139, 255, 0.2) 50%, transparent 100%)' }} />

      <Hero />

      <section className="homepage-section homepage-community-grid" aria-label="Lucky Pick Canada community">
        <article id="lucky-meter" className="homepage-community-card">
          <p className="homepage-offer-kicker">DAILY RESONANCE RITUAL</p>
          <h2>LUCKY METER</h2>
          <p>Discover your daily lucky resonance score from 0–100% and tap into today's positive energy.</p>
          <Link href="/lucky-meter" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95">Check Lucky Meter <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
        <article className="homepage-community-card">
          <p className="homepage-offer-kicker">Lucky Stories</p>
          <h2>Community Stories</h2>
          <p>Read uplifting moments shared by the Lucky Pick Canada community from coast to coast.</p>
          <Link href="/stories" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95">See Our Story Section<span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
        <article id="crystal-ball" className="homepage-community-card">
          <p className="homepage-offer-kicker">MYSTICAL ORACLE</p>
          <h2>Consult the Lucky Crystal Ball</h2>
          <p>Ask a question and peer into the mists to reveal your daily fortune powered by Canadian magic and AI wisdom.</p>
          <Link href="/crystal-ball" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95">CONSULT THE ORACLE <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
        <article id="community-map" className="homepage-community-card">
          <p className="homepage-offer-kicker">Lucky Map</p>
          <h2>Lucky Map</h2>
          <p>Explore the existing Canadian story map and see the community’s lucky moments by province.</p>
          <Link href="/map" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95">Visit the Lucky Map <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
        <article id="lucky-card" className="homepage-community-card">
          <p className="homepage-offer-kicker">DAILY CARD REVEAL</p>
          <h2>DAILY LUCKY CARD</h2>
          <p>Reveal today&apos;s digital collectible card from Coast to Coast. Check your fortune tier, unlock daily positive themes, and build your collection.</p>
          <Link href="/reveal" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95">Reveal Today&apos;s Card <span aria-hidden="true">→</span><span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></Link>
        </article>
      </section>

      <section id="community" className="homepage-community-banner" aria-labelledby="community-heading">
        <div>
          <p className="homepage-offer-kicker">The Lucky Pick Canada community</p>
          <h2 id="community-heading">Keep the good energy moving.</h2>
          <p>Share a story, celebrate a small win, and connect with fellow Lucky Pick Canada explorers.</p>
        </div>
        <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" className="homepage-community-image">
          <img src={DEFAULT_THEME.assets.communityCover} alt="Lucky Pick Canada Community Facebook group cover" width="769" height="1376" loading="lazy" />
        </a>
      </section>


      <section id="personalized" className="homepage-section" aria-labelledby="picks-heading">
        <SectionHeading eyebrow="Made for your next moment" id="picks-heading" title="Lucky Pick Experience">
          Create a personal LuckyPickCanada moment, send a thoughtful digital gift, or support the experience.
        </SectionHeading>
        <div className="homepage-offer-grid">
          <article className="homepage-offer homepage-offer-featured">
            <img className="homepage-offer-image" src="/1784862459046.png" alt="Personalized Lucky Pick card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">$1 Lucky Pick</p>
            <h3>Make your moment personal.</h3>
            <p>Create your personal LuckyPickCanada moment with a unique interactive pick experience.</p>
            <div className="homepage-choice-row"><span>6 Pick</span><span>7 Pick</span></div>
            <p className="homepage-offer-note">CAD $1 · Entertainment only</p>
            <button type="button" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95" onClick={openLuckyPickCheckout}>Choose a Lucky Pick<span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784889264858.png" alt="Lucky Pick gift package card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">$4.99 Gift Experience</p>
            <h3 className="homepage-offer-title">Gift Experience</h3>
            <p>Send someone special their own LuckyPickCanada experience — a fun digital gift filled with lucky moments.</p>
            <p className="homepage-offer-note">Gift package · CAD $4.99</p>
            <button type="button" className="relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95" onClick={openGiftCheckout}>Gift a Lucky Pick<span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784931654864.png" alt="Lucky Pick tip jar card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">Keep the lights glowing</p>
            <h3>Leave a tip for the journey.</h3>
            <p>Support Lucky Pick Canada and help keep the community experience warm, playful, and welcoming.</p>
            <p className="homepage-offer-note">Tip jar · Choose your amount</p>
            <div className="inline-block"><button type="button" className="animate-donate-pulse relative overflow-hidden group inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-900 font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95" onClick={openTipJar}>Open the tip jar<span className="absolute inset-0 block w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-none animate-shimmer pointer-events-none"></span></button></div>
          </article>
        </div>
      </section>


      <section id="suggestion-box" className="suggestion-box premium-surface" aria-labelledby="suggestion-box-heading">
        <div className="suggestion-box-copy">
          <p className="suggestion-box-kicker">Suggestion Box</p>
          <h2 id="suggestion-box-heading">Help make Lucky Pick Canada better</h2>
          <p>Share an idea for a new feature, a smoother checkout, a better gift package, or anything that would make the site more fun to use.</p>
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
          <button id="suggestion-box-submit" type="submit" className="cta-glow transition-transform hover:scale-105">Send suggestion <span aria-hidden="true">→</span></button>
        </form>
      </section>

      <FAQSection />

      {/* Low-Profile SEO Text Section */}
      <section
        className="homepage-seo-section"
        style={{
          marginTop: '40px',
          padding: '24px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '800px',
          marginInline: 'auto',
          textAlign: 'left',
          opacity: '0.9'
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
          About Lucky Pick Canada
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Welcome to <strong>Lucky Pick Canada</strong>, your interactive destination for daily lucky picks, custom digital card reveals, and random number generation. Whether you are checking your daily luck meter or exploring unique card draws, our site brings a fun and engaging digital experience directly to your screen.
        </p>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Our digital card decks feature tiered card reveals—ranging from standard draws to premium cards like <em>Coast to Coast</em>—designed to make every pick exciting. Use our random pick tool for daily decisions, entertainment, or simply testing your fortune today.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '16px' }}>
          Lucky Pick Canada is intended strictly for entertainment purposes. Enjoy your daily draws and see what luck has in store for you!
        </p>
      </section>

      <footer className="homepage-footer">
        <p>Lucky Pick Canada · Made for fun, optimism, and a little everyday magic.</p>
        <p className="homepage-disclaimer">LuckyPickCanada is a digital entertainment experience created for fun and positive moments. It does not provide lottery or gambling services.</p>
        <nav className="homepage-social-links" aria-label="Social links">
          <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" aria-label="Facebook Community Group">Facebook</a>
          <a href="https://x.com/luckypickcanada" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">X</a>
          <a href="https://www.instagram.com/luckypickcanada" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
          <a href="https://www.facebook.com/luckypickcanada" target="_blank" rel="noopener noreferrer" aria-label="Facebook Page">Facebook Page</a>
          <a href="https://www.tiktok.com/@luckypickcanada" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TikTok</a>
        </nav>
        <nav className="homepage-legal-links" aria-label="Legal links" style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
          <Link href="/crystal-ball">Crystal Ball</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>
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

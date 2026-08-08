'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CheckoutModal from '../checkout-modal';
import LuckyCardReveal from '../lucky-card-reveal';
import { createLuckyReveal } from '../lucky-reveal';
import LuckyRevealPopup from '../lucky-reveal-popup';
import TurnstileField from '../turnstile-field';
import { DEFAULT_THEME } from '../../themes/default/theme';
import Hero from './Hero';

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
    <main className="lucky-site-shell homepage-experience">
      <Hero />

      <section id="cards" className="homepage-section homepage-cards-section" aria-labelledby="cards-heading">
        <SectionHeading eyebrow="A daily moment of possibility" id="cards-heading" title="Today’s Lucky Moment">
          Open one collectible card each day for a calm spark of encouragement.
        </SectionHeading>
        <LuckyCardReveal />
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
            <button type="button" className="homepage-offer-action" onClick={openLuckyPickCheckout}>Choose a Lucky Pick</button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784889264858.png" alt="Lucky Pick gift package card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">$4.99 Gift Experience</p>
            <h2 className="homepage-offer-title">Gift Experience</h2>
            <p>Send someone special their own LuckyPickCanada experience — a fun digital gift filled with lucky moments.</p>
            <p className="homepage-offer-note">Gift package · CAD $4.99</p>
            <button type="button" className="homepage-offer-action" onClick={openGiftCheckout}>Gift a Lucky Pick</button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784931654864.png" alt="Lucky Pick tip jar card artwork" width="704" height="1524" loading="lazy" />
            <p className="homepage-offer-kicker">Keep the lights glowing</p>
            <h3>Leave a tip for the journey.</h3>
            <p>Support Lucky Pick Canada and help keep the community experience warm, playful, and welcoming.</p>
            <p className="homepage-offer-note">Tip jar · Choose your amount</p>
            <button type="button" className="homepage-offer-action" onClick={openTipJar}>Open the tip jar</button>
          </article>
        </div>
      </section>

      <section className="homepage-section homepage-community-grid" aria-label="Lucky Pick Canada community">
        <article className="homepage-community-card">
          <p className="homepage-offer-kicker">Lucky Stories</p>
          <h2>Community Stories</h2>
          <p>Read uplifting moments shared by the Lucky Pick Canada community from coast to coast.</p>
          <Link href="/stories" className="homepage-story-cta">See Our Story Section</Link>
        </article>
        <article id="community-map" className="homepage-community-card homepage-map-card">
          <p className="homepage-offer-kicker">Lucky Map</p>
          <h2>Community Map</h2>
          <p>Explore the existing Canadian story map and see the community’s lucky moments by province.</p>
          <Link href="/map" className="homepage-map-cta">Visit the Lucky Map <span aria-hidden="true">→</span></Link>
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
          <TurnstileField siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} submitButtonId="suggestion-box-submit" />
          <button id="suggestion-box-submit" type="submit" className="suggestion-box-submit">Send suggestion <span aria-hidden="true">→</span></button>
        </form>
      </section>

      <footer className="homepage-footer">
        <p>Lucky Pick Canada · Made for fun, optimism, and a little everyday magic.</p>
        <p className="homepage-disclaimer">LuckyPickCanada is a digital entertainment experience created for fun and positive moments. It does not provide lottery or gambling services.</p>
        <nav className="homepage-social-links" aria-label="Social links">
          <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" aria-label="Facebook Community Group">Facebook</a>
        </nav>
      </footer>
      {checkoutType && <CheckoutModal type={checkoutType} onClose={() => setCheckoutType(null)} onRevealTestStart={(revealType, luckyPickGame) => {
        if (revealType === 'lucky_pick' || revealType === 'gift_package') {
          setCheckoutType(null);
          startLuckyReveal(luckyPickGame);
        }
      }} />}
      {luckyReveal && <LuckyRevealPopup reveal={luckyReveal} onClose={closeLuckyReveal} />}
    </main>
  );
}

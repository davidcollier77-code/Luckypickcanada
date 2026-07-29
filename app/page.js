'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CheckoutModal from './checkout-modal';
import LuckyCardReveal from './lucky-card-reveal';
import { createLuckyReveal } from './lucky-reveal';
import LuckyRevealPopup from './lucky-reveal-popup';
import LuckyMeter from './luck-meter';
import TurnstileField from './turnstile-field';
import { DEFAULT_THEME } from '../themes/default/theme';

const cards = DEFAULT_THEME.assets.heroCards;

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="homepage-section-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
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
      <header className="reference-site-header">
        <nav className="reference-site-nav reference-nav-row" aria-label="Primary navigation">
          <a className="reference-brand" href="#top" aria-label="Lucky Pick Canada home">
            <img className="navigation-logo" src={DEFAULT_THEME.assets.logo} alt="Lucky Pick Canada" />
            <span>Lucky Pick Canada</span>
          </a>
          <div className="reference-nav-links">
            <a className="premium-nav-link" href="#meter">Lucky Meter</a>
            <a className="premium-nav-link" href="#cards">Lucky Cards</a>
            <a className="premium-nav-link" href="#personalized">Lucky Picks</a>
            <a className="premium-nav-link" href="#community">Community</a>
          </div>
        </nav>
      </header>

      <section id="top" className="homepage-hero" aria-labelledby="homepage-title">
        <div className="reference-hero-copy">
          <div className="reference-hero-crest">
            <img src={DEFAULT_THEME.assets.logo} alt="Lucky Pick Canada maple and clover emblem" />
          </div>
          <p className="reference-hero-kicker">A little Canadian magic <span>✦</span> made for today</p>
          <h1 id="homepage-title" className="reference-hero-title">Your luck,<br /><span>personalized.</span></h1>
          <p className="reference-hero-description">Follow the aurora into a playful daily ritual of lucky numbers, cards, stories, and good energy from coast to coast.</p>
          <div className="homepage-hero-actions">
            <a className="reference-hero-button" href="#meter">Find your lucky energy <span>✦</span></a>
            <a className="homepage-text-link" href="#personalized">Explore Lucky Picks</a>
          </div>
        </div>

        <div className="reference-card-section" aria-hidden="true">
          <div className="reference-card-stage">
            <div className="reference-card-arc" />
            {cards.map((src, index) => (
              <img key={src} className={`reference-card reference-card-${['one', 'three', 'five'][index]}`} src={src} alt="" />
            ))}
          </div>
          <p className="reference-tableau-caption">A daily ritual of <span>possibility</span> and positive energy</p>
        </div>
      </section>

      <section id="meter" className="homepage-section" aria-labelledby="meter-heading">
        <SectionHeading eyebrow="Your free daily ritual" title="Tune into your lucky frequency">
          The Lucky Meter keeps its original random daily-energy experience, now framed as a premium aurora instrument.
        </SectionHeading>
        <LuckyMeter />
      </section>

      <section id="cards" className="homepage-section homepage-cards-section" aria-labelledby="cards-heading">
        <SectionHeading eyebrow="A daily moment of possibility" title="Today’s Lucky Moment">
          Open one collectible card each day for a calm spark of encouragement.
        </SectionHeading>
        <LuckyCardReveal />
      </section>

      <section id="personalized" className="homepage-section" aria-labelledby="picks-heading">
        <SectionHeading eyebrow="Made for your next moment" title="Choose your Lucky Pick experience">
          Pick your game, share a gift, or support the experience. Lucky Picks are for entertainment only.
        </SectionHeading>
        <div className="homepage-offer-grid">
          <article className="homepage-offer homepage-offer-featured">
            <img className="homepage-offer-image" src="/1784862459046.png" alt="Lucky Pick card" />
            <p className="homepage-offer-kicker">Personalized Lucky Pick</p>
            <h3>Six or seven numbers. One luminous reveal.</h3>
            <p>Select a 6 Pick or 7 Pick and enjoy your lucky colour and lucky day in the existing reveal experience.</p>
            <div className="homepage-choice-row"><span>6 Pick</span><span>7 Pick</span></div>
            <p className="homepage-offer-note">CAD $1 · Entertainment only</p>
            <button type="button" className="homepage-offer-action" onClick={openLuckyPickCheckout}>Choose a Lucky Pick</button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784889264858.png" alt="Lucky Pick gift card" />
            <p className="homepage-offer-kicker">Gift a little luck</p>
            <h3>Send a bright surprise across Canada.</h3>
            <p>The existing gift package delivers a Lucky Pick reveal and personal greeting for someone you care about.</p>
            <p className="homepage-offer-note">Gift package · CAD $4.99</p>
            <button type="button" className="homepage-offer-action" onClick={openGiftCheckout}>Gift a Lucky Pick</button>
          </article>
          <article className="homepage-offer">
            <img className="homepage-offer-image" src="/1784931654864.png" alt="Lucky Pick card" />
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
          <h2>Good fortune travels well.</h2>
          <p>Read uplifting moments shared by the Lucky Pick Canada community from coast to coast.</p>
          <Link href="/stories" className="homepage-text-link">Explore Lucky Stories <span>→</span></Link>
        </article>
        <article className="homepage-community-card homepage-map-card">
          <p className="homepage-offer-kicker">Lucky Map</p>
          <h2>Find where luck has landed.</h2>
          <p>Explore the existing Canadian story map and see the community’s lucky moments by province.</p>
          <Link href="/map" className="homepage-text-link">Visit the Lucky Map <span>→</span></Link>
        </article>
      </section>

      <section id="community" className="homepage-community-banner" aria-labelledby="community-heading">
        <div>
          <p className="homepage-offer-kicker">The Lucky Pick Canada community</p>
          <h2 id="community-heading">Keep the good energy moving.</h2>
          <p>Share a story, celebrate a small win, and connect with fellow Lucky Pick Canada explorers.</p>
        </div>
        <a href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer" className="homepage-community-image">
          <img src={DEFAULT_THEME.assets.communityCover} alt="Lucky Pick Canada Community Facebook group cover" />
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
          <TurnstileField siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAD6xRRyXK4C4YQ1x'} submitButtonId="suggestion-box-submit" />
          <button id="suggestion-box-submit" type="submit" className="suggestion-box-submit">Send suggestion <span aria-hidden="true">→</span></button>
        </form>
      </section>

      <footer className="homepage-footer">Lucky Pick Canada · Made for fun, optimism, and a little everyday magic.</footer>
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

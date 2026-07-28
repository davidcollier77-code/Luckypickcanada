'use client';

import Link from 'next/link';
import LuckyCardReveal from './lucky-card-reveal';
import LuckyMeter from './luck-meter';

const cards = [
  '/lucky-card-ace-spades.svg',
  '/lucky-card-clover.svg',
  '/lucky-card-fortune.svg',
  '/lucky-card-horseshoe.svg',
  '/lucky-card-rabbit-foot.svg',
  '/lucky-card-joker.svg',
];

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
  return (
    <main className="lucky-site-shell homepage-experience">
      <header className="reference-site-header">
        <nav className="reference-site-nav reference-nav-row" aria-label="Primary navigation">
          <a className="reference-brand" href="#top" aria-label="Lucky Pick Canada home">
            <img src="/logo-maple-clover-20260719.svg" alt="" width="48" height="48" />
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
            <img src="/BackgroundEraser_20260724_163638777.png" alt="Lucky Pick Canada maple and clover emblem" />
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
              <img key={src} className={`reference-card reference-card-${['one', 'two', 'three', 'four', 'five', 'six'][index]}`} src={src} alt="" />
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
        <SectionHeading eyebrow="A moment of surprise" title="Reveal your lucky card">
          Choose one card for a small spark of encouragement. Your daily reveal remains just for fun.
        </SectionHeading>
        <LuckyCardReveal />
      </section>

      <section id="personalized" className="homepage-section" aria-labelledby="picks-heading">
        <SectionHeading eyebrow="Made for your next moment" title="Choose your Lucky Pick experience">
          Pick your game, share a gift, or support the experience. Lucky Picks are for entertainment only.
        </SectionHeading>
        <div className="homepage-offer-grid">
          <article className="homepage-offer homepage-offer-featured">
            <p className="homepage-offer-kicker">Personalized Lucky Pick</p>
            <h3>Six or seven numbers. One luminous reveal.</h3>
            <p>Select a 6 Pick or 7 Pick and enjoy your lucky colour and lucky day in the existing reveal experience.</p>
            <div className="homepage-choice-row"><span>6 Pick</span><span>7 Pick</span></div>
            <p className="homepage-offer-note">CAD $1 · Entertainment only</p>
          </article>
          <article className="homepage-offer">
            <p className="homepage-offer-kicker">Gift a little luck</p>
            <h3>Send a bright surprise across Canada.</h3>
            <p>The existing gift package delivers a Lucky Pick reveal and personal greeting for someone you care about.</p>
            <p className="homepage-offer-note">Gift package · CAD $4.99</p>
          </article>
          <article className="homepage-offer">
            <p className="homepage-offer-kicker">Keep the lights glowing</p>
            <h3>Leave a tip for the journey.</h3>
            <p>Support Lucky Pick Canada and help keep the community experience warm, playful, and welcoming.</p>
            <p className="homepage-offer-note">Tip jar · Choose your amount</p>
          </article>
        </div>
      </section>

      <section className="homepage-section homepage-community-grid" aria-label="Lucky Pick Canada community">
        <article className="homepage-community-card">
          <p className="homepage-offer-kicker">Lucky Stories</p>
          <h2>Good fortune travels well.</h2>
          <p>Read uplifting moments shared by the Lucky Pick Canada community from coast to coast.</p>
          <Link href="/lucky-map-of-canada" className="homepage-text-link">Explore Lucky Stories <span>→</span></Link>
        </article>
        <article className="homepage-community-card homepage-map-card">
          <p className="homepage-offer-kicker">Lucky Map</p>
          <h2>Find where luck has landed.</h2>
          <p>Explore the existing Canadian story map and see the community’s lucky moments by province.</p>
          <Link href="/lucky-map-of-canada" className="homepage-text-link">Visit the Lucky Map <span>→</span></Link>
        </article>
      </section>

      <section id="community" className="homepage-community-banner" aria-labelledby="community-heading">
        <div>
          <p className="homepage-offer-kicker">The Lucky Pick Canada community</p>
          <h2 id="community-heading">Keep the good energy moving.</h2>
          <p>Share a story, celebrate a small win, and connect with fellow Lucky Pick Canada explorers.</p>
        </div>
        <a href="https://www.facebook.com/share" target="_blank" rel="noopener noreferrer" className="homepage-community-image">
          <img src="/facebook-community-cover.png" alt="Lucky Pick Canada Community Facebook group cover" />
        </a>
      </section>

      <footer className="homepage-footer">Lucky Pick Canada · Made for fun, optimism, and a little everyday magic.</footer>
    </main>
  );
}

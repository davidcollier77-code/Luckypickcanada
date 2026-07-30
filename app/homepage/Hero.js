'use client';

const heroLinks = [
  { href: '#meter', label: 'Lucky Meter' },
  { href: '#cards', label: 'Lucky Cards' },
  { href: '#community-map', label: 'Community Map' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {
  function scrollToCommunityMap() {
    document.querySelector('#community-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section id="top" className="aurora-stage homepage-hero" aria-labelledby="hero-title">
      <div className="aurora-stage-glow" aria-hidden="true" />
      <nav className="hero-nav" aria-label="Primary navigation">
        <a className="hero-brand" href="#top" aria-label="Lucky Pick Canada home">
          <img src="/BackgroundEraser_20260724_163638777.png" alt="" width="72" height="72" />
          <span>Lucky Pick Canada</span>
        </a>
        <div className="hero-nav-links">
          {heroLinks.map(({ href, label, external }) => (
            <a key={href} href={href} className="hero-nav-link" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="hero-content">
        <div className="hero-emblem-ring" aria-hidden="true">
          <img src="/BackgroundEraser_20260724_163638777.png" alt="" width="220" height="220" />
        </div>
        <p className="hero-kicker">A little Canadian magic ✦ made for today</p>
        <h1 id="hero-title" className="gold-3d">Your luck, personalized.</h1>
        <p className="hero-copy">Follow the aurora into a playful daily ritual of lucky numbers, cards, stories, and good energy from coast to coast.</p>
        <button type="button" className="cta-glow" onClick={scrollToCommunityMap}>Explore the Community Map <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

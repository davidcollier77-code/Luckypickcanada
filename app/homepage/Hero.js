'use client';

const heroLinks = [
  { href: '#lucky-meter', label: 'Lucky Meter' },
  { href: '#cards', label: 'Today’s Lucky Moment' },
  { href: '#community-map', label: 'Community Map' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {
  function scrollToLuckyMeter() {
    document.querySelector('#lucky-meter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section id="top" className="aurora-stage homepage-hero" aria-labelledby="hero-title">
      <div className="aurora-stage-glow" aria-hidden="true" />
      <nav className="hero-nav" aria-label="Primary navigation">
        <a className="hero-brand" href="#top" aria-label="Lucky Pick Canada home">
          <img src="/BackgroundEraser_20260724_163638777.png" alt="LuckyPickCanada primary branding logo" width="72" height="72" />
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
        <img className="hero-emblem" src="/BackgroundEraser_20260724_163638777.png" alt="" width="460" height="460" aria-hidden="true" />
        <p className="hero-kicker">A little Canadian magic ✦ made for today</p>
        <h1 id="hero-title" className="gold-3d">Your daily lucky moment.</h1>
        <p className="hero-copy">A Canadian digital entertainment experience focused on lucky moments, positive messages, personalized picks, and community stories.</p>
        <p className="hero-supporting-copy">LuckyPickCanada is a digital entertainment experience created for fun, positive moments, and community connection. Discover your daily lucky moment, explore personalized picks, share stories, and enjoy a little Canadian magic every day.</p>
        <button type="button" className="cta-glow" onClick={scrollToLuckyMeter}>Reveal Your Daily Luck <span aria-hidden="true">→</span></button>
      </div>
    </section>
  );
}

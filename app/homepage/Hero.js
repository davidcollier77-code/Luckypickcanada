'use client';


const heroLinks = [
  { href: '/lucky-meter', label: 'Lucky Meter' },
  { href: '#cards', label: 'Today’s Lucky Moment' },
  { href: '#community-map', label: 'Community Map' },
  { href: 'https://www.facebook.com/groups/1060808069624999/', label: 'Facebook Group', external: true },
];

export default function Hero() {
  return (
    <section id="top" className="aurora-stage homepage-hero hero-container" aria-labelledby="hero-title">
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
        <div className="hero-emblem-wrapper">
          <div className="sparkles-layer" aria-hidden="true">
            <div className="sparkle sparkle-1">✦</div>
            <div className="sparkle sparkle-2">✦</div>
            <div className="sparkle sparkle-3">✦</div>
            <div className="sparkle sparkle-4">✦</div>
            <div className="sparkle sparkle-5">✦</div>
            <div className="sparkle sparkle-6">✦</div>
          </div>
          <img className="hero-emblem" src="/BackgroundEraser_20260724_163638777.png" alt="Lucky Pick Canada emblem showing maple leaf and clover design" width="460" height="460" />
        </div>
        <p className="hero-kicker !mt-0 tracking-widest">A little Canadian magic ✦ made for today</p>
        <h1 id="hero-title" className="gold-3d drop-shadow-lg">Your daily lucky moment.</h1>
        <p className="hero-copy text-lg sm:text-xl !mb-2">A Canadian digital entertainment experience focused on lucky moments, positive messages, personalized picks, and community stories.</p>
        <p className="hero-supporting-copy text-base sm:text-lg !mb-4">LuckyPickCanada is a digital entertainment experience created for fun, positive moments, and community connection. Discover your daily lucky moment, explore personalized picks, share stories, and enjoy a little Canadian magic every day.</p>
        <div className="button-wrapper !mt-2">
          <a className="cta-glow transition-transform hover:scale-105" href="/lucky-meter">Reveal Today’s Luck <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}

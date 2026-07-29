'use client';

const heroLinks = [
  { href: '#meter', label: 'Lucky Meter', className: 'homepage-hero-overlay-meter' },
  { href: '#cards', label: 'Lucky Cards', className: 'homepage-hero-overlay-cards' },
  { href: '#personalized', label: 'Lucky Picks', className: 'homepage-hero-overlay-picks' },
  { href: '#community', label: 'Community', className: 'homepage-hero-overlay-community' },
];

export default function Hero() {
  function scrollToLuckyMeter() {
    window.location.hash = 'meter';
  }

  return (
    <section
      id="top"
      className="homepage-hero"
      aria-label="LuckyPickCanada: a little Canadian magic made for today"
    >
      <nav className="homepage-hero-overlay-nav" aria-label="Primary navigation">
        {heroLinks.map(({ href, label, className }) => (
          <a key={href} href={href} className={`homepage-hero-overlay-link ${className}`}>
            <span className="sr-only">{label}</span>
          </a>
        ))}
      </nav>
      <button type="button" className="homepage-hero-overlay-action" onClick={scrollToLuckyMeter}>
        <span className="sr-only">Find your lucky energy</span>
      </button>
    </section>
  );
}

export default function Hero() {
  return (
    <section id="top" className="homepage-hero" aria-labelledby="homepage-title">
      <div className="reference-hero-copy">
        <p className="reference-hero-kicker">A little Canadian magic <span>✦</span> made for today</p>
        <h1 id="homepage-title" className="reference-hero-title">Your luck,<br /><span>personalized.</span></h1>
        <p className="reference-hero-description">Follow the aurora into a playful daily ritual of lucky numbers, cards, stories, and good energy from coast to coast.</p>
        <div className="homepage-hero-actions">
          <a className="reference-hero-button" href="#meter">Find your lucky energy <span>✦</span></a>
          <a className="homepage-text-link" href="#personalized">Explore Lucky Picks</a>
        </div>
      </div>

      <div className="reference-card-section" aria-hidden="true">
        <img className="homepage-hero-artwork" src="/1785347037732.png" alt="" />
      </div>
    </section>
  );
}

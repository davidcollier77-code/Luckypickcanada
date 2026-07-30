export default function Header() {
  return (
    <header className="reference-site-header">
      <nav className="reference-site-nav reference-nav-row" aria-label="Primary navigation">
        <a className="reference-brand" href="#top" aria-label="Lucky Pick Canada home">
          <span>Lucky Pick Canada</span>
        </a>
        <div className="reference-nav-links">
          <a className="premium-nav-link" href="#lucky-meter">Lucky Meter</a>
          <a className="premium-nav-link" href="#cards">Lucky Cards</a>
          <a className="premium-nav-link" href="#community-map">Community Map</a>
          <a className="premium-nav-link" href="https://www.facebook.com/groups/1060808069624999/" target="_blank" rel="noopener noreferrer">Facebook Group</a>
        </div>
      </nav>
    </header>
  );
}

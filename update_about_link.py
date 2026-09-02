import re

with open('app/homepage/HomePage.js', 'r') as f:
    content = f.read()

# Add a teaser for the About page near the bottom above the FAQ
about_teaser = """
      <section className="homepage-section" aria-labelledby="about-teaser-heading">
        <div className="homepage-section-heading">
          <p>Behind the Magic</p>
          <h2 id="about-teaser-heading">Our Story</h2>
          <span>Discover how Lucky Pick Canada started and the inspiration behind this digital experience.</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/about" className="cta-glow transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(234, 190, 82, 0.5)', color: 'white', fontWeight: 'bold', textDecoration: 'none' }}>
            Read About the Creator <span aria-hidden="true" style={{ marginLeft: '8px' }}>→</span>
          </Link>
        </div>
      </section>
"""

# Insert right before FAQSection or suggestion-box
content = content.replace('<section id="suggestion-box"', about_teaser + '\n      <section id="suggestion-box"')

with open('app/homepage/HomePage.js', 'w') as f:
    f.write(content)

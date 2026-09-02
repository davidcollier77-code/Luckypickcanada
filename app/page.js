import HomePage from './homepage/HomePage';
import Hero from './homepage/Hero';
import FAQSection from './homepage/FAQSection';

export const dynamic = 'force-static';

import Link from 'next/link';

export default function Page() {
  return (
    <>
      <div className="aurora-container">
        <div className="aurora-layer aurora-layer-1"></div>
        <div className="aurora-layer aurora-layer-2"></div>
        <div className="aurora-layer aurora-layer-3"></div>
        <div className="aurora-layer aurora-layer-4"></div>
      </div>
      <Hero />
      <HomePage />
      <FAQSection />

      {/* Low-Profile SEO Text Section */}
      <section
        className="homepage-seo-section"
        style={{
          marginTop: '40px',
          padding: '24px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '800px',
          marginInline: 'auto',
          textAlign: 'left',
          opacity: '0.9'
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
          About Lucky Pick Canada
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Welcome to <strong>Lucky Pick Canada</strong>, a Canadian digital entertainment experience made to bring a little luck and a little magic to your day. Whether you are checking your daily luck meter, exploring community stories, or drawing unique cards, our site brings a fun and engaging digital experience directly to your screen.
        </p>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Our digital card decks feature tiered card reveals—ranging from standard draws to premium cards like <em>Coast to Coast</em>—designed to make every pick exciting. Use our random pick tool for daily decisions, entertainment, or simply testing your fortune today.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '16px' }}>
          Lucky Pick Canada is intended strictly for entertainment purposes. Enjoy your daily draws and see what luck has in store for you!
        </p>
      </section>

      {/* About the Creator Teaser */}
      <section
        className="homepage-seo-section"
        style={{
          marginTop: '40px',
          padding: '24px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          maxWidth: '800px',
          marginInline: 'auto',
          textAlign: 'center',
          opacity: '0.9'
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600', color: '#fbbf24' }}>
          Our Story
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px' }}>
          LuckyPickCanada is a solo, one-person creative project built right here in Nova Scotia. It started as a simple idea for everyday positivity and has grown into a small, cozy corner of the internet.
        </p>
        <Link
          href="/about"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease-in-out'
          }}
          className="hover:bg-amber-400/20 hover:border-amber-400/40"
        >
          Read the Full Story
        </Link>
      </section>
    </>
  );
}

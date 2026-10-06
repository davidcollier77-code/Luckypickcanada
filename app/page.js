import HomePage from './homepage/HomePage';
import Hero from './homepage/Hero';

export const dynamic = 'force-static';


/**
 * Composes the static homepage with its sky backdrop, hero, interactive content,
 * FAQ, and introductory sections.
 *
 * @returns {import('react').ReactElement} The complete homepage.
 */
export default function Page() {
  return (
    <>
      <div className="homepage-sky-backdrop" aria-hidden="true" />
      <Hero />
      <HomePage />

      {/* Low-Profile SEO Text Section */}
      <section
        className="homepage-seo-section premium-surface"
        style={{

          padding: '32px 24px',
          maxWidth: '800px',
          marginInline: 'auto',
          textAlign: 'left',
          color: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        <h1 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
          About Lucky Pick Canada
        </h1>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Welcome to <strong>Lucky Pick Canada</strong>, a Canadian digital entertainment experience made to bring a little luck and a little magic to your day. Whether you are checking your daily luck meter, exploring community stories, or drawing unique cards, our site brings a fun and engaging digital experience directly to your screen.
        </p>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Our digital card decks feature tiered card reveals—ranging from standard draws to premium cards like <em>Coast to Coast</em>—designed to make every pick exciting. Use our random pick tool for daily decisions, entertainment, or simply testing your fortune today.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#bbb', marginTop: '16px' }}>
          Lucky Pick Canada is intended strictly for entertainment purposes. Enjoy your daily draws and see what luck has in store for you!
        </p>
      </section>

    </>
  );
}

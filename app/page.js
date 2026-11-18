import HomePage from './homepage/HomePage';
import SkyBackdrop from './components/SkyBackdrop';
import { AboutTeaserSection, CommunityStoriesSection } from './homepage/HomeStaticSections';
import Hero from './homepage/Hero';
import JsonLd from './components/JsonLd';
import { faqItems } from './homepage/faq-content';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqItems.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

export const dynamic = 'force-static';

/**
 * Composes the static homepage with its sky backdrop, hero, interactive content,
 * FAQ, and introductory sections.
 *
 * The Turnstile script is deliberately not hinted here. The Suggestion Box that
 * needs it sits far below the fold, so `TurnstileField` requests the widget (and
 * with it the challenge runtime) only once the field approaches the viewport.
 * Hinting the script up front spent the visitor's first bandwidth on a
 * third-party payload the LCP image needs instead.
 *
 * @returns {import('react').ReactElement} The complete homepage.
 */
export default function Page() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <SkyBackdrop />
      <Hero />
      {/* The homepage shell is a client component, but the sections that need no
          state are rendered here, on the server, and handed in as slots. Their
          markup is streamed as server output and stays out of the hydration
          tree, which is the cheapest way to keep below-the-fold content
          identical while reducing what the browser has to hydrate. */}
      <HomePage
        slots={{
          communityStories: <CommunityStoriesSection />,
          aboutTeaser: <AboutTeaserSection />,
        }}
      />

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
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: '600' }}>
          About Lucky Pick Canada
        </h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Welcome to <strong>Lucky Pick Canada</strong>, a digital entertainment destination created to bring a little everyday magic to your screen. Whether you are checking your daily luck resonance or exploring community stories, our experiences are designed to spark optimism.
        </p>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
          Our animated card decks feature tiered reveals—ranging from standard draws to premium cards like <em>Coast to Coast</em>. Enjoy your daily draws and see what luck has in store for you!
        </p>
        <p style={{ fontSize: '0.85rem', color: '#bbb', marginTop: '16px' }}>
          Lucky Pick Canada is intended strictly for entertainment purposes and has no affiliation with real-world lotteries or gambling services.
        </p>
      </section>

    </>
  );
}

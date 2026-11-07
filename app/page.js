import { preload } from 'react-dom';
import HomePage from './homepage/HomePage';
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

// The pinned @marsidev/react-turnstile 1.6.1 loader appends this exact URL from a
// mount effect, so the Suggestion Box security check cannot begin fetching the
// API until React has hydrated the homepage. Emitting the hint from the initial
// document lets that two-hop fetch overlap hydration instead of following it.
// `fetchPriority: 'low'` keeps the 86.7 KB third-party script behind the LCP
// image and the route's own CSS/JS, which is what the mobile PageSpeed work
// protects; the script is not executed here, so the wrapper still registers
// onloadTurnstileCallback before it injects the executing tag.
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';

/**
 * Composes the static homepage with its sky backdrop, hero, interactive content,
 * FAQ, and introductory sections.
 *
 * @returns {import('react').ReactElement} The complete homepage.
 */
export default function Page() {
  // React's resource API emits the hint in <head> during server rendering.
  preload(TURNSTILE_SCRIPT_URL, { as: 'script', fetchPriority: 'low' });

  return (
    <>
      <JsonLd data={faqSchema} />
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

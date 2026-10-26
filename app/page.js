import { preload } from 'react-dom';
import HomePage from './homepage/HomePage';
import Hero from './homepage/Hero';
import JsonLd from './components/JsonLd';

const faqItems = [
  {
    question: "How does the daily Lucky Pick card generator work?",
    answer: "Our daily card generator lets you reveal one collectible digital card every 24 hours. The system selects your daily card from our digital deck to offer a unique spark of encouragement. You can build your collection over time, as every card you reveal is saved to your personal digital binder. The cards feature varying rarities to make each daily draw a fun piece of digital entertainment! (Please note: Lucky Pick Canada is strictly for entertainment and has no affiliation with real-world lotteries or gambling)."
  },
  {
    question: "What is the Lucky Meter (Daily Resonance Ritual) and how does it work?",
    answer: "The Lucky Meter, or Daily Resonance Ritual, is a playful way to check your daily resonance! When you awaken your resonance, the site generates a unique percentage from 0 to 100%, paired with an uplifting, Canadian-themed quote. You can check back every day for a new reading. Lucky Pick Canada is a digital entertainment experience made for fun, with no affiliation with real-world gambling or lottery prizes."
  },
  {
    question: "Is Lucky Pick Canada free to play?",
    answer: "Yes! The core Lucky Pick Canada experience, including checking the Daily Lucky Meter, browsing the Community Map, and reading Lucky Stories, is entirely free to access. We also offer optional premium digital gift experiences and personalized multi-picks for a small fee if you want to share a lucky moment with someone else."
  },
  {
    question: "What are Lucky Stories and the Community Map?",
    answer: "Lucky Stories are community-submitted stories about luck and good fortune. A story may be associated with a province/location when applicable. Eligible stories can be represented on the Lucky Map, which is the geographic visualization of the community stories. Clicking a map marker allows visitors to view the associated story."
  },
  {
    question: "Is Lucky Pick Canada intended for entertainment?",
    answer: "Yes! Lucky Pick Canada is designed strictly for entertainment and positive encouragement. We do not provide lottery services, gambling, or real-money payouts. The card reveals and features are simply fun digital experiences designed to bring a little everyday magic and optimism to your routine."
  },
  {
    question: "How do gift experiences work?",
    answer: "Our gift experiences allow you to send a premium, interactive digital card reveal to a friend or loved one. When you purchase a gift package, we send a beautifully styled email to the recipient containing a unique link. Once they click the link, they get to enjoy a specialized, animated slow reveal of their lucky jewel-themed picks!"
  },
  {
    question: "What is the Lucky Crystal Ball?",
    answer: "The Lucky Crystal Ball is an AI-powered oracle that delivers playful, mystical fortunes and daily guidance. Simply ask a question to receive a whimsical reading steeped in Canadian magic!"
  }
];

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

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';

/**
 * Composes the static homepage with its sky backdrop, hero, interactive content,
 * FAQ, and introductory sections.
 *
 * @returns {import('react').ReactElement} The complete homepage.
 */
export default function Page() {
  // Emit the resource hint during server rendering so React places it in <head>.
  // Keep this URL identical to the pinned Turnstile wrapper's injected script URL.
  preload(TURNSTILE_SCRIPT_URL, { as: 'script' });

  return (
      <JsonLd data={faqSchema} />
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

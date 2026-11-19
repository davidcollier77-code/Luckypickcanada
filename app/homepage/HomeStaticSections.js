import IntentPrefetchLink from '../../components/IntentPrefetchLink';

/**
 * Sections of the homepage that carry no state and no event handlers.
 *
 * These are deliberately plain server components: `app/page.js` renders them and
 * hands them to the interactive homepage shell as slots, so their markup is
 * streamed as server output and never joins the client hydration tree. Anything
 * that needs state, an effect or a handler stays in HomePage and arrives as its
 * own small client island instead.
 */

/**
 * The Lucky Community Stories card, including its decorative backdrop.
 *
 * @returns {import('react').ReactElement} The community stories section.
 */
export function CommunityStoriesSection() {
  return (
    <section id="community-section" className="homepage-section" aria-labelledby="community-stories-heading">
      <div className="homepage-community-grid" style={{ gridTemplateColumns: '1fr' }}>
        <article id="community-stories" className="homepage-community-card relative overflow-hidden" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: '28px', border: '1px solid rgba(255, 235, 160, 0.15)', boxShadow: '0 24px 70px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
        {/* Decorative card backdrop, far below the fold: lazy so it never competes
            with the hero artwork for the visitor's first bandwidth. */}
        <img src="/community-stars-bg.webp" alt="" className="absolute inset-0 z-0 object-cover opacity-40 mix-blend-screen" sizes="(max-width: 1000px) 100vw, 1000px" loading="lazy" decoding="async" />
        <div className="relative z-10">
        <p className="homepage-offer-kicker">COMMUNITY</p>
        <h2 id="community-stories-heading" className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Lucky Community Stories</h2>
        <p className="text-[15px] sm:text-base text-white/80 leading-relaxed mb-3">Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.</p>
        <p className="homepage-offer-note">Please note: these are not business reviews or testimonials.</p>
        <IntentPrefetchLink href="/map" className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span className="gold-cta-emoji" aria-hidden="true">🍀</span>EXPLORE LUCKY COMMUNITY STORIES →</IntentPrefetchLink>
        </div>
      </article>
    </div>
    </section>
  );
}

/**
 * The "About the Creator" teaser that closes the homepage.
 *
 * @returns {import('react').ReactElement} The creator teaser section.
 */
export function AboutTeaserSection() {
  return (
    <section
      className="homepage-about-teaser premium-surface"
      style={{

        padding: '32px 24px',
        maxWidth: '700px',
        marginInline: 'auto',
        textAlign: 'center'
      }}
    >
      <p className="homepage-offer-kicker" style={{ color: '#eabe52', marginBottom: '8px' }}>MEET THE CREATOR</p>
      <h2 style={{ fontSize: '1.75rem', color: 'white', marginBottom: '12px' }}>About the Creator &amp; Our Story</h2>
      <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '20px' }}>
        Discover the story behind Lucky Pick Canada and the journey that brought this digital experience to life.
      </p>
      <IntentPrefetchLink
        href="/about"
        className="gold-3d-btn relative group inline-flex items-center justify-center px-6 py-3 rounded-full bg-linear-to-b from-yellow-400 to-amber-600 text-slate-900 font-bold transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6),inset_0_2px_2px_rgba(255,255,255,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <span className="gold-cta-emoji" aria-hidden="true">ℹ️</span>Read Our Story <span aria-hidden="true">→</span>

      </IntentPrefetchLink>
    </section>
  );
}

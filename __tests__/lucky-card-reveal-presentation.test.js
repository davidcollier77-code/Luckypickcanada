import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural guard for `specs/094-lucky-card-reveal-polish`.
 *
 * `app/lucky-card-reveal.js` is a JSX-in-`.js` Next.js component: the Vitest
 * pipeline refuses to parse JSX in `.js` files, so the component itself cannot
 * be rendered in jsdom the way `app/lucky-reveal-celebration.jsx` is. This guard
 * therefore pins the exact markup contract the browser probe measured (see the
 * PR summary), while `__tests__/lucky-card-tier-presentation.test.js` executes
 * the real tier values that drive it.
 */

const componentPath = resolve(process.cwd(), 'app/lucky-card-reveal.js');
const source = readFileSync(componentPath, 'utf8');

describe('Lucky Card reveal presentation markup', () => {
  it('renders the entry control as a large, described, tappable button', () => {
    const button = source.slice(source.indexOf('<button'), source.indexOf('</button>'));

    expect(button).toContain('onClick={triggerCardDraw}');
    expect(button).toContain('aria-describedby="lucky-card-reveal-hint"');
    expect(button).toContain('gold-3d-btn');
    // px, not rem: the page root font-size drops to 15px on mobile, so a rem-based
    // minimum would fall below the 56 px touch target.
    expect(button).toContain('style={{ minHeight: 56 }}');
    expect(button).toContain('cursor-pointer');
    expect(button).toContain('touch-manipulation');
    expect(button).toContain('w-full');
    expect(button).toContain('sm:w-auto');
    // The accessible name is produced by the visible label only.
    expect(button).toContain('{isGenerating ? \'Revealing...\' : "Reveal Today\'s Luck"}');
    expect(button).toContain('<span className="gold-cta-emoji" aria-hidden="true">♠</span>');

    expect(source).toContain('id="lucky-card-reveal-hint"');
    expect(source).toContain("'Tap to reveal today’s Lucky Card'");
    expect(source).toContain("'Drawing your Lucky Card…'");
  });

  it('drives the revealed presentation from the shared tier module', () => {
    expect(source).toContain(
      "import { getLuckyCardTierPresentation } from './lucky-card-presentation';",
    );
    expect(source).toContain('const tierPresentation = getLuckyCardTierPresentation(selectedCard?.tier);');

    // Tier chip, card name and collection caption.
    expect(source).toContain('data-tier={tierPresentation.id}');
    expect(source).toContain('{tierPresentation.label} Tier');
    expect(source).toContain('<h2 className="text-2xl font-black tracking-tight text-white drop-shadow-lg">{selectedCard.title}</h2>');
    expect(source).toContain('Series 1 · Added to your collection');
    expect(source).toContain('color: tierPresentation.chipText');
    expect(source).toContain('backgroundColor: `rgba(${tierPresentation.accentRgb}, 0.12)`');

    // Quote panel border picks up the tier accent without changing its layout.
    expect(source).toContain('style={{ borderColor: `rgba(${tierPresentation.accentRgb}, 0.3)` }}');
  });

  it('adds a decorative, reduced-motion-aware tier halo behind the revealed card', () => {
    expect(source).toContain('data-card-halo={tierPresentation.id}');
    expect(source).toContain('{isRevealed && selectedCard && (');
    expect(source).toContain('<div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">');
    expect(source).toContain('initial={shouldReduceMotion ? false : { opacity: 0 }}');
    expect(source).toContain('duration: shouldReduceMotion ? 0 : tierPresentation.revealDuration');
    expect(source).toContain('filter: `blur(${tierPresentation.haloBlur}px)`');

    // Tier-accented inner ring on the revealed card front.
    expect(source).toContain('boxShadow: `inset 0 0 0 2px rgba(${tierPresentation.accentRgb}, ${tierPresentation.frameOpacity}), inset 0 0 26px rgba(${tierPresentation.accentRgb}, ${tierPresentation.innerGlow})`');
  });

  it('preserves the existing reveal functionality and artwork delivery', () => {
    // Draw weighting, anti-repeat and daily lock are untouched.
    expect(source).toContain("const STORAGE_KEY = 'lucky-pick-canada-todays-lucky-moment';");
    expect(source).toContain('selectWeightedLuckyCard(previousCardId)');
    expect(source).toContain('selectRandomQuote(previousQuote)');
    expect(source).toContain("window.localStorage.setItem('unlockedCards', JSON.stringify(collection));");

    // Tier hit counts and the flip timings that drive the canvas/audio choreography.
    expect(source).toContain('const TIER_HITS = {\n  standard: 3,\n  premium: 4,\n  flagship: 5\n};');
    expect(source).toContain('const FINAL_FLIP_TIME = 0.6;');
    expect(source).toContain('const FINAL_FLIP_DURATION = 1.2;');

    // Authored audio cues are still the ones scheduled by the reveal.
    for (const cue of [
      '/sounds/standard_beam_shot.mp3',
      '/sounds/standard_final_beam.mp3',
      '/sounds/standard_beam_impact.mp3',
      '/sounds/standard_final_lock.mp3',
      '/sounds/standard_final_discharge.mp3',
      '/sounds/standard_reveal_snap.mp3',
      '/sounds/standard_electrical_arc.mp3',
      '/sounds/standard_card_shake.mp3',
    ]) {
      expect(source).toContain(cue);
    }

    // AVIF-first with WebP fallback, the shared backdrop and the card back art.
    expect(source).toContain('srcSet={selectedCard.image}');
    expect(source).toContain("selectedCard.image.replace('.avif', '.webp')");
    expect(source).toContain('srcSet="/IMG_20260728_220305_112042.avif"');
    expect(source).toContain('srcSet="/NGC4216_crawford.avif"');

    // The coast-to-coast artwork keeps its authored frame exception.
    expect(source).toContain("const preserveCoastToCoastPolish = selectedCard?.id === 'coast-to-coast-tale';");
    expect(source).toContain('{!preserveCoastToCoastPolish && (');

    // Sharing, the collection binder and the return-home link still render.
    expect(source).toContain('<LuckyCardShare card={selectedCard}/>');
    expect(source).toContain('<CollectionBinder />');
    expect(source).toContain('Return to Home');
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural guard for `specs/094-lucky-card-reveal-polish` (entry affordance,
 * tier chip, halo/rim) and `specs/101-lucky-card-reveal-cinematics` (cinematic
 * stage, shared two-face finish, staged arrival).
 *
 * `app/lucky-card-reveal.js` is a JSX-in-`.js` Next.js component: the Vitest
 * pipeline refuses to parse JSX in `.js` files, so the component itself cannot
 * be rendered in jsdom the way `app/lucky-reveal-celebration.jsx` is. This guard
 * therefore pins the exact markup contract, the executed tier values that drive
 * it live in `__tests__/lucky-card-tier-presentation.test.js`, and the rendered
 * behaviour is measured by `artifacts/reveal-card-cinematics/probe.cjs`.
 */

const componentPath = resolve(process.cwd(), 'app/lucky-card-reveal.js');
const source = readFileSync(componentPath, 'utf8');
const cardFinishUsages = source.match(/<CardFinish[^>]*\/>/g) || [];

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

  it('paints one glossy finish on both faces of every card', () => {
    expect(cardFinishUsages).toHaveLength(2);
    expect(cardFinishUsages[0]).toContain('revealed={false}');
    expect(cardFinishUsages[1]).toContain('revealed={isRevealed}');

    // Both faces receive the same three always-on layers, plus the revealed-only
    // tier bloom and single glint pass, all from the one finish component.
    expect(source).toContain("data-card-finish={tierPresentation.id}");
    expect(source).toContain('data-card-finish-state={revealed ? \'revealed\' : \'idle\'}');
    for (const layer of ['gloss', 'specular', 'bevel', 'tier-bloom', 'glint']) {
      expect(source.match(new RegExp(`data-card-finish-layer="${layer}"`, 'g')) || []).toHaveLength(1);
    }
    expect(source).toContain('CARD_GLOSS_STYLE');
    expect(source).toContain('CARD_SPECULAR_STYLE');
    expect(source).toContain('CARD_BEVEL_STYLE');

    // The old single flat sheen is gone, so no card can fall back to it.
    expect(source).not.toContain('cardPolishSheenStyle');
    expect(source).not.toContain('{!preserveCoastToCoastPolish && (');

    // Coast-to-Coast Tale keeps its authored frame and still gets the finish and
    // the tier ring, so all eleven cards share one presentation.
    expect(source).toContain("const preserveCoastToCoastPolish = selectedCard?.id === 'coast-to-coast-tale';");
    expect(source).toContain('style={preserveCoastToCoastPolish ? undefined : cardPolishFrameStyle}');
  });

  it('adds a cinematic, tier-scaled stage behind the revealed card', () => {
    expect(source).toContain('data-reveal-stage={tierPresentation.id}');
    expect(source).toContain('data-reveal-charge={tierPresentation.id}');
    expect(source).toContain('data-reveal-spotlight={tierPresentation.id}');
    expect(source).toContain('data-reveal-shaft={tierPresentation.id}');
    expect(source).toContain('data-reveal-shockwave="primary"');
    expect(source).toContain('data-reveal-shockwave="echo"');
    expect(source).toContain('data-reveal-ember=""');
    expect(source).toContain('data-reveal-floor={tierPresentation.id}');
    expect(source).toContain('const REVEAL_EMBERS = [');

    // Every stage value comes from the tier module, not from local magic numbers.
    for (const value of [
      'tierPresentation.spotlightOpacity',
      'tierPresentation.shockwaveOpacity',
      'tierPresentation.shockwaveScale',
      'tierPresentation.glossOpacity',
      'tierPresentation.sweepDuration',
      'tierPresentation.emberOpacity',
    ]) {
      expect(source).toContain(value);
    }

    // Decorative only: never announced, never interactive.
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain('className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"');
  });

  it('keeps the reveal moment accessible under reduced motion', () => {
    // The static lighting stays visible without a fade...
    expect(source).toContain('data-card-halo={tierPresentation.id}');
    expect(source).toContain('initial={shouldReduceMotion ? false : { opacity: 0 }}');
    expect(source).toContain('duration: shouldReduceMotion ? 0 : tierPresentation.revealDuration');
    expect(source).toContain('filter: `blur(${tierPresentation.haloBlur}px)`');
    expect(source).toContain('initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}');
    expect(source).toContain('initial={shouldReduceMotion ? false : { opacity: 0, scaleX: 0.82 }}');

    // ...while every one-shot layer is not mounted at all.
    const oneShotSection = source.slice(
      source.indexOf('{!shouldReduceMotion && ('),
      source.indexOf('data-reveal-floor'),
    );
    expect(oneShotSection).toContain('data-reveal-shockwave="primary"');
    expect(oneShotSection).toContain('data-reveal-ember=""');
    expect(source).toContain('{revealed && !shouldReduceMotion && (');

    // The tier accent ring on the revealed front is unchanged.
    expect(source).toContain('boxShadow: `inset 0 0 0 2px rgba(${tierPresentation.accentRgb}, ${tierPresentation.frameOpacity}), inset 0 0 26px rgba(${tierPresentation.accentRgb}, ${tierPresentation.innerGlow})`');
  });

  it('settles the revealed presentation in sequence', () => {
    expect(source).toContain('delay: shouldReduceMotion ? 0 : 0.12');
    expect(source).toContain('delay: shouldReduceMotion ? 0 : 0.24');
    expect(source).toContain('delay: shouldReduceMotion ? 0 : 0.34');

    // Copy, order and layout of the revealed blocks are unchanged.
    const chipIndex = source.indexOf('{tierPresentation.label} Tier');
    const titleIndex = source.indexOf('{selectedCard.title}');
    const quoteIndex = source.indexOf('{selectedCard.quote');
    const shareIndex = source.indexOf('<LuckyCardShare card={selectedCard}/>');
    expect(chipIndex).toBeGreaterThan(0);
    expect(titleIndex).toBeGreaterThan(chipIndex);
    expect(quoteIndex).toBeGreaterThan(titleIndex);
    expect(shareIndex).toBeGreaterThan(quoteIndex);
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
    expect(source).toContain('/NGC4216_crawford-1280w.avif 1280w');
    expect(source).toContain('/NGC4216_crawford-1920w.avif 1920w');
    expect(source).toContain('/NGC4216_crawford.avif 2949w');

    // Sharing, the collection binder and the return-home link still render.
    expect(source).toContain('<LuckyCardShare card={selectedCard}/>');
    expect(source).toContain('<CollectionBinder />');
    expect(source).toContain('Return to Home');

    // No dependency, module or asset was added to the reveal.
    const imports = source
      .split('\n')
      .filter(line => line.startsWith('import '))
      .map(line => line.trim());
    expect(imports).toEqual([
      "import { useEffect, useRef, useState, useCallback } from 'react';",
      "import Link from 'next/link';",
      "import CollectionBinder from './collection-binder';",
      "import { Howl } from 'howler';",
      "import { motion, useAnimate, useReducedMotion } from 'framer-motion';",
      "import { LUCKY_CARDS, selectWeightedLuckyCard, selectRandomQuote } from './lucky-card-data';",
      "import { getLuckyCardTierPresentation } from './lucky-card-presentation';",
      "import LuckyCardShare from './lucky-card-share';",
      "import { playButtonClick } from './lib/audio';",
      "import MidnightCountdown from '../components/midnight-countdown';",
    ]);
  });
});

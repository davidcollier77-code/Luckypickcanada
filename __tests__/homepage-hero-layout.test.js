import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Source guard for `specs/117-homepage-hero-reference-layout`.
 *
 * The reference layout orders the hero as: navigation, emblem/tagline/wordmark,
 * maple-leaf divider, welcome panel, the same divider again, then the painted
 * "EXPLORE YOUR LUCK" line and chevron. The single flattened painting is shown
 * through measured row windows, so the artwork is reused rather than redrawn,
 * the branding is never shrunk to fit a fixed screen height, and the preserved
 * content, delivery and interactive control stay in place.
 */

const read = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');

const heroSource = read('app/homepage/Hero.js');
const heroCss = read('themes/default/hero.css');
const exploreSource = read('app/homepage/ExploreLuckButton.js');

/** Returns the index of the first match, failing loudly when it is absent. */
function indexOfOrFail(haystack, needle) {
  const index = haystack.indexOf(needle);
  expect(index, `expected to find ${needle}`).toBeGreaterThan(-1);
  return index;
}

describe('Reference hero composition', () => {
  it('renders emblem, divider, panel, divider and the Explore line in order', () => {
    const emblem = indexOfOrFail(heroSource, 'hero-art-slice--emblem');
    const dividerTop = indexOfOrFail(heroSource, 'hero-art-divider--top');
    const panel = indexOfOrFail(heroSource, 'className="hero-welcome"');
    const dividerBottom = indexOfOrFail(heroSource, 'hero-art-divider--bottom');
    const explore = indexOfOrFail(heroSource, 'hero-art-slice--explore');

    expect(emblem).toBeLessThan(dividerTop);
    expect(dividerTop).toBeLessThan(panel);
    expect(panel).toBeLessThan(dividerBottom);
    expect(dividerBottom).toBeLessThan(explore);
  });

  it('reuses the painting divider band twice instead of drawing a new one', () => {
    const dividerSlices = heroSource.match(/hero-art-slice--divider/g) ?? [];

    expect(dividerSlices).toHaveLength(2);
    // These are the two divider windows plus the Explore window. The emblem call
    // passes alt/loading/fetchPriority props, so it is intentionally not matched.
    expect(heroSource).toContain('Row bands measured from the painting');
    const bareArtworkUsages = heroSource.match(/<HeroArtwork \/>/g) ?? [];
    expect(bareArtworkUsages).toHaveLength(3);
  });

  it('sizes the artwork from its width instead of a fixed screen height', () => {
    expect(heroSource).not.toContain('100svh');
    expect(heroSource).not.toMatch(/minHeight/);
    expect(heroCss).toContain('.hero-artwork-column {');
    expect(heroCss).toContain('width: min(100%, 46rem);');
  });

  it('keeps every window at the painting proportions and row offsets', () => {
    expect(heroCss).toContain('.hero-art-slice { position: relative; width: 100%; overflow: hidden; }');
    expect(heroCss).toContain('.hero-art-slice--emblem { aspect-ratio: 1024 / 1090; }');
    expect(heroCss).toContain('.hero-art-slice--divider { aspect-ratio: 1024 / 84; --hero-art-offset: calc(-1222 / 84 * 100%); }');
    expect(heroCss).toContain('.hero-art-slice--explore { aspect-ratio: 1024 / 200; --hero-art-offset: calc(-1306 / 200 * 100%); }');
    expect(heroCss).toContain('top: var(--hero-art-offset, 0%);');
    expect(heroCss).toContain('width: 100%;\n  height: auto;');
  });

  it('keeps the welcome panel and its copy while removing the oversized CTA and gold note', () => {
    expect(heroSource).toContain('<h1 className="hero-welcome-title">Lucky Pick Canada</h1>');
    expect(heroSource).toContain('A fun, free place to explore what luck means to you.');
    expect(heroSource).toContain('Try the Luck Generator for a daily reading, ask the Crystal Ball a question, and read');
    expect(heroSource).toContain('Lucky Community Stories shared from across Canada.');
    expect(heroSource).not.toContain('hero-welcome-cta');
    expect(heroSource).not.toContain('Explore free experiences');
    expect(heroSource).not.toContain('Free to enjoy · For fun and entertainment only');
    // Keep the panel's dark, gold-edged treatment while making its vertical rhythm tighter.
    expect(heroCss).toContain('border: 1px solid rgba(246, 202, 95, .72);');
    expect(heroCss).toContain('border-radius: clamp(18px, 2.6vw, 26px);');
    expect(heroCss).toContain('padding: clamp(.8rem, 2.1vw, 1.2rem) clamp(.9rem, 3.4vw, 2rem);');
    expect(heroCss).toContain('margin: 0 auto;');
    expect(heroCss).not.toContain('.hero-welcome-cta');
    expect(heroCss).not.toContain('.hero-welcome-note');
  });

  it('keeps the separate painted Explore control mounted after the welcome panel', () => {
    const panel = indexOfOrFail(heroSource, 'className="hero-welcome"');
    const explore = indexOfOrFail(heroSource, '<ExploreLuckButton />');

    expect(heroSource).toContain("import ExploreLuckButton from './ExploreLuckButton';");
    expect(panel).toBeLessThan(explore);
    expect(heroSource).toContain('hero-art-slice--explore hero-image-container pointer-events-none');
  });

  it('prioritizes only the lead artwork and defers the repeated decorative crops', () => {
    expect(heroSource).toContain("function HeroArtwork({ alt = '', fetchPriority = 'auto', loading = 'lazy' })");
    expect(heroSource).toContain('loading={loading}');
    expect(heroSource).toContain('fetchPriority={fetchPriority}');
    expect(heroSource).toContain('loading="eager"');
    expect(heroSource.match(/fetchPriority="high"/g) ?? []).toHaveLength(1);
  });

  it('makes the complete Explore crop clickable and keeps its focus indicator inside the crop', () => {
    expect(exploreSource).toContain('absolute inset-0 z-30 flex items-end justify-center');
    expect(exploreSource).not.toContain('h-[30%] min-h-24 max-h-[300px]');
    expect(exploreSource).toContain('w-full max-w-full');
    expect(heroCss).toContain('.hero-art-slice--explore button:focus-visible { outline-offset: -4px; }');
  });

  it('keeps one artwork source, one preload and no new image asset', () => {
    const preloads = heroSource.match(/preload\(/g) ?? [];

    expect(preloads).toHaveLength(1);
    // Only the existing artwork may be referenced: the reference is a layout
    // guide, never a site image.
    expect(heroSource).not.toMatch(/reference[-_ ]?image\.(png|jpe?g|webp|avif)/i);
    expect(heroSource.match(/homepage-hero-lucky-pick-canada/g) ?? []).toHaveLength(10);
    expect(heroCss).not.toMatch(/url\(/);
  });

  it('keeps the Explore control inside the artwork window it belongs to', () => {
    const explore = indexOfOrFail(heroSource, 'hero-art-slice--explore');
    const button = indexOfOrFail(heroSource, '<ExploreLuckButton />');

    expect(explore).toBeLessThan(button);
    // The Explore window carries the class the browser contract measures.
    expect(heroSource).toMatch(/className="hero-art-slice hero-art-slice--explore hero-image-container pointer-events-none"/);
  });
});

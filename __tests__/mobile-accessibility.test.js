import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Regression guard for the mobile usability and accessibility remediation
 * (audit findings D3, D4, D5 and D8 from PR #1773).
 *
 * These fast source-level assertions protect stable implementation invariants.
 * Rendered behavior is independently checked by
 * tests/visual/mobile-accessibility.spec.ts using the configured Playwright
 * browser projects; these source checks are not a substitute for browser QA.
 */

const ROOT = process.cwd();
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

function walk(dir, files = []) {
  for (const entry of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, entry);
    const full = join(ROOT, rel);
    let info;
    try {
      info = statSync(full);
    } catch (error) {
      throw new Error(`Unable to inspect "${rel}" during the accessibility source walk: ${error.message}`);
    }
    if (info.isDirectory()) {
      if (['node_modules', '.next', '.git', 'out'].includes(entry)) continue;
      walk(rel, files);
    } else if (/\.(js|jsx|tsx)$/.test(entry)) {
      files.push(rel);
    }
  }
  return files;
}

describe('main landmark structure', () => {
  it('renders exactly one <main> element across the routed application tree', () => {
    // app/** is the routed tree: every page renders inside app/layout.js. Components
    // outside it are covered by their own assertions below (for example the
    // unreferenced components/LuckyGenerator.tsx, which is not imported by a route).
    const files = walk('app');
    const mains = files.flatMap((file) => {
      const matches = read(file).match(/<main[\s>]/g) || [];
      return matches.map(() => relative(ROOT, join(ROOT, file)));
    });

    expect(mains).toEqual([join('app', 'layout.js')]);
  });

  it('does not import an unmarked component that adds a second main landmark', () => {
    // Guards the exact defect the audit found: a route component rendering <main>
    // inside the layout's own <main>. Any new route-level <main> must be added here
    // only after the layout landmark is removed.
    const routeSources = walk('app')
      .filter((file) => file !== join('app', 'layout.js'))
      .map((file) => read(file))
      .join('\n');

    expect(routeSources).not.toMatch(/<main[\s>]/);
  });

  it('keeps the Crystal Ball page inside the shared main landmark', () => {
    const crystalBall = read('app/components/CrystalBall/CrystalBall.tsx');

    expect(crystalBall).not.toMatch(/<main[\s>]/);
    expect(crystalBall).not.toMatch(/<\/main>/);
  });
});

describe('heading order', () => {
  it('starts the Lucky Meter page at H1 and never puts an eyebrow H2 before it', () => {
    const resonance = read('components/DailyResonance.tsx');
    const firstHeading = resonance.match(/<h([1-6])[\s>]/);

    expect(firstHeading?.[1]).toBe('1');
    expect(resonance).not.toMatch(/<h2[^>]*>\s*Daily Resonance Ritual\s*<\/h2>/);
    expect(resonance).toMatch(/<p className="text-sm tracking-widest text-slate-400 uppercase mb-4">Daily Resonance Ritual<\/p>/);
  });
});

describe('skip navigation', () => {
  const layout = read('app/layout.js');
  const a11y = read('themes/default/a11y.css');

  it('puts a skip link first in the body and targets a unique main content id', () => {
    expect(layout).toMatch(/<a href="#main-content" className="skip-link">Skip to main content<\/a>/);
    expect(layout).toMatch(/<main\s+id="main-content"/);
    expect(layout.match(/id="main-content"/g)).toHaveLength(1);
    expect(layout).toMatch(/tabIndex=\{-1\}/);
  });

  it('hides the link until it is focused, then shows it', () => {
    expect(a11y).toMatch(/\.skip-link\s*\{[^}]*position:\s*fixed/s);
    expect(a11y).toMatch(/\.skip-link\s*\{[^}]*transform:\s*translateY\(calc\(-100% - 1rem\)\)/s);
    expect(a11y).toMatch(/\.skip-link:focus,\s*\.skip-link:focus-visible\s*\{[^}]*transform:\s*translateY\(0\.75rem\)/s);
  });
});

describe('navigation landmark names', () => {
  it('labels every navigation region', () => {
    const files = walk('app').concat(walk('components'));
    const unlabelled = files.flatMap((file) => {
      const source = read(file);
      const navs = source.match(/<nav\b[^>]*>/g) || [];
      return navs.filter((tag) => !/aria-label=/.test(tag)).map(() => file);
    });

    expect(unlabelled).toEqual([]);
  });

  it('keeps the footer navigation regions distinct', () => {
    const layout = read('app/layout.js');

    expect(layout).toContain('aria-label="Footer navigation"');
    expect(layout).toContain('aria-label="Social links"');
    expect(layout).toContain('aria-label="Legal links"');
  });
});

describe('keyboard focus visibility', () => {
  const map = read('themes/default/map.css');
  const a11y = read('themes/default/a11y.css');

  it('does not suppress the focus outline on map controls', () => {
    const outlineSuppressors = [
      /\.home-link:hover[^{]*\{[^}]*outline:\s*none/s,
      /\.story-link:hover[^{]*\{[^}]*outline:\s*none/s,
      /\.secondary-action-btn:hover[^{]*\{[^}]*outline:\s*none/s,
      /\.map-province-card:hover[^{]*\{[^}]*outline:\s*none/s,
    ];

    outlineSuppressors.forEach((pattern) => expect(map).not.toMatch(pattern));
  });

  it('provides a visible 3px focus ring for map controls and footer links', () => {
    expect(map).toMatch(/\.home-link:focus-visible[^{]*\{[^}]*outline:\s*3px solid/s);
    expect(map).toMatch(/\.story-link:focus-visible/s);
    expect(map).toMatch(/\.secondary-action-btn:focus-visible/s);
    expect(a11y).toMatch(/footer a:focus-visible[^{]*\{[^}]*outline:\s*3px solid/s);
  });
});

describe('mobile target and type floors', () => {
  const a11y = read('themes/default/a11y.css');
  const map = read('themes/default/map.css');
  const layout = read('app/layout.js');

  it('gives footer links a 24px minimum target box', () => {
    expect(a11y).toMatch(/footer nav a\s*\{[^}]*min-width:\s*24px/s);
    expect(a11y).toMatch(/footer nav a\s*\{[^}]*min-height:\s*24px/s);
  });

  it('expands the map marker hit area without resizing the artwork', () => {
    expect(map).toMatch(/\.province-marker::before\s*\{\s*content:\s*'';\s*position:\s*absolute;\s*inset:\s*-3px;/s);
    expect(map).toMatch(/\.province-marker\s*\{[^}]*width:\s*clamp\(1\.5rem, 4vw, 2\.625rem\)/s);
  });

  it('keeps the footer text at the 12px caption floor', () => {
    expect(layout).not.toMatch(/text-\[10px\]/);
    expect(layout).not.toMatch(/text-\[11px\]/);
    expect(layout).toContain('aria-label="Footer navigation" className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs');
    // The theme's 15 px mobile root makes text-xs 11.25 px, so the 12 px floor is
    // declared in the accessibility layer at 0.8rem (mobile) / 0.75rem (desktop).
    expect(a11y).toMatch(/footer p,\s*footer nav a\s*\{\s*font-size:\s*0\.8rem;/s);
    expect(a11y).toMatch(/@media \(min-width: 640px\)\s*\{[^}]*footer p,\s*footer nav a\s*\{\s*font-size:\s*0\.75rem;/s);
  });

  it('does not rely on new Tailwind arbitrary font sizes', () => {
    // The theme build did not emit text-[0.8rem], so sizes are owned by the CSS layer.
    expect(layout).not.toMatch(/text-\[\.?0\.8rem\]/);
  });

  it('keeps reviewed mobile captions at the 12px floor', () => {
    expect(a11y).toMatch(/@media \(max-width: 620px\)\s*\{[^}]*font-size:\s*0\.8rem/s);
    expect(read('app/components/CrystalBall/CrystalBall.module.css')).toMatch(/\.dailyQuotaCountdown\s*\{[^}]*font-size:\s*0\.8rem/s);
    expect(read('app/lucky-map-of-canada/lucky-map-of-canada.js')).not.toMatch(/fontSize:\s*'0\.72rem'/);
    expect(read('app/lucky-card-reveal.js')).not.toMatch(/text-\[0\.6[0-9]rem\]|text-\[0\.7rem\]/);
  });
});

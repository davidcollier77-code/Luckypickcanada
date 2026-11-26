import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  SPEC_DIRECTORY,
  buildFileFilter,
  discoverSpecFiles,
  loadShardPlan,
  planShards,
} from '../.github/scripts/plan-playwright-shards.mjs';
import { summarize } from '../.github/scripts/summarize-playwright-timings.mjs';
import { loadImpactMap, renderSummary, selectSpecs } from '../.github/scripts/select-visual-specs.mjs';
import { mergeTimings } from '../.github/scripts/update-playwright-shard-plan.mjs';

const root = process.cwd();
const workflow = readFileSync(join(root, '.github/workflows/visual-qa.yml'), 'utf8');
const discovered = discoverSpecFiles(join(root, SPEC_DIRECTORY));

function assertExactCoverage(files, buckets) {
  const assigned = buckets.flatMap((bucket) => bucket.files);
  expect(assigned).toHaveLength(files.length);
  expect(new Set(assigned).size).toBe(files.length);
  expect([...assigned].sort()).toEqual([...files].sort());
}

describe('Playwright shard planning', () => {
  it('discovers every committed spec file and only specs', () => {
    expect(discovered).toHaveLength(16);
    expect(discovered.every((file) => file.endsWith('.spec.ts'))).toBe(true);
    expect(discovered).toContain('crystal-ball.spec.ts');
    expect(discovered).toContain('mobile-accessibility.spec.ts');
  });

  it('assigns whole files to exactly one shard with no loss or duplication', () => {
    const buckets = planShards(discovered, { 'homepage.spec.ts': 90000 }, 2);
    expect(buckets).toHaveLength(2);
    assertExactCoverage(discovered, buckets);
    for (const bucket of buckets) expect(bucket.files.length).toBeGreaterThan(0);
  });

  it('is deterministic and balances by recorded weight', () => {
    const weights = {
      'crystal-ball.spec.ts': 180000,
      'homepage.spec.ts': 120000,
      'gold-cta.spec.ts': 30000,
    };
    const first = planShards(discovered, weights, 2);
    const second = planShards([...discovered].reverse(), weights, 2);
    expect(first).toEqual(second);
    const heaviest = first.reduce((a, b) => (a.estimated_ms > b.estimated_ms ? a : b));
    expect(heaviest.files).toContain('crystal-ball.spec.ts');
    assertExactCoverage(discovered, first);
  });

  it('refuses to plan empty or invalid shard sets', () => {
    expect(() => planShards([], {}, 2)).toThrow(/no Playwright spec files/);
    expect(() => planShards(discovered, {}, 0)).toThrow(/invalid shard count/);
  });

  it('falls back to equal weights when the committed plan is missing or invalid', () => {
    expect(loadShardPlan(join(root, 'tests/visual/absent.json')).problem).toMatch(/no shard plan/);
    const plan = JSON.parse(readFileSync(join(root, 'tests/visual/shard-plan.json'), 'utf8'));
    expect(plan.version).toBe(1);
    expect(plan.shards).toBe(2);
    expect(plan.weights_ms).toBeTypeOf('object');
  });

  it('uses the committed real timings and keeps the two shards close', () => {
    const { weights, problem } = loadShardPlan(join(root, 'tests/visual/shard-plan.json'));
    expect(problem).toBeNull();
    expect(Object.keys(weights).sort()).toEqual([...discovered].sort());
    const buckets = planShards(discovered, weights, 2);
    const estimates = buckets.map((bucket) => bucket.estimated_ms);
    expect(Math.max(...estimates) / Math.min(...estimates)).toBeLessThan(1.1);
  });

  it('passes each shard as an anchored filter that cannot match a sibling spec', () => {
    const buckets = planShards(discovered, loadShardPlan().weights, 2);
    for (const bucket of buckets) {
      const filter = new RegExp(buildFileFilter(bucket.files));
      const matched = discovered
        .filter((file) => filter.test(`tests/visual/${file}`))
        .sort();
      expect(matched).toEqual([...bucket.files].sort());
    }
    expect(new RegExp(buildFileFilter(['gold-cta.spec.ts'])).test('tests/visual/sitewide-gold-cta.spec.ts')).toBe(false);
  });
});

describe('Playwright timing plan refresh', () => {
  it('sums every project for a file and takes the median across artifacts', () => {
    const directory = mkdtempSync(join(tmpdir(), 'playwright-timings-'));
    const write = (name, rows) => {
      const path = join(directory, name);
      writeFileSync(path, JSON.stringify({ rows }));
      return path;
    };
    try {
      const first = write('first.json', [
        { file: 'homepage.spec.ts', duration_ms: 100 },
        { file: 'homepage.spec.ts', duration_ms: 50 },
        { file: 'gold-cta.spec.ts', duration_ms: 200 },
      ]);
      const second = write('second.json', [
        { file: 'homepage.spec.ts', duration_ms: 300 },
      ]);
      expect(mergeTimings([first, second])).toEqual({
        'gold-cta.spec.ts': 200,
        'homepage.spec.ts': 225,
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('Playwright timing analysis', () => {
  const results = {
    suites: [
      {
        specs: [
          {
            file: 'tests/visual/homepage.spec.ts',
            title: 'homepage',
            tests: [
              {
                projectName: 'desktop',
                results: [{ status: 'passed', duration: 1200, retry: 0 }],
              },
              {
                projectName: 'mobile-390',
                results: [
                  { status: 'failed', duration: 800, retry: 0 },
                  { status: 'passed', duration: 900, retry: 1 },
                ],
              },
            ],
          },
        ],
        suites: [
          {
            specs: [
              {
                file: 'tests/visual/gold-cta.spec.ts',
                title: 'cta',
                tests: [
                  {
                    projectName: 'desktop',
                    results: [{ status: 'skipped', duration: 0, retry: 0 }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  it('aggregates per file and project, including retries', () => {
    const summary = summarize(results);
    expect(summary.rows).toHaveLength(3);
    const homepageDesktop = summary.rows.find(
      (row) => row.file.endsWith('homepage.spec.ts') && row.project === 'desktop',
    );
    expect(homepageDesktop.duration_ms).toBe(1200);
    const retried = summary.rows.find((row) => row.project === 'mobile-390');
    expect(retried.passed_on_retry).toBe(1);
    expect(summary.projects['desktop']).toBe(1200);
  });

  it('handles empty or missing results without inventing a result', () => {
    expect(summarize({}).rows).toEqual([]);
    expect(summarize(null).rows).toEqual([]);
  });
});

describe('visual spec selection', () => {
  const { map } = loadImpactMap(join(root, 'tests/visual/impact-map.json'));

  it('keeps every discovered spec reachable from the map', () => {
    expect(map).not.toBeNull();
    const always = new Set(map.always_run);
    const mapped = new Set(map.rules.flatMap((rule) => rule.specs === 'all' ? [] : rule.specs));
    for (const spec of discovered) {
      expect(always.has(spec) || mapped.has(spec), spec).toBe(true);
    }
  });

  it('runs everything in shadow mode even for a mapped change', () => {
    const selection = selectSpecs(['app/crystal-ball/page.js'], map, discovered, {
      mode: 'shadow',
    });
    expect(selection.mode).toBe('shadow');
    expect(selection.specs).toEqual([...discovered].sort());
    expect(selection.would_run.length).toBeLessThan(discovered.length);
    const summary = renderSummary(selection, discovered).join('\n');
    expect(summary).toContain(`Affected specs (${selection.would_run.length}/${discovered.length})`);
    expect(summary).toContain('crystal-ball.spec.ts');
    expect(summary).not.toContain('Would run: all specs');
    expect(summary).toContain(`all ${discovered.length} specs still run`);
  });

  it('selects mapped specs only when subset mode is explicitly enabled', () => {
    const selection = selectSpecs(['app/crystal-ball/page.js'], map, discovered, {
      mode: 'subset',
    });
    expect(selection.mode).toBe('subset');
    expect(selection.specs).toContain('crystal-ball.spec.ts');
    expect(selection.specs).not.toContain('turnstile-loading.spec.ts');
    expect(selection.specs).toContain('homepage.spec.ts');
  });

  it('fails closed to every spec for unmapped paths, shared chrome and full sweeps', () => {
    for (const [paths, options] of [
      [['data/unknown.bin'], {}],
      [['app/globals.css'], {}],
      [['README.md'], {}],
      [[], {}],
      [['app/crystal-ball/page.js'], { fullSweep: true }],
    ]) {
      const selection = selectSpecs(paths, map, discovered, { mode: 'subset', ...options });
      expect(selection.mode, JSON.stringify(paths)).toBe('all');
      expect(selection.specs).toEqual([...discovered].sort());
    }
  });

  it('fails closed when a spec is unreachable or the map is missing', () => {
    const broken = { ...map, always_run: [] };
    const selection = selectSpecs(['app/crystal-ball/page.js'], broken, discovered, {
      mode: 'subset',
    });
    expect(selection.mode).toBe('all');
    expect(selectSpecs(['app/page.js'], null, discovered, { mode: 'subset' }).mode).toBe('all');
  });
});

describe('Playwright workflow wiring', () => {
  it('keeps every project, baseline, cache and required application check', () => {
    expect(workflow).toContain('name: Application Verification');
    expect(workflow).toContain('Verify committed visual baselines');
    expect(workflow).toContain('playwright install --with-deps chromium');
    // Chromium is provisioned unconditionally from the installed Playwright;
    // there is no custom cache validator or separate install-deps step.
    expect(workflow).not.toContain('playwright install-deps chromium');
    expect(workflow).not.toContain('Validate restored Playwright Chromium');
    expect(workflow).toContain('pnpm run test');
    expect(workflow).toContain('pnpm exec tsc --noEmit');
    expect(workflow).not.toContain('--update-snapshots');
  });

  it('plans shards, keeps the configured reporters and captures timings', () => {
    expect(workflow).toContain('plan-playwright-shards.mjs');
    expect(workflow).toContain('--forbid-only');
    expect(workflow).toContain('--reporter=github --reporter=html --reporter=list --reporter=json');
    expect(workflow).toContain('summarize-playwright-timings.mjs');
    expect(workflow).toContain('select-visual-specs.mjs --files "$files" --mode shadow');
    expect(workflow).toContain('steps.shard-plan.outputs.filter');
    expect(workflow).toContain('shard: [1, 2]');
  });
});

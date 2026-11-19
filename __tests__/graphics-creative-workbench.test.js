// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The Creative Workbench catalogue and its deterministic rules. The capability
 * probes are mocked so the same tests cover a WebGL device, a Canvas-only device
 * and the reduced-motion override without depending on the machine.
 */
const probe = vi.hoisted(() => ({
  webgl: true,
  canvas2d: true,
  reduced: false,
}));

vi.mock('../app/lib/graphics-capabilities.js', () => ({
  RENDER_QUALITY: { HIGH: 'high', BALANCED: 'balanced', CONSTRAINED: 'constrained' },
  supportsWebGL: () => probe.webgl,
  supportsCanvas2D: () => probe.canvas2d,
  prefersReducedMotion: () => probe.reduced,
  isPageVisible: () => true,
}));

import {
  DEFAULT_WORKBENCH_STATE,
  WORKBENCH_SCENES,
  WORKBENCH_TIERS,
  getWorkbenchScene,
  isWorkbenchCue,
  isWorkbenchEnabled,
  normalizeWorkbenchState,
  resolveWorkbenchPlan,
  workbenchCaptureName,
} from '../app/lib/graphics/workbench.js';
import { buildWorkbenchScene } from '../app/lib/graphics/workbench-runtime.js';

beforeEach(() => {
  probe.webgl = true;
  probe.canvas2d = true;
  probe.reduced = false;
  delete window.AudioContext;
  delete window.webkitAudioContext;
});

describe('workbench catalogue', () => {
  it('describes every scene once, with a bounded clock and a real renderer', () => {
    const ids = WORKBENCH_SCENES.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const scene of WORKBENCH_SCENES) {
      expect(getWorkbenchScene(scene.id)).toBe(scene);
      expect(scene.label.length).toBeGreaterThan(0);
      expect(scene.description.length).toBeGreaterThan(0);
      expect(scene.duration).toBeGreaterThan(0);
      expect(['three', 'canvas2d']).toContain(scene.requirements.renderer);
      expect(scene.requirements.reactiveAudio).toBe(true);
    }

    expect(WORKBENCH_TIERS.map((tier) => tier.id)).toEqual(['high', 'balanced', 'constrained']);
  });
});

describe('deterministic state', () => {
  it('ignores unknown scenes and tiers instead of throwing', () => {
    const next = normalizeWorkbenchState({ sceneId: 'nope', tier: 'ultra' });
    expect(next.sceneId).toBe(DEFAULT_WORKBENCH_STATE.sceneId);
    expect(next.tier).toBe(DEFAULT_WORKBENCH_STATE.tier);
  });

  it('clamps time to the scene duration and rounds the seed', () => {
    const next = normalizeWorkbenchState({ sceneId: 'reactive-aurora', time: 999, seed: 12.6 });
    expect(next.time).toBe(getWorkbenchScene('reactive-aurora').duration);
    expect(next.seed).toBe(13);

    expect(normalizeWorkbenchState({ seed: -5 }).seed).toBe(0);
    expect(normalizeWorkbenchState({ seed: 1e9 }).seed).toBe(999_999);
    expect(normalizeWorkbenchState({ time: -1 }).time).toBe(0);
  });

  it('keeps the base value when a patch omits or mistypes a field', () => {
    const next = normalizeWorkbenchState({ playing: 'yes', reducedMotion: 1 }, DEFAULT_WORKBENCH_STATE);
    expect(next.playing).toBe(DEFAULT_WORKBENCH_STATE.playing);
    expect(next.reducedMotion).toBe(DEFAULT_WORKBENCH_STATE.reducedMotion);
  });
});

describe('resolved plan', () => {
  it('selects Three.js for a 3D scene at the chosen tier', () => {
    const plan = resolveWorkbenchPlan('golden-motes', { tier: 'high' });
    expect(plan.renderer).toBe('three');
    expect(plan.postProcessing).toBe(true);
    expect(plan.tier).toBe('high');
    expect(plan.fallbacks).toEqual(['canvas2d', 'dom']);
  });

  it('falls back to Canvas 2D and then DOM without WebGL', () => {
    probe.webgl = false;
    expect(resolveWorkbenchPlan('reactive-crystal', { tier: 'balanced' }).renderer).toBe('canvas2d');
    probe.canvas2d = false;
    expect(resolveWorkbenchPlan('reactive-crystal', { tier: 'balanced' }).renderer).toBe('dom');
  });

  it('honours the reduced-motion override deterministically', () => {
    probe.reduced = false;
    const plan = resolveWorkbenchPlan('golden-motes', { tier: 'balanced', reducedMotion: true });
    // The renderer is not downgraded; only motion and sound reactivity stop.
    expect(plan.renderer).toBe('three');
    expect(plan.motion).toBe('none');
    expect(plan.audioReactive).toBe(false);
    expect(plan.reducedMotion).toBe(true);
  });

  it('enables sound reactivity when the browser can analyse audio', () => {
    window.AudioContext = class {
      createAnalyser() {
        return {};
      }
    };
    const plan = resolveWorkbenchPlan('reactive-aurora', { tier: 'constrained' });
    expect(plan.renderer).toBe('canvas2d');
    expect(plan.audioReactive).toBe(true);
  });

  it('returns null for an unknown scene', () => {
    expect(resolveWorkbenchPlan('missing', {})).toBeNull();
  });
});

describe('capture naming', () => {
  it('is stable for the same frame and distinct for different frames', () => {
    const first = workbenchCaptureName('golden-motes', { tier: 'high', time: 2.5, seed: 11 });
    expect(first).toBe('creative-workbench-golden-motes-high-t2.50-seed11.png');
    expect(workbenchCaptureName('golden-motes', { tier: 'high', time: 2.5, seed: 11 })).toBe(first);
    expect(workbenchCaptureName('golden-motes', { tier: 'high', time: 3, seed: 11 })).not.toBe(first);
  });

  it('never puts an unknown or unsafe scene id in a path', () => {
    expect(workbenchCaptureName('../../etc/passwd', {})).toContain('unknown-scene');
    expect(workbenchCaptureName('../../etc/passwd', {})).not.toContain('..');
  });

  it('replaces an unknown tier instead of embedding it in the filename', () => {
    const name = workbenchCaptureName('golden-motes', { tier: '../evil', time: 1, seed: 2 });
    expect(name).toBe('creative-workbench-golden-motes-balanced-t1.00-seed2.png');
    expect(name).not.toContain('..');
  });
});

describe('route gate', () => {
  it('allows development and refuses production by default', () => {
    expect(isWorkbenchEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isWorkbenchEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(isWorkbenchEnabled({})).toBe(true);
  });

  it('allows a deliberate review environment to opt in', () => {
    expect(isWorkbenchEnabled({ NODE_ENV: 'production', CREATIVE_WORKBENCH: '1' })).toBe(true);
    expect(isWorkbenchEnabled({ NODE_ENV: 'production', CREATIVE_WORKBENCH: '0' })).toBe(false);
  });
});

describe('cue allowlist', () => {
  it('accepts only the cue names the catalogue declares', () => {
    for (const scene of WORKBENCH_SCENES) {
      expect(isWorkbenchCue(scene.cue)).toBe(true);
    }
    expect(isWorkbenchCue('constructor')).toBe(false);
    expect(isWorkbenchCue('__proto__')).toBe(false);
    expect(isWorkbenchCue('')).toBe(false);
    expect(isWorkbenchCue(undefined)).toBe(false);
  });
});

describe('scene builders', () => {
  it('declines a surface it does not own instead of taking over its frames', async () => {
    const scene = WORKBENCH_SCENES[0];
    await expect(buildWorkbenchScene({ scene, surface: null })).resolves.toBeNull();
    await expect(
      buildWorkbenchScene({ scene, surface: { kind: 'webgl' } }),
    ).resolves.toBeNull();
  });
});

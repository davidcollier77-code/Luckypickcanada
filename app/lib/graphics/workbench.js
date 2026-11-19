/**
 * The Creative Workbench catalogue and its deterministic state rules.
 *
 * The workbench is the shared sandbox where an AI coding agent (or a person)
 * mounts the creative layer's capabilities, inspects the resolved plan and the
 * live envelope, freezes a composed frame and captures it for visual QA before a
 * pull request is approved.
 *
 * This module is deliberately pure and browser-free: it holds the scene
 * descriptors, the tier table, state normalisation, technology-plan resolution,
 * capture naming and the route gate. The imperative scene builders live in
 * `workbench-runtime.js` and the UI in
 * `components/graphics/CreativeWorkbench.jsx`, so this file is safe to unit test
 * without a canvas, WebGL or audio.
 *
 * Nothing here ships to a visitor-facing route: the page that mounts it is
 * development-only and returns 404 in production unless explicitly enabled.
 */

import { selectGraphicsTechnologies } from './technologies.js';

/** Quality tiers the workbench can force, with the same caps the runtime uses. */
export const WORKBENCH_TIERS = Object.freeze([
  Object.freeze({ id: 'high', maxPixelRatio: 2 }),
  Object.freeze({ id: 'balanced', maxPixelRatio: 1.6 }),
  Object.freeze({ id: 'constrained', maxPixelRatio: 1.25 }),
]);

/**
 * The scenes an agent can mount. Each one is a description, not code: the
 * workbench builds it through the same `createCreativeSurface` entry point a
 * production feature uses, so what the sandbox shows is what the layer does.
 *
 * `duration` bounds the deterministic time slider; `cue` names an existing
 * same-origin sound (from the Lucky Meter sound set) so sound reactivity is
 * exercised with audio the site already ships.
 */
export const WORKBENCH_SCENES = Object.freeze([
  Object.freeze({
    id: 'golden-motes',
    label: 'Golden motes',
    description:
      'Three.js torus knot in gold, tiered light rig, bounded particles, bloom and ACES output.',
    duration: 8,
    cue: 'colourPour',
    seed: 11,
    requirements: Object.freeze({
      renderer: 'three',
      dimension: '3d',
      postProcessing: true,
      particles: true,
      timeline: true,
      audio: true,
      reactiveAudio: true,
    }),
  }),
  Object.freeze({
    id: 'reactive-crystal',
    label: 'Reactive crystal',
    description:
      'Glass body, emissive glow, exposure and light pulses driven by the live audio envelope.',
    duration: 8,
    cue: 'dockChime',
    seed: 23,
    requirements: Object.freeze({
      renderer: 'three',
      dimension: '3d',
      postProcessing: true,
      particles: true,
      audio: true,
      reactiveAudio: true,
    }),
  }),
  Object.freeze({
    id: 'reactive-aurora',
    label: 'Reactive aurora',
    description:
      'Canvas 2D ribbons and stars whose amplitude, hue and brightness follow the mix.',
    duration: 10,
    cue: 'colourPour',
    seed: 37,
    requirements: Object.freeze({
      renderer: 'canvas2d',
      dimension: '2d',
      particles: true,
      audio: true,
      reactiveAudio: true,
    }),
  }),
]);

const scenesById = new Map(WORKBENCH_SCENES.map((scene) => [scene.id, scene]));

/** @returns {object|null} One scene descriptor. */
export function getWorkbenchScene(id) {
  return scenesById.get(id) ?? null;
}

export const DEFAULT_WORKBENCH_STATE = Object.freeze({
  sceneId: 'golden-motes',
  tier: 'balanced',
  seed: 11,
  time: 0,
  playing: true,
  reducedMotion: false,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function tierFor(id) {
  return WORKBENCH_TIERS.find((tier) => tier.id === id) ?? WORKBENCH_TIERS[1];
}

/**
 * Normalises a state patch against a base state. Unknown scenes and tiers are
 * ignored rather than throwing, values are clamped to their real ranges, and
 * time is bounded by the selected scene's duration.
 *
 * @param {object} [patch]
 * @param {object} [base]
 * @returns {{ sceneId: string, tier: string, seed: number, time: number, playing: boolean, reducedMotion: boolean }}
 */
export function normalizeWorkbenchState(patch = {}, base = DEFAULT_WORKBENCH_STATE) {
  const sceneId = getWorkbenchScene(patch.sceneId) ? patch.sceneId : base.sceneId;
  const scene = getWorkbenchScene(sceneId) ?? WORKBENCH_SCENES[0];

  return {
    sceneId,
    tier: WORKBENCH_TIERS.some((tier) => tier.id === patch.tier) ? patch.tier : base.tier,
    seed: Number.isFinite(patch.seed)
      ? Math.round(clamp(patch.seed, 0, 999_999))
      : base.seed,
    time: Number.isFinite(patch.time) ? clamp(patch.time, 0, scene.duration) : base.time,
    playing: typeof patch.playing === 'boolean' ? patch.playing : base.playing,
    reducedMotion:
      typeof patch.reducedMotion === 'boolean' ? patch.reducedMotion : base.reducedMotion,
  };
}

/**
 * The technology plan a scene should resolve to at the chosen tier. Passing the
 * reduced-motion override keeps the sandbox deterministic: the same toggle
 * produces the same plan on every machine instead of depending on the OS.
 *
 * @param {string} sceneId
 * @param {{ tier?: string, reducedMotion?: boolean }} [state]
 * @returns {object|null}
 */
export function resolveWorkbenchPlan(sceneId, state = {}) {
  const scene = getWorkbenchScene(sceneId);
  if (!scene) return null;
  const tier = tierFor(state.tier);
  return selectGraphicsTechnologies(
    scene.requirements,
    { tier: tier.id, maxPixelRatio: tier.maxPixelRatio },
    { reducedMotion: state.reducedMotion === true },
  );
}

/**
 * A stable capture filename, so before/after comparisons sort and diff cleanly.
 * The scene id comes from the catalogue, so it is already path-safe.
 *
 * @param {string} sceneId
 * @param {{ tier?: string, time?: number, seed?: number }} [options]
 * @returns {string}
 */
export function workbenchCaptureName(sceneId, { tier = 'balanced', time = 0, seed = 0 } = {}) {
  const scene = getWorkbenchScene(sceneId) ? sceneId : 'unknown-scene';
  const seconds = Number.isFinite(time) ? Math.max(0, time).toFixed(2) : '0.00';
  const safeSeed = Number.isFinite(seed) ? Math.round(Math.max(0, seed)) : 0;
  return `creative-workbench-${scene}-${tier}-t${seconds}-seed${safeSeed}.png`;
}

/**
 * Whether the workbench route may render.
 *
 * Development is always allowed. Production returns 404 unless the deployment
 * sets `CREATIVE_WORKBENCH=1` for a deliberate review environment, so the
 * sandbox is never exposed to visitors by default.
 *
 * @param {Record<string, string|undefined>} [env]
 * @returns {boolean}
 */
export function isWorkbenchEnabled(env = {}) {
  if (env?.CREATIVE_WORKBENCH === '1') return true;
  return env?.NODE_ENV !== 'production';
}

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
 * Development capture stages. These are representative viewport sizes, not
 * production breakpoints: the visitor route will use its own responsive layout,
 * while the prototype needs exact canvases to compare composition at phone,
 * tablet and desktop sizes.
 */
export const WORKBENCH_STAGES = Object.freeze({
  mobile: Object.freeze({ id: 'mobile', label: 'Mobile', width: 390, height: 844 }),
  tablet: Object.freeze({ id: 'tablet', label: 'Tablet', width: 820, height: 1180 }),
  desktop: Object.freeze({ id: 'desktop', label: 'Desktop', width: 1440, height: 900 }),
});

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
  Object.freeze({
    id: 'lucky-meter-instrument',
    label: 'Lucky Meter instrument',
    description:
      'Spec 218 responsive prototype: twelve-chamber gold meter, flipping maple medallion and faceted crystal bowl at 78% High Resonance across mobile, tablet and desktop stages.',
    duration: 6,
    cue: 'colourPour',
    seed: 218,
    // The workbench sizes this scene to a representative device frame. Other
    // scenes keep the standard 16:10 stage.
    stage: 'mobile',
    stages: Object.freeze(['mobile', 'tablet', 'desktop']),
    requirements: Object.freeze({
      renderer: 'three',
      dimension: '3d',
      postProcessing: false,
      particles: true,
      timeline: true,
      audio: true,
      reactiveAudio: true,
    }),
  }),
]);

/**
 * Same-origin recordings the sandbox can play through Howler's HTML5 path.
 *
 * This exists so an agent can verify that an `html5: true` cue drives the same
 * analyser as the Web Audio mix. It names the recordings the catalogue scenes
 * already use; it is not a second audio system and is never mounted by a
 * visitor route.
 */
export const WORKBENCH_HTML5_CUES = Object.freeze({
  colourPour: '/sounds/mixkit-magic-sparkles.mp3',
  dockChime: '/sounds/chime-sound.mp3',
});

/** @returns {string|null} The same-origin source for a catalogue cue. */
export function workbenchHtml5CueSource(name) {
  if (typeof name !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(WORKBENCH_HTML5_CUES, name)
    ? WORKBENCH_HTML5_CUES[name]
    : null;
}

const scenesById = new Map(WORKBENCH_SCENES.map((scene) => [scene.id, scene]));

/** @returns {object|null} One scene descriptor. */
export function getWorkbenchScene(id) {
  return scenesById.get(id) ?? null;
}

/**
 * Resolves the requested development stage for a scene. Scenes without stage
 * presets keep the standard workbench frame; an unknown stage falls back to the
 * scene's declared default rather than throwing.
 *
 * @param {object|null} scene
 * @param {string|null} [stageId]
 * @returns {object|null}
 */
export function resolveWorkbenchStage(scene, stageId = null) {
  if (!scene || !Array.isArray(scene.stages) || scene.stages.length === 0) return null;
  const fallback = scene.stages.includes(scene.stage) ? scene.stage : scene.stages[0];
  const id = scene.stages.includes(stageId) ? stageId : fallback;
  return WORKBENCH_STAGES[id] ?? null;
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
  // The tier is normally normalized already, but this helper is also called
  // directly by agents, so an unknown value must never reach a filename.
  const safeTier = WORKBENCH_TIERS.some((entry) => entry.id === tier) ? tier : 'balanced';
  const seconds = Number.isFinite(time) ? Math.max(0, time).toFixed(2) : '0.00';
  const safeSeed = Number.isFinite(seed) ? Math.round(Math.max(0, seed)) : 0;
  return `creative-workbench-${scene}-${safeTier}-t${seconds}-seed${safeSeed}.png`;
}

/**
 * Whether a cue name belongs to the workbench catalogue. The sandbox can play
 * existing Lucky Meter recordings, but it only exposes the cue names it
 * declares instead of forwarding any caller-supplied string to the audio
 * module.
 *
 * @param {unknown} name
 * @returns {boolean}
 */
export function isWorkbenchCue(name) {
  return WORKBENCH_SCENES.some((scene) => scene.cue === name);
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

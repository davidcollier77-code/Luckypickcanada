/**
 * The one registry of visual/audio experiences and the automatic derivation of
 * their readiness resources.
 *
 * A developer describes an experience once — what it renders, whether it uses
 * particles, post-processing, a timeline or sound — and this module:
 *
 *   1. selects the technology that should render it (`technologies.js`);
 *   2. derives the exact resources the readiness hub must prepare: the engine
 *      chunk, texture and model preflights, and the audio prepare functions;
 *   3. registers the experience with the existing site-wide hub, so no one has
 *      to remember an image, module or sound registration.
 *
 * The registry is data only. It imports the audio prepare functions that
 * already exist and the chunk loaders in `engine-chunks.js`; it never imports
 * Three.js, GSAP or Howler at module scope.
 */

import { getRenderQuality } from '../graphics-capabilities.js';
import { getExperienceDefinition, registerExperienceResources } from '../resource-readiness.js';
import * as siteAudio from '../audio.js';
import * as meterAudio from '../lucky-meter/audio.js';
import { installGraphicsResourceAdapters } from './adapters.js';
import { selectGraphicsTechnologies } from './technologies.js';

/**
 * Resolves an existing audio prepare function lazily.
 *
 * The namespaces are accessed at call time, so a test (or a future code-split
 * build) that provides only some of the audio exports cannot break importing
 * the registry. An unavailable cue resolves as skipped instead of throwing into
 * the hub.
 *
 * @param {Record<string, unknown>} namespace
 * @param {string} name
 * @returns {() => Promise<unknown>}
 */
function lazyAudioPrepare(namespace, name) {
  return (...args) => {
    const prepare = namespace?.[name];
    if (typeof prepare !== 'function') {
      return Promise.resolve({ skipped: true, reason: `audio-${name}-unavailable` });
    }
    return prepare(...args);
  };
}

/**
 * Descriptor shape:
 *
 *   id            Hub experience id (must match the manifest for existing work).
 *   renderer      'dom' | 'canvas2d' | 'webgl' | 'three' | 'auto'.
 *                 `webgl` means an existing hand-written engine keeps the frame;
 *                 the toolkit only prepares its resources and reports its plan.
 *   dimension     '2d' | '3d'
 *   postProcessing / particles / timeline
 *   reactiveAudio true when the visual should follow the live audio envelope.
 *   audio[]       { id, prepare, background? } — prepare is an existing function.
 *   chunks[]      engine chunk names from `engine-chunks.js`.
 *   textures[]    { id, url, bytes? }
 *   models[]      { id, url, bytes? }
 */
export const VISUAL_EXPERIENCES = Object.freeze([
  Object.freeze({
    id: 'reveal',
    label: 'Lucky Card Reveal (personal and gift)',
    renderer: 'canvas2d',
    dimension: '2d',
    particles: true,
    chunks: ['confetti'],
    audio: Object.freeze([
      { id: 'reveal-sparkle-audio', prepare: lazyAudioPrepare(siteAudio, 'preloadRevealSparkle'), background: false },
      { id: 'reveal-applause-audio', prepare: lazyAudioPrepare(siteAudio, 'preloadRevealApplause'), background: false },
      { id: 'reveal-confetti-pop-audio', prepare: lazyAudioPrepare(siteAudio, 'preloadConfettiPop'), background: false },
    ]),
  }),
  Object.freeze({
    id: 'lucky-meter',
    label: 'Lucky Meter / Daily Resonance',
    renderer: 'webgl',
    dimension: '2d',
    particles: true,
    audio: Object.freeze([
      { id: 'lucky-meter-audio', prepare: lazyAudioPrepare(meterAudio, 'prepareLuckyMeterAudio'), background: false },
    ]),
  }),
  Object.freeze({
    id: 'lucky-meter-vessel',
    label: 'Lucky Meter glass vessel and colour pour',
    renderer: 'three',
    dimension: '3d',
    postProcessing: true,
    particles: true,
    chunks: ['three'],
  }),
  Object.freeze({
    id: 'crystal-ball',
    label: 'Crystal Ball',
    renderer: 'webgl',
    dimension: '2d',
    audio: Object.freeze([
      { id: 'crystal-ball-audio', prepare: lazyAudioPrepare(siteAudio, 'preloadCrystalBallAudio'), background: false },
    ]),
  }),
  Object.freeze({
    id: 'lucky-map',
    label: 'Lucky Map',
    renderer: 'canvas2d',
    dimension: '2d',
    particles: true,
  }),
  Object.freeze({
    id: 'lucky-number-generator',
    label: 'Lucky Number Generator',
    renderer: 'dom',
    dimension: '2d',
  }),
]);

const byId = new Map(VISUAL_EXPERIENCES.map((experience) => [experience.id, experience]));

/** @returns {object|null} The descriptor for a visual experience. */
export function getVisualExperience(id) {
  return byId.get(id) ?? null;
}

/** @returns {ReadonlyArray<object>} Every visual experience descriptor. */
export function getVisualExperiences() {
  return VISUAL_EXPERIENCES;
}

/**
 * Converts a descriptor into the requirements `selectGraphicsTechnologies`
 * understands.
 *
 * @param {object} experience
 */
export function visualExperienceRequirements(experience) {
  return {
    renderer: experience?.renderer ?? 'auto',
    dimension: experience?.dimension ?? '2d',
    postProcessing: experience?.postProcessing === true,
    particles: experience?.particles === true,
    timeline: experience?.timeline === true,
    audio: Array.isArray(experience?.audio) && experience.audio.length > 0,
    reactiveAudio: experience?.reactiveAudio === true,
  };
}

/**
 * The automatic technology plan for an experience.
 *
 * @param {string} id
 * @param {{ tier?: string, maxPixelRatio?: number }} [quality]
 * @returns {object|null}
 */
export function resolveVisualPlan(id, quality) {
  const experience = byId.get(id);
  if (!experience) return null;
  return selectGraphicsTechnologies(visualExperienceRequirements(experience), quality ?? getRenderQuality());
}

/**
 * Derives the hub resources for a descriptor. Only what the descriptor actually
 * asks for is emitted, so an experience with no sound and no 3D adds no work.
 *
 * @param {object} experience
 * @returns {Array<object>}
 */
export function creativeResourcesFor(experience) {
  if (!experience || !experience.id) return [];
  const resources = [];

  for (const chunk of experience.chunks ?? []) {
    resources.push({
      id: `${experience.id}-${chunk}-chunk`,
      kind: 'module',
      chunk,
      label: `${experience.id} ${chunk} engine`,
      background: false,
    });
  }

  for (const audio of experience.audio ?? []) {
    if (!audio || typeof audio.prepare !== 'function') continue;
    resources.push({
      id: audio.id,
      kind: 'audio',
      prepare: audio.prepare,
      label: audio.id,
      background: audio.background ?? false,
    });
  }

  for (const texture of experience.textures ?? []) {
    if (!texture || !texture.url) continue;
    resources.push({
      id: texture.id ?? `${experience.id}-texture`,
      kind: 'texture',
      url: texture.url,
      bytes: texture.bytes,
      background: texture.background ?? false,
    });
  }

  for (const model of experience.models ?? []) {
    if (!model || !model.url) continue;
    resources.push({
      id: model.id ?? `${experience.id}-model`,
      kind: 'model',
      url: model.url,
      bytes: model.bytes,
      background: model.background ?? false,
    });
  }

  return resources;
}

/**
 * Registers a visual experience with the hub if it has no definition yet.
 * Existing manifest entries already carry the derived resources, so this is a
 * no-op for them; a brand-new feature needs no separate hub registration.
 *
 * @param {object} experience
 * @returns {boolean} True when this call registered the experience.
 */
export function ensureVisualExperienceRegistered(experience) {
  if (!experience || !experience.id) return false;
  if (getExperienceDefinition(experience.id)) return false;

  const resources = creativeResourcesFor(experience);
  if (resources.length === 0) return false;

  registerExperienceResources({
    id: experience.id,
    version: experience.version ?? 1,
    label: experience.label ?? experience.id,
    routes: experience.routes ?? [],
    dependsOn: experience.dependsOn ?? [],
    resources,
  });
  return true;
}

/**
 * Installs the graphics resource adapters and registers any visual experience
 * the manifest does not already describe. Called once by the readiness manifest,
 * which the root layout mounts.
 *
 * @returns {{ adapters: () => void, registered: string[] }}
 */
export function installCreativeExperiences() {
  const uninstallAdapters = installGraphicsResourceAdapters();
  const registered = [];
  for (const experience of VISUAL_EXPERIENCES) {
    if (ensureVisualExperienceRegistered(experience)) registered.push(experience.id);
  }
  return { adapters: uninstallAdapters, registered };
}

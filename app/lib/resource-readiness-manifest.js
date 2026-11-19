/**
 * Experience resource registrations for the site-wide readiness hub.
 *
 * Each entry declares only what an experience needs *prepared*. It does not
 * declare how the experience plays audio, animates, renders or runs its
 * business logic, and the hub never calls any of that.
 *
 * Versioning: `version` participates in the hub's resource identity. Bump it
 * when a registered asset or route bundle changes so stale prepared state is
 * dropped. URLs deliberately stay byte-identical to the ones used in markup so
 * the browser's existing HTTP cache entry is the one the hub warms; adding a
 * query string here would create a second cache entry that the page never uses.
 *
 * The paid personal Reveal and the paid Gift Reveal share the same route bundle
 * and the same reveal animation assets, so they register once as `reveal`
 * (`/reveal` also covers `/reveal/[revealId]`). Gift delivery and sharing are a
 * separate email/share path with no animation resource set, so they are not
 * registered here as another reveal.
 */

import { preloadCrystalBallAudio } from './audio.js';
import { registerExperienceResources } from './resource-readiness.js';

/**
 * Rough byte sizes for the registered assets, used as an evidence-backed budget
 * signal. Background preparation only runs resources marked `background: true`,
 * which are the small derivatives an experience actually displays first.
 */
const REVEAL_CARD_BACK = {
  id: 'reveal-card-back',
  kind: 'image',
  url: '/IMG_20260728_220305_112042.avif',
  bytes: 30_714,
  background: true,
};

const REVEAL_BACKDROP = {
  id: 'reveal-backdrop',
  kind: 'image',
  url: '/NGC4216_crawford-1280w.avif',
  bytes: 47_665,
  background: true,
};

// Responsive artwork registrations name one derivative. The hub compares image
// identity (`imageIdentity` strips a `-640w`/`-1024w` token), so a route that has
// already painted a larger or smaller width of the same artwork reuses it
// instead of downloading this derivative as a second copy.
const LUCKY_METER_SKY = {
  id: 'lucky-meter-sky',
  kind: 'image',
  url: '/images/lucky-meter-night-sky-640w.avif',
  bytes: 61_326,
  background: true,
};

const CRYSTAL_BALL_PEDESTAL = {
  id: 'crystal-ball-pedestal',
  kind: 'image',
  url: '/assets/crystal-ball-pedestal-420w.avif',
  bytes: 66_706,
  background: true,
};

const MAP_STORY_IMAGE = {
  id: 'map-story-image',
  kind: 'image',
  url: '/IMG_20260731_055452_187611.avif',
  bytes: 38_666,
  background: true,
};

// The sky backdrop is 453 KB. It is prepared on the route or on explicit intent
// only, never by the homepage's idle budget.
const MAP_SKY = {
  id: 'map-sky',
  kind: 'image',
  url: '/assets/lucky-map-sky.avif',
  bytes: 453_740,
  background: false,
};

/** @type {ReadonlyArray<object>} */
export const EXPERIENCE_DEFINITIONS = Object.freeze([
  {
    id: 'reveal',
    version: 1,
    label: 'Lucky Card Reveal (personal and gift)',
    routes: ['/reveal'],
    dependsOn: [],
    resources: [
      REVEAL_CARD_BACK,
      REVEAL_BACKDROP,
      { id: 'reveal-route', kind: 'code', route: '/reveal' },
    ],
  },
  {
    id: 'lucky-meter',
    version: 1,
    label: 'Lucky Meter / Daily Resonance',
    routes: ['/lucky-meter'],
    dependsOn: [],
    resources: [
      LUCKY_METER_SKY,
      { id: 'lucky-meter-route', kind: 'code', route: '/lucky-meter' },
    ],
  },
  {
    // The generator is part of the Lucky Meter page: it reuses that page's
    // route bundle and waits for the meter registration, so the shared code
    // resource is prepared once and the dependency is honestly declared.
    id: 'lucky-number-generator',
    version: 1,
    label: 'Lucky Number Generator',
    routes: ['/lucky-meter'],
    dependsOn: ['lucky-meter'],
    resources: [{ id: 'lucky-meter-route', kind: 'code', route: '/lucky-meter' }],
  },
  {
    id: 'crystal-ball',
    version: 1,
    label: 'Crystal Ball',
    routes: ['/crystal-ball'],
    dependsOn: [],
    resources: [
      CRYSTAL_BALL_PEDESTAL,
      { id: 'crystal-ball-route', kind: 'code', route: '/crystal-ball' },
      // Preparing a sound never unlocks or starts it. The existing loader still
      // defers on a constrained connection and the activation path still owns
      // the unlock and playback.
      {
        id: 'crystal-ball-audio',
        kind: 'audio',
        prepare: preloadCrystalBallAudio,
        background: false,
      },
    ],
  },
  {
    id: 'lucky-map',
    version: 1,
    label: 'Lucky Map',
    routes: ['/map'],
    dependsOn: [],
    resources: [
      MAP_STORY_IMAGE,
      MAP_SKY,
      { id: 'map-route', kind: 'code', route: '/map' },
    ],
  },
  {
    id: 'lucky-stories',
    version: 1,
    label: 'Lucky Stories',
    routes: ['/map'],
    dependsOn: ['lucky-map'],
    // Stories are rendered from the map page's server-supplied data. There is no
    // story API or data preload here: the hub deliberately does not warm APIs.
    resources: [{ id: 'map-route', kind: 'code', route: '/map' }],
  },
]);

/** Homepage ordering: the first likely next experience is prepared first. */
export const HOMEPAGE_LIKELY_NEXT = Object.freeze([
  'lucky-meter',
  'reveal',
  'crystal-ball',
  'lucky-map',
]);

for (const definition of EXPERIENCE_DEFINITIONS) {
  registerExperienceResources(definition);
}

/**
 * Resolves the registered experiences for a pathname. A route matches exactly or
 * as a path segment prefix, so `/reveal/[revealId]` maps to `reveal` without
 * making `/reveal-something` match.
 *
 * @param {string} pathname
 * @returns {string[]} Experience ids ordered by their manifest priority.
 */
export function experiencesForPath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return [];
  const path = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return EXPERIENCE_DEFINITIONS.filter((definition) =>
    definition.routes.some((route) => path === route || path.startsWith(`${route}/`)),
  ).map((definition) => definition.id);
}

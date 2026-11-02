/**
 * Golden maple-leaf confetti shared by the homepage Explore Your Luck experience
 * and the Lucky Reveal celebration.
 *
 * One path and one normalized particle shape mean the paid reveal celebrates with
 * the exact same leaf artwork as the homepage instead of a look-alike copy.
 */

// Same golden maple-leaf outline used by public/images/maple-leaf.svg.
// Its SVG viewBox is 4030 x 4030, centered at y=15. Map that geometry to a
// 10 x 10 particle while centering it, avoiding canvas-confetti's expensive
// path scan (which cannot infer bounds from this negative-coordinate path).
export const MAPLE_LEAF_PATH = 'm-90 2030 45-863a95 95 0 0 0-111-98l-859 151 116-320a65 65 0 0 0-20-73l-941-762 212-99a65 65 0 0 0 34-79l-186-572 542 115a65 65 0 0 0 73-38l105-247 423 454a65 65 0 0 0 111-57l-204-1052 327 189a65 65 0 0 0 91-27L0-2000l332 652a65 65 0 0 0 91 27l327-189-204 1052a65 65 0 0 0 111 57l423-454 105 247a65 65 0 0 0 73 38l542-115-186 572a65 65 0 0 0 34 79l212 99-941 762a65 65 0 0 0-20 73l116 320-859-151a95 95 0 0 0-111 98l45 863z';
export const MAPLE_LEAF_MATRIX = [0.00248138958, 0, 0, 0.00248138958, 0, -0.0372208437];

// PERFORMANCE: canvas-confetti is only needed once a celebration is activated, so
// it stays out of the initial JavaScript. The module is prefetched after hydration
// and awaited in the activation path, which preserves the effect while removing it
// from the critical path.
let confettiLibPromise = null;

/**
 * Loads the canvas-confetti module once and reuses the same promise for every
 * later activation.
 *
 * @returns {Promise<object>} The canvas-confetti module export.
 */
export function loadConfetti() {
  if (!confettiLibPromise) {
    confettiLibPromise = import('canvas-confetti')
      .then((module) => module.default ?? module)
      .catch((error) => {
        // Allow a later attempt to retry instead of caching the failure.
        confettiLibPromise = null;
        throw error;
      });
  }
  return confettiLibPromise;
}

let mapleLeafShape = null;

/**
 * Returns the cached normalized maple-leaf confetti shape, or null when
 * the browser cannot create path shapes so the caller can use basic shapes.
 *
 * @param {object} confettiLib The loaded canvas-confetti module.
 * @returns {object|null} A canvas-confetti shape definition.
 */
export function createMapleLeafShape(confettiLib) {
  if (mapleLeafShape) return mapleLeafShape;
  if (typeof confettiLib?.shapeFromPath !== 'function') return null;

  try {
    mapleLeafShape = confettiLib.shapeFromPath({
      path: MAPLE_LEAF_PATH,
      matrix: MAPLE_LEAF_MATRIX,
    });
  } catch (error) {
    console.warn('Maple leaf shape creation failed; using fallback particles.', error);
    return null;
  }

  return mapleLeafShape;
}

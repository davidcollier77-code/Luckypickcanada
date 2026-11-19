/**
 * The heavy engine chunks the readiness hub may warm.
 *
 * Every import here is a literal `import('...')` on purpose: the bundler can
 * statically see it, so the chunk is emitted and cached instead of producing a
 * "critical dependency" warning from a computed specifier. A chunk is only
 * loaded when a registered experience actually asks for it, so a page that
 * needs no 3D, no timeline and no confetti downloads none of them.
 */

const CHUNKS = Object.freeze({
  three: () => import('three'),
  gsap: () => import('gsap'),
  confetti: () => import('canvas-confetti'),
  howler: () => import('howler'),
});

/** Names a visual-experience descriptor may request. */
export const ENGINE_CHUNK_NAMES = Object.freeze(Object.keys(CHUNKS));

/**
 * @param {string} name
 * @returns {Promise<any>} The module, or a rejected promise for an unknown chunk.
 */
export function loadEngineChunk(name) {
  const loader = CHUNKS[name];
  if (typeof loader !== 'function') {
    return Promise.reject(new Error(`Unknown graphics engine chunk: ${String(name)}`));
  }
  return loader();
}

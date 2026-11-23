/**
 * Lazy model loading for cinematic 3D scenes.
 *
 * `GLTFLoader` is Three.js's own loader and is imported only when a scene
 * actually requests a model, so no page pays for it up front. The loaded scene
 * is returned with a `dispose()` that releases its geometries, materials and
 * textures.
 *
 * Deliberately not configured here:
 *   - Draco and KTX2 decoding need decoder binaries served from `public/`.
 *     Add them (and a compressed asset pipeline) when a commissioned effect
 *     actually ships compressed models, rather than downloading decoders that
 *     nothing uses.
 *   - Nothing is preloaded and no URL is cached globally; the caller owns asset
 *     lifecycles and can use the existing resource-readiness hub for intent
 *     prefetching.
 */

import { disposeSceneResources } from './resources.js';

/**
 * A request that stops making progress is treated as a failed one. Without
 * this, a stalled connection would leave the caller awaiting a promise that
 * never settles, which contradicts the fail-soft contract. The timer restarts
 * on every progress event, so a slow but live download is never cut short.
 */
const STALL_TIMEOUT_MS = 30_000;

/**
 * Loads a glTF/GLB model.
 *
 * @param {string} url
 * @param {{ onProgress?: (event: { loaded: number, total: number }) => void }} [options]
 * @returns {Promise<null | {
 *   scene: any,
 *   scenes: any[],
 *   animations: any[],
 *   cameras: any[],
 *   asset: any,
 *   dispose: () => void,
 * }>}
 */
export async function loadGLTF(url, { onProgress } = {}) {
  if (typeof url !== 'string' || !url.trim()) return null;

  let GLTFLoader;
  try {
    ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    let settled = false;
    let stallTimer = null;

    const clearStallTimer = () => {
      if (stallTimer === null) return;
      clearTimeout(stallTimer);
      stallTimer = null;
    };

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearStallTimer();
      resolve(value);
    };

    const watchForStall = () => {
      clearStallTimer();
      stallTimer = /* DevSkim: ignore DS172411 */ setTimeout(() => finish(null), STALL_TIMEOUT_MS);
    };

    try {
      const loader = new GLTFLoader();
      watchForStall();
      loader.load(
        url,
        (gltf) => {
          if (settled) {
            // The request finished after it was given up on: release what it
            // parsed instead of leaking it.
            if (gltf?.scene) disposeSceneResources(gltf.scene);
            return;
          }
          if (!gltf?.scene) {
            finish(null);
            return;
          }
          finish({
            scene: gltf.scene,
            scenes: gltf.scenes ?? [gltf.scene],
            animations: gltf.animations ?? [],
            cameras: gltf.cameras ?? [],
            asset: gltf.asset ?? null,
            dispose: () => disposeSceneResources(gltf.scene),
          });
        },
        (event) => {
          // Progress means the request is alive; restart the stall window.
          watchForStall();
          if (typeof onProgress !== 'function') return;
          onProgress({
            loaded: Number.isFinite(event?.loaded) ? event.loaded : 0,
            total: Number.isFinite(event?.total) ? event.total : 0,
          });
        },
        // A failed request is a fallback for the caller, never an exception on
        // the page.
        () => finish(null),
      );
    } catch {
      finish(null);
    }
  });
}

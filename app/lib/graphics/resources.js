/**
 * Best-effort GPU resource disposal for procedural and loaded Three.js scenes.
 *
 * A scene that is removed from a page without disposing its geometries,
 * materials and textures keeps its GPU memory until the context is lost, so
 * every toolkit entry point calls this on teardown. It is defensive by design:
 * a partially constructed object, a shared material or a missing texture must
 * never turn cleanup into an exception.
 */

/**
 * Records an object as released, so a texture, material or geometry shared by
 * several meshes is disposed once per teardown instead of once per reference.
 *
 * @param {unknown} value
 * @param {Set<unknown>} disposed
 * @returns {boolean}
 */
function markDisposed(value, disposed) {
  if (!value || disposed.has(value)) return false;
  disposed.add(value);
  return true;
}

/**
 * Disposes the texture-like values a material holds (maps, environment maps,
 * uniforms and similar). A texture shared by several materials is released
 * once; repeating a disposal on an already disposed texture is harmless in
 * Three.js, but reporting it once is the contract.
 *
 * @param {Record<string, unknown>} material
 * @param {Set<unknown>} disposed
 */
function disposeMaterialTextures(material, disposed) {
  for (const value of Object.values(material)) {
    if (!value) continue;
    const candidates = Array.isArray(value) ? value : [value];
    for (const candidate of candidates) {
      if (
        candidate &&
        candidate.isTexture &&
        typeof candidate.dispose === 'function' &&
        markDisposed(candidate, disposed)
      ) {
        candidate.dispose();
      }
    }
  }
}

/**
 * Disposes one material and the textures it owns.
 *
 * @param {unknown} material
 * @param {Set<unknown>} disposed
 */
function disposeMaterial(material, disposed) {
  if (!material || typeof material !== 'object') return;
  if (!markDisposed(material, disposed)) return;
  try {
    disposeMaterialTextures(material, disposed);
  } catch {
    // A material with an exotic property is still safe to dispose below.
  }
  if (typeof material.dispose === 'function') {
    try {
      material.dispose();
    } catch {
      // Cleanup is best effort; never let it block the caller's teardown.
    }
  }
}

/**
 * Releases the geometries, materials and textures under a Three.js scene or
 * object graph. Safe to call twice and safe on a partial graph.
 *
 * @param {{ traverse?: (callback: (object: any) => void) => void } | null} [root]
 */
export function disposeSceneResources(root) {
  if (!root || typeof root.traverse !== 'function') return;

  const disposed = new Set();

  try {
    root.traverse((object) => {
      if (!object) return;

      const geometry = object.geometry;
      if (
        geometry &&
        typeof geometry.dispose === 'function' &&
        markDisposed(geometry, disposed)
      ) {
        try {
          geometry.dispose();
        } catch {
          // Ignore a geometry that cannot be disposed here.
        }
      }

      const material = object.material;
      if (Array.isArray(material)) {
        for (const entry of material) disposeMaterial(entry, disposed);
      } else {
        disposeMaterial(material, disposed);
      }
    });
  } catch {
    // A graph being mutated during teardown must not throw at the caller.
  }
}

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
 * Disposes the texture-like values a material holds (maps, environment maps,
 * uniforms and similar). Shared textures are disposed once; repeating a
 * disposal on an already disposed texture is harmless in Three.js.
 *
 * @param {Record<string, unknown>} material
 */
function disposeMaterialTextures(material) {
  for (const value of Object.values(material)) {
    if (!value) continue;
    const candidates = Array.isArray(value) ? value : [value];
    for (const candidate of candidates) {
      if (candidate && candidate.isTexture && typeof candidate.dispose === 'function') {
        candidate.dispose();
      }
    }
  }
}

/**
 * Disposes one material and the textures it owns.
 *
 * @param {unknown} material
 */
function disposeMaterial(material) {
  if (!material || typeof material !== 'object') return;
  try {
    disposeMaterialTextures(material);
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

  try {
    root.traverse((object) => {
      if (!object) return;

      const geometry = object.geometry;
      if (geometry && typeof geometry.dispose === 'function') {
        try {
          geometry.dispose();
        } catch {
          // Ignore a geometry that cannot be disposed here.
        }
      }

      const material = object.material;
      if (Array.isArray(material)) {
        for (const entry of material) disposeMaterial(entry);
      } else {
        disposeMaterial(material);
      }
    });
  } catch {
    // A graph being mutated during teardown must not throw at the caller.
  }
}

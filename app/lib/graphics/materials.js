/**
 * Material presets for cinematic Three.js scenes.
 *
 * Three.js is never imported here: the caller passes the module it already
 * loaded, so this stays a pure factory and cannot add a bundle chunk on its
 * own. Every preset is physically based, exposed in a form a feature can tune,
 * and tracked so `dispose()` can release the whole set.
 *
 * Tiers stay conservative: glass transmission and clear-coat are only enabled on
 * the high tier, because they add render passes and fragment cost.
 */

const PRESETS = Object.freeze({
  GOLD: 'gold',
  ENAMEL: 'enamel',
  GLASS: 'glass',
  GLOW: 'glow',
});

export const MATERIAL_PRESETS = PRESETS;

function isHigh(quality) {
  return quality?.tier === 'high';
}

/**
 * Creates a material library bound to one Three.js module and quality profile.
 *
 * @param {any} THREE The loaded Three.js module.
 * @param {{ quality?: { tier?: string } }} [options]
 * @returns {{
 *   gold: (overrides?: object) => any,
 *   enamel: (color?: number|string, overrides?: object) => any,
 *   glass: (color?: number|string, overrides?: object) => any,
 *   glow: (color?: number|string, overrides?: object) => any,
 *   dispose: () => void,
 * }}
 */
export function createMaterialLibrary(THREE, { quality } = {}) {
  const created = new Set();
  const high = isHigh(quality);

  function track(material) {
    created.add(material);
    return material;
  }

  function standard(options) {
    return track(new THREE.MeshStandardMaterial(options));
  }

  function physical(options) {
    if (typeof THREE.MeshPhysicalMaterial !== 'function') return standard(options);
    return track(new THREE.MeshPhysicalMaterial(options));
  }

  return {
    /** Warm metal: the site's gold, with a procedural environment response. */
    gold(overrides = {}) {
      return standard({
        color: 0xf5c451,
        metalness: 1,
        roughness: 0.28,
        envMapIntensity: 1.15,
        ...overrides,
      });
    },
    /** Painted enamel, the medallion and card language. */
    enamel(color = 0x14233f, overrides = {}) {
      return standard({
        color,
        metalness: 0.35,
        roughness: 0.42,
        clearcoat: high ? 1 : undefined,
        clearcoatRoughness: 0.18,
        ...overrides,
      });
    },
    /** Glass for the crystal-ball family. Transmission is high-tier only. */
    glass(color = 0xbfe3ff, overrides = {}) {
      return physical({
        color,
        metalness: 0,
        roughness: 0.08,
        transparent: true,
        opacity: high ? 0.55 : 0.4,
        transmission: high ? 0.85 : 0,
        thickness: high ? 0.6 : 0,
        ior: 1.45,
        ...overrides,
      });
    },
    /** Emissive light source for bloom-driven cinematics. */
    glow(color = 0xffd479, overrides = {}) {
      return standard({
        color,
        emissive: color,
        emissiveIntensity: 2.2,
        metalness: 0,
        roughness: 1,
        toneMapped: false,
        ...overrides,
      });
    },
    dispose() {
      for (const material of created) {
        try {
          material.dispose?.();
        } catch {
          // A material already released by the scene must not block teardown.
        }
      }
      created.clear();
    },
  };
}

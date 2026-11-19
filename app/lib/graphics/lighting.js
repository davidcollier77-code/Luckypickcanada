/**
 * Cinematic lighting rigs for Three.js scenes.
 *
 * A scene needs light before it needs materials. This builds a small, tiered
 * rig — a hemisphere ambient plus up to three shaped lights — and a `pulse`
 * hook so a visual event (an explosion, a colour pour) can flash the whole rig
 * instead of drawing a separate overlay.
 *
 * The light count obeys the same budget the stage resolves, so a constrained
 * device never compiles more lights than it was given.
 */

const TIER_LIGHTS = Object.freeze({
  high: 4,
  balanced: 2,
  constrained: 1,
});

/**
 * @param {any} THREE The loaded Three.js module.
 * @param {{ quality?: { tier?: string }, budget?: { maxLights?: number } }} [options]
 * @returns {{
 *   lights: any[],
 *   addTo: (scene: any) => void,
 *   setKeyIntensity: (value: number) => void,
 *   pulse: (strength?: number, color?: number|string) => void,
 *   update: (delta: number) => void,
 *   dispose: () => void,
 * }}
 */
export function createLightRig(THREE, { quality, budget } = {}) {
  const tier = quality?.tier === 'high' || quality?.tier === 'constrained' ? quality.tier : 'balanced';
  const maxLights = Math.max(
    1,
    Math.min(
      Number.isFinite(budget?.maxLights) ? budget.maxLights : TIER_LIGHTS[tier],
      TIER_LIGHTS[tier],
    ),
  );

  const lights = [];
  const hemi = new THREE.HemisphereLight(0xfff2d0, 0x1a2947, 0.55);
  lights.push(hemi);

  let key = null;
  let rim = null;
  let fill = null;

  if (maxLights > 1) {
    key = new THREE.DirectionalLight(0xfff0cf, 1.35);
    key.position.set(3, 5, 4);
    lights.push(key);
  }
  if (maxLights > 2) {
    rim = new THREE.PointLight(0xffc86b, 1.6, 14, 2);
    rim.position.set(-3.4, 1.6, -2.6);
    lights.push(rim);
  }
  if (maxLights > 3) {
    fill = new THREE.PointLight(0x7fb6ff, 0.7, 12, 2);
    fill.position.set(2.6, -2.2, 2.4);
    lights.push(fill);
  }

  const base = lights.map((light) => light.intensity ?? 0);
  let flash = 0;
  let flashColor = null;
  let addedTo = null;

  function addTo(scene) {
    if (!scene || typeof scene.add !== 'function') return;
    addedTo = scene;
    for (const light of lights) scene.add(light);
  }

  return {
    lights,
    addTo,
    setKeyIntensity(value) {
      if (!key || !Number.isFinite(value)) return;
      key.intensity = Math.max(0, value);
      base[lights.indexOf(key)] = key.intensity;
    },
    pulse(strength = 1, color = 0xffd479) {
      flash = Math.max(flash, Number.isFinite(strength) ? strength : 1);
      flashColor = color;
    },
    update(delta) {
      if (flash <= 0) return;
      // The flash decays on wall time, so a slow frame cannot stretch it.
      flash = Math.max(0, flash - Math.max(0, delta) * 1.8);
      for (let index = 0; index < lights.length; index += 1) {
        const light = lights[index];
        if (!light) continue;
        light.intensity = base[index] + flash * 2.4;
        if (flashColor !== null && index > 0 && light.color?.set) {
          light.color.set(flashColor);
        }
      }
      if (flash === 0) {
        for (let index = 0; index < lights.length; index += 1) {
          if (lights[index]) lights[index].intensity = base[index];
        }
        flashColor = null;
      }
    },
    dispose() {
      if (addedTo && typeof addedTo.remove === 'function') {
        for (const light of lights) addedTo.remove(light);
      }
      addedTo = null;
      lights.length = 0;
    },
  };
}

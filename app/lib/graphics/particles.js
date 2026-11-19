/**
 * GPU particle fields for cinematic Three.js scenes.
 *
 * The site's existing cinematic stage has its own mature point pipeline. This is
 * the reusable Three.js counterpart for new work: one bounded `Points` object,
 * budgeted by the shared quality tier, with an update hook so a feature can make
 * it react to a timeline or a light pulse.
 *
 * Three.js is passed in, never imported: the caller already has it, and this
 * module must never create a chunk on its own.
 */

/** Small deterministic PRNG so a scene composes the same on every reload. */
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {any} THREE The loaded Three.js module.
 * @param {{
 *   count?: number,
 *   quality?: { tier?: string, particleScale?: number, sparkBudget?: number },
 *   color?: number,
 *   size?: number,
 *   spread?: { x?: number, y?: number, z?: number },
 *   drift?: number,
 *   additive?: boolean,
 *   seed?: number,
 * }} [options]
 * @returns {{
 *   points: any,
 *   count: number,
 *   update: (delta: number, elapsed: number) => void,
 *   setIntensity: (value: number) => void,
 *   dispose: () => void,
 * }}
 */
export function createParticleField(THREE, options = {}) {
  const {
    count: requested = 600,
    quality,
    color = 0xffd479,
    size = 0.055,
    spread = {},
    drift = 0.16,
    additive = true,
    seed = 7,
  } = options;

  const budget = Number.isFinite(quality?.sparkBudget) ? quality.sparkBudget : 600;
  const scale = Number.isFinite(quality?.particleScale) ? quality.particleScale : 1;
  const count = Math.max(0, Math.min(Math.round(requested * scale), budget));
  if (count === 0) {
    return { points: null, count: 0, update() {}, setIntensity() {}, dispose() {} };
  }

  const random = mulberry32(seed);
  const bounds = {
    x: Math.max(0.1, Number(spread.x) || 6),
    y: Math.max(0.1, Number(spread.y) || 3.6),
    z: Math.max(0.1, Number(spread.z) || 3),
  };

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * bounds.x;
    positions[index * 3 + 1] = (random() - 0.5) * bounds.y;
    positions[index * 3 + 2] = (random() - 0.5) * bounds.z;
    phases[index] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: additive && THREE.AdditiveBlending ? THREE.AdditiveBlending : undefined,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const original = positions.slice();
  let intensity = 1;
  let disposed = false;


  return {
    points,
    count,
    update(delta, elapsed = 0) {
      if (disposed || !geometry) return;
      const attribute = geometry.getAttribute('position');
      if (!attribute || !attribute.array) return;
      const array = attribute.array;
      for (let index = 0; index < count; index += 1) {
        const base = original[index * 3 + 1];
        const phase = phases[index];
        // A gentle vertical drift plus a lateral sway, bounded to the field.
        let y = base + Math.sin(elapsed * 0.35 + phase) * drift;
        if (y > bounds.y / 2) y -= bounds.y;
        array[index * 3] = original[index * 3] + Math.sin(elapsed * 0.22 + phase) * drift * 0.6;
        array[index * 3 + 1] = y;
      }
      attribute.needsUpdate = true;
      material.opacity = 0.35 + 0.5 * intensity;
    },
    setIntensity(value) {
      if (!Number.isFinite(value)) return;
      intensity = Math.max(0, Math.min(1.4, value));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        geometry.dispose?.();
      } catch {
        // The renderer may already have released the buffer.
      }
      try {
        material.dispose?.();
      } catch {
        // Nothing further to release.
      }
    },
  };
}

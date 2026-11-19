/**
 * Imperative scene builders for the Creative Workbench.
 *
 * The workbench catalogue (`workbench.js`) describes what to mount; this module
 * turns a descriptor into pixels *through the production entry points* — the
 * same `createCreativeSurface`, materials, light rig, particles and audio
 * envelope a commissioned feature uses. Nothing here is a second renderer.
 *
 * Each builder returns the same tiny contract:
 *
 *   { update({ delta, envelope }), setTime(seconds), dispose() }
 *
 * `setTime` makes a frame reproducible: the shapes, particle field and ribbon
 * phase are derived from an internal clock the harness can seek, so two captures
 * of the same scene at the same time are comparable before and after a change.
 */

import { createLightRig } from './lighting.js';
import { createMaterialLibrary } from './materials.js';
import { createParticleField } from './particles.js';
import { GRAPHICS_TECHNOLOGY } from './technologies.js';

/** Small deterministic PRNG, so a seeded scene composes identically every time. */
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
 * Builds the scene a descriptor names on an already-created surface.
 *
 * @param {{ scene: object, surface: object, seed?: number }} options
 * @returns {Promise<null | { update: (frame?: { delta?: number, envelope?: object|null }) => void, setTime: (seconds: number) => void, dispose: () => void }>}
 */
export async function buildWorkbenchScene({ scene, surface, seed = 11 } = {}) {
  if (!scene || !surface) return null;
  if (surface.kind === GRAPHICS_TECHNOLOGY.THREE) return buildThreeScene({ scene, surface, seed });
  if (surface.kind === GRAPHICS_TECHNOLOGY.CANVAS2D) return buildCanvasScene({ scene, surface, seed });
  // An existing engine owns its frames; the workbench does not take them over.
  return null;
}

function buildThreeScene({ scene, surface, seed }) {
  const stage = surface.stage;
  const THREE = stage?.three;
  if (!THREE) return null;

  const crystal = scene.id === 'reactive-crystal';
  const materials = createMaterialLibrary(THREE, { quality: stage.quality });
  const rig = createLightRig(THREE, { quality: stage.quality, budget: stage.budget });
  rig.addTo(stage.scene);

  const motes = createParticleField(THREE, {
    count: crystal ? 700 : 950,
    quality: stage.quality,
    color: crystal ? 0xbfe3ff : 0xffd479,
    size: crystal ? 0.038 : 0.045,
    spread: { x: 7, y: 4, z: 3 },
    seed,
  });
  if (motes.points) stage.scene.add(motes.points);

  const geometry = crystal
    ? new THREE.IcosahedronGeometry(1.15, 2)
    : new THREE.TorusKnotGeometry(1.05, 0.3, 160, 24);
  const body = new THREE.Mesh(geometry, crystal ? materials.glass(0xcfe9ff) : materials.gold());
  stage.scene.add(body);

  stage.camera.position.set(0, 0.35, 5.4);
  if (typeof stage.camera.lookAt === 'function') stage.camera.lookAt(0, 0, 0);

  const unbind = [];
  if (surface.reactive) {
    unbind.push(surface.reactive.bindParticleField(motes, { base: 0.4, range: 0.9 }));
    unbind.push(surface.reactive.bindLightRig(rig, { levelGain: 0.4, beatGain: 1.1 }));
    unbind.push(
      surface.reactive.bindValue(stage.renderer, 'toneMappingExposure', {
        band: 'level',
        min: crystal ? 0.85 : 0.95,
        max: crystal ? 1.45 : 1.3,
      }),
    );
  }

  let elapsed = 0;
  let disposed = false;

  function applyPose() {
    body.rotation.y = elapsed * 0.35;
    body.rotation.x = Math.sin(elapsed * 0.25) * 0.12;
    if (crystal) body.scale.setScalar(1 + Math.sin(elapsed * 0.7) * 0.04);
  }

  applyPose();

  return {
    update({ delta = 0 } = {}) {
      if (disposed) return;
      elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
      applyPose();
      motes.update(Math.max(0.0001, delta), elapsed);
      rig.update(Math.max(0, delta));
    },
    setTime(seconds) {
      if (disposed) return;
      elapsed = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
      applyPose();
      motes.update(0.0001, elapsed);
      rig.update(0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const remove of unbind) {
        try {
          remove();
        } catch {
          // A binding already released with its reactive object needs no work.
        }
      }
      unbind.length = 0;
      try {
        stage.scene.remove(body);
      } catch {
        // The scene may already be disposed.
      }
      motes.dispose();
      rig.dispose();
      materials.dispose();
      try {
        geometry.dispose?.();
      } catch {
        // The stage teardown also releases scene resources.
      }
    },
  };
}

function buildCanvasScene({ scene, surface, seed }) {
  const random = mulberry32(seed);
  const stars = Array.from({ length: 120 }, () => ({
    x: random(),
    y: random(),
    radius: 0.4 + random() * 1.7,
    phase: random() * Math.PI * 2,
    hue: 36 + random() * 34,
  }));
  const ribbons = [0, 1, 2].map((index) => ({
    offset: 0.42 + index * 0.09,
    amplitude: 0.045 + index * 0.012,
    frequency: 1.4 + index * 0.55,
    speed: 0.35 + index * 0.18,
    hue: 186 + index * 22,
  }));

  let elapsed = 0;
  let disposed = false;

  function draw() {
    if (disposed) return;
    const context = surface.context;
    if (!context) return;
    const { width, height } = surface.size;
    const envelope = surface.reactive?.getEnvelope?.() ?? null;
    const level = envelope?.level ?? 0;
    const bass = envelope?.bass ?? 0;
    const highs = envelope?.highs ?? 0;

    context.clearRect(0, 0, width, height);

    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#04070f');
    sky.addColorStop(0.55, '#071228');
    sky.addColorStop(1, '#02040a');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    // A soft centre glow: the resting state is already composed, so a silent
    // capture is a valid frame rather than an empty canvas.
    const glowRadius = Math.max(width, height) * (0.28 + level * 0.16);
    const glow = context.createRadialGradient(
      width * 0.5,
      height * 0.52,
      0,
      width * 0.5,
      height * 0.52,
      glowRadius,
    );
    glow.addColorStop(0, `hsla(${196 + highs * 60}, 92%, 72%, ${0.2 + level * 0.35})`);
    glow.addColorStop(1, 'hsla(210, 90%, 60%, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    for (const star of stars) {
      const twinkle = 0.45 + 0.55 * Math.sin(elapsed * 1.1 + star.phase);
      context.beginPath();
      context.fillStyle = `hsla(${star.hue}, 90%, 78%, ${0.18 + twinkle * 0.5 * (0.4 + level)})`;
      context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.lineWidth = 2;
    for (const ribbon of ribbons) {
      const amplitude = height * ribbon.amplitude * (1 + bass * 2.2);
      context.beginPath();
      for (let step = 0; step <= 64; step += 1) {
        const progress = step / 64;
        const x = progress * width;
        const wave =
          Math.sin(progress * Math.PI * 2 * ribbon.frequency + elapsed * ribbon.speed * 2) +
          0.4 * Math.sin(progress * Math.PI * 5 - elapsed * ribbon.speed);
        const y = height * ribbon.offset + wave * amplitude;
        if (step === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = `hsla(${ribbon.hue + highs * 80}, 88%, ${62 + level * 14}%, ${
        0.32 + level * 0.4
      })`;
      context.stroke();
    }
  }

  draw();

  return {
    update({ delta = 0 } = {}) {
      if (disposed) return;
      // Canvas frames report milliseconds; the scene clock is in seconds.
      elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0) / 1000;
      draw();
    },
    setTime(seconds) {
      if (disposed) return;
      elapsed = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
      draw();
    },
    dispose() {
      disposed = true;
    },
  };
}

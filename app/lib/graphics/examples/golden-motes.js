/**
 * Worked example: a golden-mote 3D scene with bloom, a light pulse, a GSAP
 * timeline and synchronised sound.
 *
 * This module is documentation you can run. It is deliberately not mounted by
 * any page, so it adds no chunk and no visual change; it exists to show the
 * whole creative stack being used through the automatic entry points. Copy the
 * shape into a commissioned feature, or mount it from a page that wants it.
 *
 * Usage:
 *
 *   const scene = await mountGoldenMotes({
 *     canvas,
 *     cues: { resolve: (name) => preparedSounds[name] },
 *   });
 *   scene?.start();
 *   // later
 *   scene?.dispose();
 *
 * Everything is fallback-safe: with no WebGL, no Three.js chunk or no GSAP the
 * function returns `null` and the caller keeps its static artwork.
 */

import { createAudioSync } from '../audio-sync.js';
import { createLightRig } from '../lighting.js';
import { createMaterialLibrary } from '../materials.js';
import { createParticleField } from '../particles.js';
import { createCreativeSurface } from '../runtime.js';
import { createMotionTimeline } from '../timeline.js';
import { GRAPHICS_TECHNOLOGY } from '../technologies.js';

/**
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   cues?: { resolve?: (name: string) => any, shouldPlay?: () => boolean },
 * }} options
 */
export async function mountGoldenMotes({ canvas, cues = {} }) {
  let motes = null;
  let rig = null;

  const surface = await createCreativeSurface({
    canvas,
    requirements: {
      dimension: '3d',
      renderer: GRAPHICS_TECHNOLOGY.THREE,
      postProcessing: true,
      particles: true,
      timeline: true,
      audio: true,
    },
    onFrame: ({ delta, elapsed }) => {
      motes?.update(delta, elapsed);
      rig?.update(delta);
    },
  });

  if (!surface || surface.kind !== GRAPHICS_TECHNOLOGY.THREE) {
    surface?.dispose?.();
    return null;
  }

  const { stage } = surface;
  const THREE = stage.three;
  const materials = createMaterialLibrary(THREE, { quality: surface.plan });
  rig = createLightRig(THREE, { quality: stage.quality, budget: stage.budget });
  rig.addTo(stage.scene);

  // A single torus knot gives the particles something to catch the light.
  const geometry = new THREE.TorusKnotGeometry(1.1, 0.32, 160, 24);
  const body = new THREE.Mesh(geometry, materials.gold());
  stage.scene.add(body);

  motes = createParticleField(THREE, {
    count: 900,
    quality: stage.quality,
    color: 0xffd479,
    size: 0.045,
    spread: { x: 7, y: 4, z: 3 },
    seed: 11,
  });
  if (motes.points) stage.scene.add(motes.points);

  const audio = createAudioSync({
    resolve: cues.resolve,
    shouldPlay: cues.shouldPlay,
  });

  const timeline = await createMotionTimeline({ reducedMotion: surface.plan.reducedMotion });
  timeline?.to(body.rotation, { y: Math.PI * 0.6, duration: 4.2, ease: 'power2.out' });
  timeline?.to(stage.renderer, { toneMappingExposure: 1.15, duration: 1.6 }, 0);
  timeline?.call(() => {
    rig.pulse(1, 0xffd479);
    audio.cue('chime');
  }, 0.4);
  audio.attach(timeline, [{ at: 1.2, cue: 'whoosh' }]);

  surface.start();
  timeline?.play();

  return {
    surface,
    start() {
      surface.start();
      timeline?.play();
    },
    stop() {
      timeline?.pause();
      surface.stop();
    },
    dispose() {
      timeline?.dispose();
      audio.dispose();
      motes?.dispose();
      rig?.dispose();
      materials.dispose();
      try {
        geometry.dispose();
      } catch {
        // The stage teardown also releases it.
      }
      surface.dispose();
    },
  };
}

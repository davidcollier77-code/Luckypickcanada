/**
 * The Lucky Meter's glass vessel and colour pour, rendered as a real
 * three-dimensional scene.
 *
 * The CSS vessel stays as the fallback (and as the first paint while Three.js
 * loads). This module is the commissioned cinematic surface: a thick-walled
 * lathed glass tumbler standing on a lit ground plane, with a coloured liquid
 * that rises inside it, a curved pouring stream that falls from above the frame,
 * a splash at the impact point and gold dust drifting through the air.
 *
 * Everything is built through the shared creative toolkit:
 *   - `createCreativeSurface` owns the renderer, adaptive frame loop, reduced
 *     motion, context loss and teardown. Its post-processing pass adds bloom.
 *   - `createMaterialLibrary` supplies the gold and glass presets.
 *   - `createLightRig` supplies the tiered lights.
 *   - `createParticleField` supplies the bounded dust field.
 *
 * Three.js is never imported here; the runtime loads it on demand, so a page
 * that never reveals a colour downloads nothing.
 */

import { createCreativeSurface } from '../graphics/runtime.js';
import { createMaterialLibrary } from '../graphics/materials.js';
import { createLightRig } from '../graphics/lighting.js';
import { createParticleField } from '../graphics/particles.js';

const VESSEL_HEIGHT = 2.24;
const VESSEL_RADIUS = 1.12;
const LIQUID_FLOOR = 0.24;
const LIQUID_DEPTH = 1.72;
const STREAM_RADIUS = 0.062;

/**
 * Closed cross-section of the tumbler, revolved by LatheGeometry.
 *
 * The profile walks up the outside, over the polished lip, back down the inside
 * and across the thick base. That single surface gives the glass real wall and
 * floor thickness, so refraction and the rim highlights behave like an object
 * rather than a transparent decal.
 */
const VESSEL_PROFILE = Object.freeze([
  [0.0, 0.0],
  [0.86, 0.0],
  [1.02, 0.055],
  [1.1, 0.18],
  [1.115, 0.7],
  [1.12, 1.92],
  [1.115, 2.14],
  [1.06, VESSEL_HEIGHT],
  [0.985, VESSEL_HEIGHT - 0.02],
  [0.965, 2.14],
  [0.96, 0.66],
  [0.945, 0.36],
  [0.86, 0.3],
  [0.0, 0.28],
]);

/** A shallow arc from above the frame into the vessel. */
const STREAM_POINTS = Object.freeze([
  [0.42, 4.24, 0.16],
  [0.34, 3.5, 0.12],
  [0.2, 2.78, 0.06],
  [0.07, 2.08, 0.01],
  [0.0, 1.22, -0.01],
  [0.0, 0.56, -0.02],
]);

const LIQUID_SURFACE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The free surface of the poured colour: concentric ripples from the impact
 * point plus a soft sheen. It is deliberately small and cheap; the liquid body
 * underneath does the work of reading as volume.
 */
const LIQUID_SURFACE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uImpact;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float radius = length(p);

    // Two slow, smooth ripples rather than a tight ring pattern: the surface
    // should read as moving liquid, not as a struck pattern.
    float wave = sin(radius * 13.0 - uTime * 2.3) * 0.5 + 0.5;
    float wave2 = sin(radius * 21.0 + uTime * 1.4 + 1.7) * 0.5 + 0.5;
    float falloff = smoothstep(0.02, 0.42, radius) * (1.0 - smoothstep(0.68, 1.0, radius));
    float ripple = (wave * 0.6 + wave2 * 0.4) * falloff * (0.05 + uImpact * 0.12);

    // A soft sheen at the centre and a fresnel-like lift at the wall.
    float sheen = pow(max(0.0, 1.0 - radius), 2.6) * 0.16;
    float rim = smoothstep(0.74, 1.0, radius) * 0.14;

    vec3 colour = uColor * (0.94 + sheen + rim) + vec3(0.55, 0.45, 0.32) * ripple;
    gl_FragColor = vec4(colour, 0.86);
  }
`;

/** A no-op when the Performance API is unavailable; never throws. */
function mark(name) {
  try {
    performance.mark(name);
  } catch {
    // Diagnostics are optional.
  }
}

function buildProfile(THREE) {
  return VESSEL_PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
}

function buildStreamCurve(THREE) {
  return new THREE.CatmullRomCurve3(
    STREAM_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.35,
  );
}

/**
 * A tiny 2D canvas gradient used for the contact shadow and the glow sprite.
 * Generated once, disposed with the scene; no image request is made.
 */
function radialTexture(THREE, stops) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  for (const [offset, colour] of stops) gradient.addColorStop(offset, colour);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Builds the small environment the glass and gold reflect.
 *
 * A dark room with two warm strip lights and a cool sky band is enough for the
 * glass to carry real highlights; generating it once through PMREM costs one
 * short frame and no network request.
 */
function createEnvironment(THREE, renderer) {
  let generator;
  try {
    generator = new THREE.PMREMGenerator(renderer);
    const scene = new THREE.Scene();

    const room = new THREE.Mesh(
      new THREE.SphereGeometry(24, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0x081120, side: THREE.BackSide }),
    );
    scene.add(room);

    const addPanel = (colour, width, height, position) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ color: colour }),
      );
      panel.position.set(position[0], position[1], position[2]);
      panel.lookAt(0, 1.1, 0);
      scene.add(panel);
    };

    // Warm strips left and right, a cool broad sky panel behind, and a dim
    // warm bounce below so the base of the glass is not black.
    addPanel(0xfff0c8, 2.2, 9, [-5.2, 5.2, 3.4]);
    addPanel(0xffdca0, 1.1, 7, [5.4, 3.4, 2.6]);
    addPanel(0x9fc6ff, 9, 4.2, [0, 6.4, -5.2]);
    addPanel(0x6b4518, 8, 3, [0, -3.4, 1.4]);

    const target = generator.fromScene(scene, 0.03, 0.1, 60);
    room.geometry.dispose();
    room.material.dispose();
    scene.traverse((object) => {
      if (object.isMesh && object !== room) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });
    return { texture: target.texture, dispose: () => target.dispose() };
  } catch {
    return null;
  } finally {
    try {
      generator?.dispose();
    } catch {
      // A failed environment only costs some reflection quality.
    }
  }
}

/**
 * Creates the vessel scene on a caller-owned canvas.
 *
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   quality?: { tier?: string, maxPixelRatio?: number, particleScale?: number, sparkBudget?: number },
 *   onReady?: () => void,
 *   onUnavailable?: () => void,
 * }} options
 * @returns {Promise<null | {
 *   setState: (state: { colour?: string, fill?: number, pour?: number, open?: number, instant?: boolean }) => void,
 *   start: () => void,
 *   stop: () => void,
 *   dispose: () => void,
 *   readonly ready: boolean,
 * }>}
 */
export async function createLuckyMeterVesselScene({ canvas, quality, onReady, onUnavailable } = {}) {
  if (!canvas || typeof window === 'undefined') return null;
  // A test environment without a WebGL constructor never reaches the runtime;
  // the CSS vessel is the correct result there and no context is requested.
  if (typeof WebGLRenderingContext === 'undefined') {
    onUnavailable?.();
    return null;
  }

  const surface = await createCreativeSurface({
    canvas,
    quality,
    requirements: {
      renderer: 'three',
      dimension: '3d',
      // The vessel is small on screen, so a full-screen bloom chain costs more
      // shader compilation than it adds; emissive liquid, additive glow and the
      // env-lit glass carry the light instead.
      postProcessing: false,
      particles: true,
      timeline: true,
    },
    onFrame: ({ elapsed }) => {
      update(elapsed);
    },
  });

  if (!surface || surface.kind !== 'three' || !surface.stage) {
    surface?.dispose?.();
    onUnavailable?.();
    return null;
  }

  const { stage } = surface;
  mark('vessel-surface');
  const THREE = stage.three;
  const scene = stage.scene;
  const camera = stage.camera;
  const renderer = stage.renderer;
  const materials = createMaterialLibrary(THREE, { quality: stage.quality });

  // A low, slightly downward camera so the open mouth and the liquid surface
  // are both visible, while the stream can enter from above the frame.
  camera.fov = 32;
  camera.near = 0.1;
  camera.far = 60;
  camera.position.set(0, 2.75, 7.7);
  camera.lookAt(0, 1.42, 0);
  camera.updateProjectionMatrix();

  const environment = createEnvironment(THREE, renderer);
  mark('vessel-environment');
  if (environment) {
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.15;
  }

  const lights = createLightRig(THREE, { quality: stage.quality, budget: stage.budget });
  lights.addTo(scene);

  const root = new THREE.Group();
  root.position.y = 0.02;
  root.scale.setScalar(1.2);
  scene.add(root);

  const vessel = new THREE.Group();
  vessel.rotation.y = -0.26;
  root.add(vessel);

  // ── Glass body ─────────────────────────────────────────────────────────
  const glassGeometry = new THREE.LatheGeometry(buildProfile(THREE), 72);
  glassGeometry.computeVertexNormals();
  const glassMaterial = materials.glass(0xd8ecff, {
    roughness: 0.09,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    transmission: stage.quality?.tier === 'high' ? 0.98 : 0,
    thickness: 0.9,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.07,
    envMapIntensity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  // Liquid drawn later must show through the near wall, so the glass never
  // writes depth but keeps a small render order so its highlights sit on top.
  glass.renderOrder = 2;
  vessel.add(glass);

  const rimMaterial = materials.gold({ roughness: 0.22, envMapIntensity: 1.5 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.082, 0.033, 12, 72), rimMaterial);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = VESSEL_HEIGHT - 0.055;
  vessel.add(rim);

  const foot = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.024, 10, 72), rimMaterial);
  foot.rotation.x = Math.PI / 2;
  foot.position.y = 0.045;
  vessel.add(foot);

  // A thin glass lid that tips back and fades as the vessel opens, preserving
  // the storyboard's "unfold then open" beat without hiding the liquid.
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, VESSEL_HEIGHT - 0.02, -1.0);
  vessel.add(lidPivot);
  // Reusing the body glass keeps one fewer physical program to compile.
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.1, 0.045, 72), glassMaterial);
  lid.position.set(0, 0.02, 1.0);
  lidPivot.add(lid);

  // ── Liquid ─────────────────────────────────────────────────────────────
  const liquidGeometry = new THREE.CylinderGeometry(0.945, 0.915, LIQUID_DEPTH, 64, 1, false);
  // The geometry is unit-height positioned with its base at zero, so scaling
  // its Y is the same as raising the fill line.
  liquidGeometry.translate(0, LIQUID_DEPTH / 2, 0);
  const liquidMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa65e3b,
    metalness: 0,
    roughness: 0.075,
    transmission: stage.quality?.tier === 'high' ? 0.32 : 0,
    thickness: 0.55,
    ior: 1.34,
    transparent: true,
    opacity: 0.9,
    emissive: 0x2a0f04,
    emissiveIntensity: 0.4,
    envMapIntensity: 1.25,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
  });
  const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquid.position.y = LIQUID_FLOOR;
  liquid.scale.y = 0.0001;
  liquid.renderOrder = 1;
  vessel.add(liquid);

  const surfaceUniforms = {
    uTime: { value: 0 },
    uImpact: { value: 0 },
    uColor: { value: new THREE.Color(0xa65e3b) },
  };
  const liquidSurfaceMaterial = new THREE.ShaderMaterial({
    uniforms: surfaceUniforms,
    vertexShader: LIQUID_SURFACE_VERTEX,
    fragmentShader: LIQUID_SURFACE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const liquidSurface = new THREE.Mesh(new THREE.CircleGeometry(0.945, 64), liquidSurfaceMaterial);
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = LIQUID_FLOOR + 0.001;
  liquidSurface.renderOrder = 3;
  vessel.add(liquidSurface);

  // A thin meniscus hugs the wall at the free surface, so the liquid meets the
  // glass with a curve instead of a cut-off disc edge.
  const meniscusMaterial = new THREE.MeshBasicMaterial({
    color: 0xc07048,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const meniscus = new THREE.Mesh(new THREE.TorusGeometry(0.941, 0.011, 8, 64), meniscusMaterial);
  meniscus.rotation.x = Math.PI / 2;
  meniscus.renderOrder = 4;
  vessel.add(meniscus);

  const liquidLight = new THREE.PointLight(0xa65e3b, 0.8, 3.4, 2);
  liquidLight.position.set(0, LIQUID_FLOOR + 0.4, 0.25);
  vessel.add(liquidLight);

  // ── Pouring stream ─────────────────────────────────────────────────────
  const streamCurve = buildStreamCurve(THREE);
  const streamGeometry = new THREE.TubeGeometry(streamCurve, 96, STREAM_RADIUS, 10, false);
  const streamMaterial = new THREE.MeshStandardMaterial({
    color: 0xa65e3b,
    emissive: 0x5c250f,
    emissiveIntensity: 0.45,
    metalness: 0.02,
    roughness: 0.18,
    transparent: true,
    opacity: 0.98,
    envMapIntensity: 1.35,
  });
  const stream = new THREE.Mesh(streamGeometry, streamMaterial);
  stream.renderOrder = 4;
  vessel.add(stream);

  // A soft outer halo plus a thin bright core: together they round the column
  // so it reads as liquid catching light, not as an emissive stick.
  const streamGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc08a,
    transparent: true,
    opacity: 0.13,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const streamGlowGeometry = new THREE.TubeGeometry(streamCurve, 96, STREAM_RADIUS * 2.1, 8, false);
  const streamGlow = new THREE.Mesh(streamGlowGeometry, streamGlowMaterial);
  streamGlow.renderOrder = 5;
  vessel.add(streamGlow);

  const streamCoreMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe2bc,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const streamCoreGeometry = new THREE.TubeGeometry(streamCurve, 96, STREAM_RADIUS * 0.3, 6, false);
  const streamCore = new THREE.Mesh(streamCoreGeometry, streamCoreMaterial);
  streamCore.renderOrder = 5;
  vessel.add(streamCore);

  // The leading droplet: a stretched sphere that rides the head of the stream.
  // It owns its material because it is tinted every frame; sharing the stream's
  // material would recolour the whole column with the droplet's tint.
  const headMaterial = streamMaterial.clone();
  const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), headMaterial);
  vessel.add(droplet);

  const splashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd2a4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const splash = new THREE.Mesh(new THREE.RingGeometry(0.055, 0.085, 48), splashMaterial);
  splash.rotation.x = -Math.PI / 2;
  splash.renderOrder = 6;
  vessel.add(splash);

  const droplets = [];
  const dropletMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd6ac,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dropletGeometry = new THREE.SphereGeometry(0.022, 8, 6);
  for (let index = 0; index < 7; index += 1) {
    const bead = new THREE.Mesh(dropletGeometry, dropletMaterial);
    bead.visible = false;
    bead.renderOrder = 6;
    vessel.add(bead);
    droplets.push({
      mesh: bead,
      angle: (index / 7) * Math.PI * 2 + 0.6,
      speed: 0.55 + (index % 3) * 0.2,
      lift: 0.5 + (index % 4) * 0.12,
    });
  }

  // ── Ground contact and caustic glow ────────────────────────────────────
  const shadowTexture = radialTexture(THREE, [
    [0, 'rgba(0, 0, 0, 0.72)'],
    [0.42, 'rgba(0, 0, 0, 0.32)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]);
  let shadow = null;
  if (shadowTexture) {
    shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 3.6),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.85,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    root.add(shadow);
  }

  const glowTexture = radialTexture(THREE, [
    [0, 'rgba(255, 236, 198, 0.95)'],
    [0.34, 'rgba(255, 186, 112, 0.38)'],
    [1, 'rgba(255, 150, 60, 0)'],
  ]);
  let caustic = null;
  if (glowTexture) {
    caustic = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 2.9),
      new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.22,
      }),
    );
    caustic.rotation.x = -Math.PI / 2;
    caustic.position.y = 0.006;
    root.add(caustic);
  }

  // A handful of motes close to the vessel: enough to catch the light, not
  // enough to make the transparent canvas read as a speckled rectangle.
  const dust = createParticleField(THREE, {
    count: 42,
    quality: stage.quality,
    color: 0xffd9a0,
    size: 0.014,
    spread: { x: 1.5, y: 2.4, z: 1 },
    drift: 0.16,
    seed: 19,
  });
  if (dust.points) {
    dust.points.position.y = 1.6;
    root.add(dust.points);
  }

  // ── State ──────────────────────────────────────────────────────────────
  const state = {
    fill: 0,
    pour: 0,
    open: 0,
    targetFill: 0,
    targetPour: 0,
    targetOpen: 0,
    colour: new THREE.Color(0xa65e3b),
    targetColour: new THREE.Color(0xa65e3b),
    impact: 0,
    elapsed: 0,
  };

  const streamGeometries = [streamGeometry, streamGlowGeometry, streamCoreGeometry];

  // The scene spends no frames while nothing is moving. It stops once the pour
  // is finished and the vessel is full, and equally once the untouched empty
  // vessel has settled: the hidden warm-up would otherwise animate dust, lights
  // and glass through the whole anticipation for nothing. The last composed
  // frame stays on the canvas, and a later state change or a resize draws
  // again. The empty state keeps a short grace so its first frames still
  // compile the glass, liquid, dust and light shaders the pour will use.
  const SETTLE_FULL_DELAY = 1.4;
  const SETTLE_EMPTY_DELAY = 0.25;
  let settleStart = null;
  let idleStopped = false;

  function update(elapsed) {
    state.elapsed = elapsed;
    // Values arrive already eased from the storyboard clock; smoothing only
    // removes the one-frame stair-step of React state updates.
    state.fill += (state.targetFill - state.fill) * 0.16;
    state.pour += (state.targetPour - state.pour) * 0.22;
    state.open += (state.targetOpen - state.open) * 0.12;
    state.colour.lerp(state.targetColour, 0.12);

    const fill = Math.min(1, Math.max(0, state.fill));
    const pour = Math.min(1, Math.max(0, state.pour));
    const open = Math.min(1, Math.max(0, state.open));

    // Vessel unfolds from a shallow plate, then settles.
    vessel.scale.set(0.92 + open * 0.08, 0.72 + open * 0.28, 0.92 + open * 0.08);
    vessel.rotation.y = -0.26 + Math.sin(elapsed * 0.32) * 0.018 + (1 - open) * 0.16;
    vessel.rotation.x = (1 - open) * 0.05;
    lidPivot.rotation.x = -open * 1.85;
    lid.visible = open < 0.96;

    const liquidHeight = Math.max(0.0001, fill * LIQUID_DEPTH);
    liquid.scale.y = liquidHeight / LIQUID_DEPTH;
    liquid.position.y = LIQUID_FLOOR;
    liquidMaterial.color.copy(state.colour);
    liquidMaterial.emissive.copy(state.colour).multiplyScalar(0.22);
    liquidSurface.position.y = LIQUID_FLOOR + liquidHeight + 0.004;
    liquidSurface.scale.setScalar(Math.max(0.001, 0.35 + fill * 0.65));
    meniscus.position.y = LIQUID_FLOOR + liquidHeight + 0.006;
    meniscus.scale.setScalar(Math.max(0.001, 0.35 + fill * 0.65));
    meniscusMaterial.color.copy(state.colour).offsetHSL(0, -0.06, 0.18);
    meniscusMaterial.opacity = fill > 0.01 ? 0.28 + Math.sin(elapsed * 3.4) * 0.06 : 0;
    surfaceUniforms.uTime.value = elapsed;
    surfaceUniforms.uImpact.value = state.impact;
    surfaceUniforms.uColor.value.copy(state.colour);
    liquidLight.color.copy(state.colour);
    liquidLight.intensity = 0.28 + fill * 0.9;
    liquidLight.position.y = LIQUID_FLOOR + liquidHeight * 0.7;

    // The stream: revealed from the top down, colour-matched, and only present
    // while there is colour left to pour.
    const streamVisible = pour > 0.015 && pour < 0.998 && fill < 0.999;
    stream.visible = streamVisible;
    streamGlow.visible = streamVisible;
    streamCore.visible = streamVisible;
    droplet.visible = streamVisible;
    if (streamVisible) {
      const reveal = Math.min(1, Math.max(0, pour * 1.08));
      // Every layer of the column is revealed on the same clock, or the halo
      // would show the whole stream before the liquid reached the vessel.
      for (const geometry of streamGeometries) {
        const indexCount = geometry.index ? geometry.index.count : 0;
        if (indexCount > 0) {
          geometry.setDrawRange(0, Math.max(6, Math.floor(indexCount * reveal)));
        }
      }
      streamMaterial.color.copy(state.colour).offsetHSL(0, -0.02, 0.02);
      streamMaterial.emissive.copy(state.colour).multiplyScalar(0.3);
      streamGlowMaterial.color.copy(state.colour).offsetHSL(0, -0.05, 0.2);
      streamGlowMaterial.opacity = 0.1 + Math.sin(elapsed * 9.5) * 0.025;
      streamCoreMaterial.color.copy(state.colour).offsetHSL(0, -0.25, 0.38);
      streamCoreMaterial.opacity = 0.22 + Math.sin(elapsed * 11) * 0.05;

      // The droplet rides the visible head of the pour, using the same curve
      // parameter as the reveal, so it never floats inside the column.
      const head = streamCurve.getPointAt(Math.min(0.999, reveal));
      droplet.position.copy(head);
      droplet.scale.set(1, 1.5 + Math.sin(elapsed * 12) * 0.12, 1);
      headMaterial.color.copy(state.colour).offsetHSL(0, -0.04, 0.08);

      // Splash sits exactly where the stream meets the free surface.
      const impactY = LIQUID_FLOOR + liquidHeight;
      splash.position.set(0, impactY + 0.006, 0);
      const pulse = (elapsed * 1.9) % 1;
      const splashScale = 0.45 + pulse * 1.5;
      splash.scale.set(splashScale, splashScale, splashScale);
      splashMaterial.opacity = (1 - pulse) * 0.55;
      splashMaterial.color.copy(state.colour).offsetHSL(0, -0.08, 0.3);

      for (const bead of droplets) {
        const life = (elapsed * bead.speed + bead.angle) % 1;
        bead.mesh.visible = true;
        bead.mesh.position.set(
          Math.cos(bead.angle) * life * 0.28,
          impactY + life * bead.lift - life * life * 0.55,
          Math.sin(bead.angle) * life * 0.28,
        );
        bead.mesh.scale.setScalar(Math.max(0.001, 1 - life * 0.8));
      }
      state.impact = Math.min(1, state.impact + 0.08);
    } else {
      state.impact = Math.max(0, state.impact - 0.05);
      splashMaterial.opacity = 0;
      droplets.forEach((bead) => {
        bead.mesh.visible = false;
      });
    }

    if (caustic) {
      caustic.material.opacity = 0.08 + fill * 0.26;
      caustic.material.color.copy(state.colour).offsetHSL(0, -0.1, 0.22);
    }
    dust.setIntensity(0.5 + fill * 0.5);
    dust.update(0.016, elapsed);
    lights.update(0.016);
    lights.pulse(fill > 0 ? 0.001 : 0, state.colour.getHex());

    const settledFull = state.targetFill >= 0.999 && state.targetOpen >= 0.999 && fill > 0.994;
    // The hidden warm-up mounts at zero and stays there until the reveal, so an
    // untouched empty vessel is a resting state, not a permanently moving one.
    const settledEmpty =
      state.targetFill <= 0.001 &&
      state.targetPour <= 0.001 &&
      state.targetOpen <= 0.001 &&
      fill <= 0.001 &&
      pour <= 0.001 &&
      open <= 0.001 &&
      state.impact <= 0.001;
    if (settledFull || settledEmpty) {
      if (settleStart === null) settleStart = elapsed;
      else if (
        !idleStopped &&
        elapsed - settleStart > (settledFull ? SETTLE_FULL_DELAY : SETTLE_EMPTY_DELAY)
      ) {
        idleStopped = true;
        surface.stop();
      }
    } else {
      settleStart = null;
      idleStopped = false;
    }
  }

  let ready = false;
  let announced = false;

  function announceReady() {
    if (announced) return;
    announced = true;
    ready = true;
    mark('vessel-ready');
    onReady?.();
  }

  // The first frame is painted by the stage's own loop. Announce readiness on
  // the next macrotask so the caller never swaps the fallback out before there
  // is something on the canvas.
  mark('vessel-built');
  const readyTimer = window.setTimeout(announceReady, 90);

  update(0);
  surface.start();
  mark('vessel-started');

  return {
    setState(next = {}) {
      const previousFill = state.targetFill;
      const previousPour = state.targetPour;
      const previousOpen = state.targetOpen;
      const previousColour = state.targetColour.getHex();
      if (typeof next.fill === 'number' && Number.isFinite(next.fill)) {
        state.targetFill = Math.min(1, Math.max(0, next.fill));
      }
      if (typeof next.pour === 'number' && Number.isFinite(next.pour)) {
        state.targetPour = Math.min(1, Math.max(0, next.pour));
      } else if (typeof next.fill === 'number' && Number.isFinite(next.fill)) {
        // The pour and the fill share one storyboard clock; a caller that only
        // reports the fill still gets the falling stream.
        state.targetPour = state.targetFill;
      }
      if (typeof next.open === 'number' && Number.isFinite(next.open)) {
        state.targetOpen = Math.min(1, Math.max(0, next.open));
      }
      if (typeof next.colour === 'string' && /^#[0-9a-f]{6}$/i.test(next.colour)) {
        state.targetColour.set(next.colour);
      }
      // A real state change re-arms the frame loop after an idle stop, including
      // the move from the empty warm-up to the first live reading. Repeating the
      // same state (the hidden warm-up reporting zero again) leaves it stopped.
      const changed =
        state.targetFill !== previousFill ||
        state.targetPour !== previousPour ||
        state.targetOpen !== previousOpen ||
        state.targetColour.getHex() !== previousColour;
      if (changed) {
        settleStart = null;
        if (idleStopped) {
          idleStopped = false;
          surface.start();
        }
      }
      // A resumed reading starts already full: jump instead of animating a
      // second pour behind the completed result.
      if (next.instant === true) {
        state.fill = state.targetFill;
        state.pour = state.targetPour;
        state.open = state.targetOpen;
        state.colour.copy(state.targetColour);
        state.impact = 0;
      }
    },
    start() {
      surface.start();
    },
    stop() {
      // An explicit stop is an idle stop: the next state change must be able
      // to wake the loop, exactly like the internal settled-empty path.
      idleStopped = true;
      surface.stop();
    },
    dispose() {
      window.clearTimeout(readyTimer);
      announced = true;
      surface.dispose();
      materials.dispose();
      lights.dispose();
      dust.dispose();
      environment?.dispose();
      shadowTexture?.dispose();
      glowTexture?.dispose();
      // The glass and gold presets are tracked by the material library, but the
      // liquid, the stream and the two plane materials are created here and are
      // not, so the scene owns their release.
      shadow?.material?.dispose();
      shadow?.geometry?.dispose();
      caustic?.material?.dispose();
      caustic?.geometry?.dispose();
      glassGeometry.dispose();
      liquidGeometry.dispose();
      liquidMaterial.dispose();
      streamGeometry.dispose();
      streamMaterial.dispose();
      streamGlowGeometry.dispose();
      streamGlowMaterial.dispose();
      streamCoreGeometry.dispose();
      streamCoreMaterial.dispose();
      droplet.geometry.dispose();
      headMaterial.dispose();
      splash.geometry.dispose();
      splashMaterial.dispose();
      dropletGeometry.dispose();
      dropletMaterial.dispose();
      liquidSurface.geometry.dispose();
      liquidSurfaceMaterial.dispose();
      meniscus.geometry.dispose();
      meniscusMaterial.dispose();
      lid.geometry.dispose();
      rim.geometry.dispose();
      foot.geometry.dispose();
    },
    get ready() {
      return ready;
    },
  };
}

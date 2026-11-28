/**
 * The Lucky Meter as one continuous three-dimensional scene.
 *
 * This is the whole physical meter: the struck gold medallion, twelve seasonal
 * chambers, the central decorative maple leaf, the fixed external golden
 * maple-leaf pointer with its curved arm and pouring spout, the receiving glass
 * vessel, the colour stream and the golden transfer beam. There is no SVG
 * artwork in the meter: every physical object is geometry built here.
 *
 * The scene is built through the shared creative toolkit:
 *   - `createCreativeSurface` owns the renderer, adaptive frame loop, reduced
 *     motion, context loss and teardown.
 *   - `createMaterialLibrary` supplies the gold preset.
 *   - `createLightRig` supplies the tiered lights.
 *   - `createParticleField` supplies the bounded gold dust.
 *
 * Three.js is never imported here; the runtime loads it on demand. The central
 * and pointer leaves reuse the existing procedural maple-leaf silhouette from
 * `gpu-geometry.js`, so the shape is authored once.
 *
 * Only the wheel moves. The pointer is fixed at 7:30 and never rotates. The
 * selected chamber drains into the vessel and the vessel remains full; the
 * beam then carries the number to its display.
 */

import { buildMapleLeafGeometry } from '../gpu-geometry.js';
import { createCreativeSurface } from '../graphics/runtime.js';
import { createMaterialLibrary } from '../graphics/materials.js';
import { createLightRig } from '../graphics/lighting.js';
import { createParticleField } from '../graphics/particles.js';
import {
  CHAMBER_COUNT,
  CHAMBER_DEGREES,
  METER_LAYOUT,
  POINTER_ANGLE_DEGREES,
  stageFraming,
} from './meter-layout.js';

const DEG2RAD = Math.PI / 180;
const CAMERA_FOV = 32;

/** The wide, shallow crystal bowl's open cross-section. */
const BOWL_PROFILE = Object.freeze([
  [0.0, 0.0],
  [0.2, 0.0],
  [0.23, 0.015],
  [0.24, 0.035],
  [0.26, 0.05],
  [0.38, 0.1],
  [0.51, 0.18],
  [0.59, 0.28],
  [METER_LAYOUT.vessel.radius, METER_LAYOUT.vessel.height],
]);

/** The moment the idle scene stops rendering; a state change wakes it. */
const IDLE_STOP_SECONDS = 4;
const FINISHED_STOP_SECONDS = 1.25;

/** The longest wait for a produced frame before the complete CSS meter wins. */
export const READY_WATCHDOG_MS = 3000;

/** A no-op when the Performance API is unavailable; never throws. */
function mark(name) {
  try {
    performance.mark(name);
  } catch {
    // Diagnostics are optional.
  }
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

/** Screen angle (0° = 12 o'clock, clockwise) to a Three.js math angle. */
function toMathAngle(screenDegrees) {
  return (90 - screenDegrees) * DEG2RAD;
}

/**
 * One annular chamber sector as a THREE.Shape.
 *
 * Built at 12 o'clock; each chamber group is rotated into place, so the fill
 * shader's radial test always uses the same local frame.
 */
function annularSectorShape(THREE, innerRadius, outerRadius, startDegrees, endDegrees) {
  const start = toMathAngle(startDegrees);
  const end = toMathAngle(endDegrees);
  const outerStart = [
    Math.cos(start) * outerRadius,
    Math.sin(start) * outerRadius,
  ];
  const shape = new THREE.Shape();
  shape.moveTo(outerStart[0], outerStart[1]);
  // Screen angles run clockwise, which is a decreasing math angle.
  shape.absarc(0, 0, outerRadius, start, end, true);
  const innerEnd = [Math.cos(end) * innerRadius, Math.sin(end) * innerRadius];
  shape.lineTo(innerEnd[0], innerEnd[1]);
  shape.absarc(0, 0, innerRadius, end, start, false);
  shape.closePath();
  return shape;
}

/** A tiny 2D canvas gradient for contact shadows and glows. */
function radialTexture(THREE, stops) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(128, 128, 2, 128, 128, 128);
  for (const [offset, colour] of stops) gradient.addColorStop(offset, colour);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * The small environment the gold and glass reflect.
 *
 * A dark room with warm strip lights and a cool sky band is enough for real
 * highlights; generating it once through PMREM costs one short frame and no
 * network request.
 */
function createEnvironment(THREE, renderer) {
  if (!renderer || typeof THREE.PMREMGenerator !== 'function') return null;
  let generator;
  try {
    generator = new THREE.PMREMGenerator(renderer);
    const scene = new THREE.Scene();

    const room = new THREE.Mesh(
      new THREE.SphereGeometry(24, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0x081120, side: THREE.BackSide }),
    );
    scene.add(room);

    const addPanel = (colour, width, height, position) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({ color: colour }),
      );
      panel.position.set(position[0], position[1], position[2]);
      panel.lookAt(0, 0.6, 0);
      scene.add(panel);
    };

    addPanel(0xfff0c8, 2.2, 8, [-5.2, 4.6, 3.4]);
    addPanel(0xffdca0, 1.1, 6, [5.4, 3.0, 2.6]);
    addPanel(0x9fc6ff, 8, 4, [0, 6.2, -5.2]);
    addPanel(0x6b4518, 8, 3, [0, -3.2, 1.4]);
    // A large warm panel in front of the object keeps the gold face from
    // reflecting only the dark room; the cool panel gives the crystal bowl its
    // hard, bright facet highlights.
    addPanel(0xfff3d6, 6.4, 5.0, [0, 1.4, 7.0]);
    addPanel(0xbfe0ff, 3.6, 3.0, [3.2, -0.2, 5.5]);

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

/** Builds a Three.js BufferGeometry from the shared maple-leaf arrays. */
function mapleLeafGeometry(THREE, options) {
  const mesh = buildMapleLeafGeometry(options);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3));
  // BufferGeometry.setIndex only wraps plain arrays; a typed array must arrive
  // as a BufferAttribute or the index buffer uploads with no array.
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A broad, five-lobed maple blade for the fixed pointer. The shared stamped
 * medallion silhouette has long horizontal spikes that read as a star at phone
 * size; this outline keeps the lobes as wedges and a short stem that meets the
 * socket without crossing the selected chamber.
 */
function buildPointerLeafGeometry(THREE) {
  const rightHalf = [
    [0.0, 0.95],
    [0.18, 0.56],
    [0.44, 0.66],
    [0.39, 0.34],
    [0.76, 0.22],
    [0.5, -0.02],
    [0.56, -0.3],
    [0.25, -0.26],
    [0.3, -0.5],
    [0.1, -0.38],
    [0.075, -0.64],
    [0.0, -0.66],
  ];
  const outline = [...rightHalf];
  for (let index = rightHalf.length - 2; index >= 1; index -= 1) {
    const point = rightHalf[index];
    outline.push([-point[0], point[1]]);
  }

  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (const [x, y] of outline.slice(1)) shape.lineTo(x, y);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -0.05);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * The selected chamber's enamel. A horizontal wheel-space level cuts only that
 * chamber as it drains; the gold frame and floor are untouched. The two-lobe
 * specular and Fresnel edge keep the seasonal colours saturated instead of
 * washing them toward white.
 */
function createFillMaterial(THREE, colourHex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colourHex) },
      uLevel: { value: 10 },
      uOpacity: { value: 1 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying float vLocalY;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        vLocalY = position.y;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uLevel;
      uniform float uOpacity;
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying float vLocalY;

      void main() {
        if (vLocalY > uLevel) discard;
        vec3 normal = normalize(vNormalView);
        vec3 view = normalize(vViewDirection);
        vec3 lightA = normalize(vec3(-0.32, 0.45, 1.0));
        vec3 lightB = normalize(vec3(0.55, 0.25, 1.0));
        float diffuse = max(dot(normal, lightA), 0.0);
        float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.2);
        float specularA = pow(max(dot(normal, normalize(lightA + view)), 0.0), 18.0);
        float specularB = pow(max(dot(normal, normalize(lightB + view)), 0.0), 64.0);
        vec3 colour =
          uColor * (0.88 + 0.12 * diffuse + specularA * 0.12) +
          vec3(1.0, 0.94, 0.82) * specularB * 0.18 +
          vec3(1.0, 0.96, 0.88) * fresnel * 0.06;
        gl_FragColor = vec4(colour, uOpacity);
        #include <colorspace_fragment>
      }
    `,
    transparent: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Clear faceted crystal: nearly invisible face-on, bright where a cut facet
 * turns away from the camera. This fakes refraction with a Fresnel alpha and a
 * hard specular glint, so the bowl stays legible without a transmission pass.
 */
function createCrystalMaterial(THREE) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTint: { value: new THREE.Color(0xdffcff) },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDirection;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uTint;
      varying vec3 vNormalView;
      varying vec3 vViewDirection;

      void main() {
        vec3 normal = normalize(vNormalView);
        vec3 view = normalize(vViewDirection);
        float facing = abs(dot(normal, view));
        float fresnel = pow(1.0 - facing, 2.4);
        vec3 lightA = normalize(vec3(-0.45, 0.55, 0.9));
        vec3 lightB = normalize(vec3(0.55, 0.25, 0.95));
        float specularA = pow(max(dot(normal, normalize(lightA + view)), 0.0), 80.0);
        float specularB = pow(max(dot(normal, normalize(lightB + view)), 0.0), 24.0);
        vec3 colour =
          uTint * (0.62 + 0.38 * specularB) +
          vec3(1.0, 0.98, 0.9) * specularA * 0.85;
        float alpha = 0.018 + fresnel * 0.5 + specularA * 0.38 + specularB * 0.03;
        gl_FragColor = vec4(colour, clamp(alpha, 0.0, 0.72));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function drawSpacedText(context, text, x, y, spacing) {
  const characters = Array.from(text);
  const widths = characters.map((character) => context.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (characters.length - 1);
  let cursor = x - total / 2;
  for (let index = 0; index < characters.length; index += 1) {
    context.fillText(characters[index], cursor + widths[index] / 2, y);
    cursor += widths[index] + spacing;
  }
}

/** A crisp cream-and-gold Lucky Number texture for the chamber and transfer. */
function makeNumberTexture(THREE, value) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, 320, 320);
  const backing = context.createRadialGradient(160, 160, 8, 160, 160, 150);
  backing.addColorStop(0, 'rgba(5, 9, 14, 0.78)');
  backing.addColorStop(0.62, 'rgba(5, 9, 14, 0.42)');
  backing.addColorStop(1, 'rgba(5, 9, 14, 0)');
  context.fillStyle = backing;
  context.fillRect(0, 0, 320, 320);

  const glow = context.createRadialGradient(160, 160, 4, 160, 160, 150);
  glow.addColorStop(0, 'rgba(255, 208, 128, 0.16)');
  glow.addColorStop(1, 'rgba(255, 170, 60, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 320, 320);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '600 180px Georgia, "Times New Roman", serif';
  context.strokeStyle = 'rgba(8, 11, 16, 0.9)';
  context.lineWidth = 10;
  context.strokeText(String(value), 160, 168);
  context.fillStyle = '#fff0ce';
  context.shadowColor = 'rgba(255, 190, 82, 0.75)';
  context.shadowBlur = 16;
  context.fillText(String(value), 160, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates the meter scene on a caller-owned canvas.
 *
 * @param {{
 *   canvas: HTMLCanvasElement,
 *   quality?: { tier?: string, maxPixelRatio?: number, particleScale?: number },
 *   onReady?: () => void,
 *   onUnavailable?: () => void,
 *   onContextLost?: () => void,
 *   onContextRestored?: () => void,
 * }} options
 * @returns {Promise<null | {
 *   setState: (state: object) => void,
 *   start: () => void,
 *   stop: () => void,
 *   dispose: () => void,
 *   readonly ready: boolean,
 * }>}
 */
export async function createLuckyMeterScene({
  canvas,
  quality,
  onReady,
  onUnavailable,
  onContextLost,
  onContextRestored,
} = {}) {
  if (!canvas || typeof window === 'undefined') return null;
  // A test environment without a WebGL constructor never reaches the runtime;
  // the CSS fallback is the correct result there and no context is requested.
  if (typeof WebGLRenderingContext === 'undefined') {
    onUnavailable?.();
    return null;
  }

  // A frame failure or a lost context must win over the delayed ready
  // announcement; otherwise the stage can hand back to a canvas that has
  // already been stopped.
  let failed = false;
  let ready = false;
  let announced = false;
  let readyFrame = 0;
  let readyHandoffFrame = 0;
  let readyWatchdog = 0;
  let startSurface = () => {};
  let stopSurface = () => {};
  // A watchdog stop is recoverable when the context returns; an explicit stop
  // is not. Track the cause so restore only wakes the surface it stopped.
  let watchdogStopped = false;
  let resizeObserver = null;

  const surface = await createCreativeSurface({
    canvas,
    quality,
    requirements: {
      renderer: 'three',
      dimension: '3d',
      // The meter reads light from emissive colour, gold PBR and the procedural
      // environment; a full-screen bloom chain costs more shader compilation
      // than it adds on a mid-range phone.
      postProcessing: false,
      particles: true,
      timeline: true,
    },
    onFrame: ({ elapsed }) => {
      update(elapsed);
      noteProducedFrame();
    },
    onContextLost: () => {
      clearReadyWatch();
      failed = true;
      onContextLost?.();
    },
    onContextRestored: () => {
      failed = false;
      // A context restore redraws once, but a surface stopped by the watchdog
      // still has wantsAnimation=false. Wake it before the one-frame restore
      // can announce ready and retire the fallback behind a static canvas.
      if (watchdogStopped && !announced) {
        watchdogStopped = false;
        startSurface();
      }
      if (!announced) armReadyWatchdog();
      onContextRestored?.();
    },
    // A frame exception stops the shared loop. Never leave a blank canvas in
    // its place: hand the meter to its complete CSS fallback.
    onError: (error) => {
      clearReadyWatch();
      failed = true;
      watchdogStopped = false;
      console.warn('Lucky Meter scene frame failed; using the CSS meter.', error);
      onUnavailable?.();
    },
  });

  if (!surface || surface.kind !== 'three' || !surface.stage) {
    surface?.dispose?.();
    onUnavailable?.();
    return null;
  }

  startSurface = () => surface.start();
  stopSurface = () => surface.stop();

  const { stage } = surface;
  const THREE = stage.three;
  const scene = stage.scene;
  const camera = stage.camera;
  const renderer = stage.renderer;
  const qualityTier = stage.quality?.tier ?? 'balanced';
  const high = qualityTier === 'high';
  const constrained = qualityTier === 'constrained';
  const materials = createMaterialLibrary(THREE, { quality: stage.quality });

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const trackGeometry = (geometry) => {
    ownedGeometries.add(geometry);
    return geometry;
  };
  const trackMaterial = (material) => {
    ownedMaterials.add(material);
    return material;
  };

  mark('meter-surface');

  camera.fov = CAMERA_FOV;
  camera.near = 0.1;
  camera.far = 60;

  // The stage is square in the visitor route, but its CSS size changes between
  // phone, tablet and desktop layouts. One perspective camera adapts its
  // distance and look-at height; geometry is never scaled non-uniformly.
  const applyFraming = () => {
    const width = canvas.clientWidth || 390;
    const height = canvas.clientHeight || width;
    const framing = stageFraming(width, height);
    camera.position.set(0, framing.lookY, framing.distance);
    camera.lookAt(0, framing.lookY, 0);
    camera.updateProjectionMatrix();
  };
  applyFraming();
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(applyFraming);
    resizeObserver.observe(canvas);
  }

  const environment = createEnvironment(THREE, renderer);
  if (environment) {
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.1;
  }

  const lights = createLightRig(THREE, { quality: stage.quality, budget: stage.budget });
  lights.addTo(scene);

  // A dedicated key light for the wheel face, so the chambers read as lit metal
  // even when the shared rig is reduced to one light. The constrained tier keeps
  // the rig's single light and skips this one so the budget is never exceeded.
  const faceLight = constrained ? null : new THREE.PointLight(0xffe6b8, high ? 1.35 : 1.05, 9, 2);
  if (faceLight) {
    faceLight.position.set(1.1, 1.7, 3.4);
    scene.add(faceLight);
  }

  const root = new THREE.Group();
  root.position.set(0, 0, 0);
  scene.add(root);

  // ── Wheel medallion ────────────────────────────────────────────────────
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(METER_LAYOUT.wheel.x, METER_LAYOUT.wheel.y, METER_LAYOUT.wheel.z);
  root.add(wheelGroup);

  const gold = materials.gold({ roughness: 0.24, envMapIntensity: 1.45 });

  const bodyGeometry = trackGeometry(
    new THREE.CylinderGeometry(
      METER_LAYOUT.wheel.outerRadius,
      METER_LAYOUT.wheel.outerRadius,
      0.16,
      high ? 96 : constrained ? 40 : 64,
    ),
  );
  bodyGeometry.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeometry, gold);
  body.position.z = -0.12;
  wheelGroup.add(body);

  const outerRimGeometry = trackGeometry(new THREE.TorusGeometry(1.045, 0.046, 12, high ? 96 : 56));
  const outerRim = new THREE.Mesh(outerRimGeometry, gold);
  outerRim.position.z = 0.005;
  wheelGroup.add(outerRim);

  const innerRimGeometry = trackGeometry(new THREE.TorusGeometry(0.515, 0.03, 10, 72));
  const innerRim = new THREE.Mesh(innerRimGeometry, gold);
  innerRim.position.z = 0.045;
  wheelGroup.add(innerRim);

  // The dark enamel well behind the central leaf.
  const wellMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: 0x070b11,
      metalness: 0.42,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.24,
      envMapIntensity: 0.6,
    }),
  );
  const wellGeometry = trackGeometry(new THREE.CylinderGeometry(0.505, 0.505, 0.03, high ? 80 : 48));
  wellGeometry.rotateX(Math.PI / 2);
  const well = new THREE.Mesh(wellGeometry, wellMaterial);
  well.position.z = 0.035;
  wheelGroup.add(well);

  // A warm halo behind the object, so the gold appears to light the sky.
  const haloTexture = radialTexture(THREE, [
    [0, 'rgba(255, 214, 138, 0.55)'],
    [0.42, 'rgba(255, 176, 72, 0.18)'],
    [1, 'rgba(255, 150, 50, 0)'],
  ]);
  if (haloTexture) {
    const halo = new THREE.Mesh(
      trackGeometry(new THREE.PlaneGeometry(3.4, 3.4)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          map: haloTexture,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.55,
        }),
      ),
    );
    halo.position.z = -0.36;
    wheelGroup.add(halo);
  }

  // ── The twelve seasonal chambers ───────────────────────────────────────
  const chamberFills = [];

  const chamberShape = annularSectorShape(
    THREE,
    METER_LAYOUT.wheel.chamberInnerRadius + 0.016,
    METER_LAYOUT.wheel.chamberOuterRadius - 0.016,
    -CHAMBER_DEGREES / 2 + 2.0,
    CHAMBER_DEGREES / 2 - 2.0,
  );
  const frameShape = annularSectorShape(
    THREE,
    METER_LAYOUT.wheel.chamberInnerRadius,
    METER_LAYOUT.wheel.chamberOuterRadius,
    -CHAMBER_DEGREES / 2 + 0.5,
    CHAMBER_DEGREES / 2 - 0.5,
  );
  // Pierce the gold plate so the recessed enamel shows through a real border.
  // The hole is slightly smaller than the fill, which tucks the enamel under
  // the frame lip instead of leaving a visible gap.
  const frameHole = annularSectorShape(
    THREE,
    METER_LAYOUT.wheel.chamberInnerRadius + 0.024,
    METER_LAYOUT.wheel.chamberOuterRadius - 0.024,
    -CHAMBER_DEGREES / 2 + 2.6,
    CHAMBER_DEGREES / 2 - 2.6,
  );
  frameShape.holes.push(frameHole);

  const frameGeometry = trackGeometry(
    new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: constrained ? 10 : 20,
    }),
  );
  const fillBaseGeometry = trackGeometry(
    new THREE.ExtrudeGeometry(chamberShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.006,
      bevelSegments: 1,
      curveSegments: constrained ? 10 : 20,
    }),
  );

  for (let index = 0; index < CHAMBER_COUNT; index += 1) {
    const group = new THREE.Group();
    group.rotation.z = -index * CHAMBER_DEGREES * DEG2RAD;
    wheelGroup.add(group);

    const frame = new THREE.Mesh(frameGeometry, gold);
    frame.position.z = 0.06;
    group.add(frame);

    // A gold floor behind the enamel is what the empty chamber shows after the
    // pour; without it the recessed hole falls into the dark body and the
    // emerging number has no readable ground.
    const floorGeometry = trackGeometry(
      new THREE.ShapeGeometry(chamberShape, constrained ? 10 : 20),
    );
    floorGeometry.rotateZ(-index * CHAMBER_DEGREES * DEG2RAD);
    const floor = new THREE.Mesh(floorGeometry, gold);
    floor.position.z = 0.045;
    wheelGroup.add(floor);

    const fillGeometry = trackGeometry(fillBaseGeometry.clone());
    fillGeometry.rotateZ(-index * CHAMBER_DEGREES * DEG2RAD);
    fillGeometry.computeBoundingBox();
    const bounds = fillGeometry.boundingBox;
    const fillMaterial = trackMaterial(createFillMaterial(THREE, '#f5c451'));
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    fill.position.z = 0.07;
    fill.renderOrder = 1;
    wheelGroup.add(fill);

    chamberFills.push({
      material: fillMaterial,
      minY: bounds?.min.y ?? -1,
      maxY: bounds?.max.y ?? 1,
      mesh: fill,
    });
  }

  // ── Central medallion and the reading well ─────────────────────────────
  // The wheel turns to put the selected chamber under the pointer. The well and
  // its reading belong to the visitor, not the mechanism: counter-rotate their
  // own group so the medallion and percentage stay upright while the chambers
  // turn. The medallion is real geometry that turns over, not a cross-fade.
  const centreGroup = new THREE.Group();
  wheelGroup.add(centreGroup);

  const leafGeometry = trackGeometry(
    mapleLeafGeometry(THREE, { thickness: 0.12, bevel: 0.05, dome: 0.034 }),
  );
  const medallionMaterial = trackMaterial(
    materials
      .gold({
        roughness: 0.22,
        metalness: 0.74,
        envMapIntensity: 1.65,
        emissive: 0x3a2408,
        emissiveIntensity: 0.34,
        side: THREE.DoubleSide,
      })
      .clone(),
  );
  const medallion = new THREE.Mesh(leafGeometry, medallionMaterial);
  medallion.scale.setScalar(0.54);
  medallion.position.set(0, 0.01, 0.16);
  centreGroup.add(medallion);

  // Raised veins turn the stamped silhouette into a readable maple relief. A
  // single unit cylinder is shared; each vein is scaled to its lobe and the
  // whole set inherits the medallion's flip and settle.
  const medallionVeinMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffe2a2,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const medallionVeinGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.0085, 0.0085, 1, 4),
  );
  for (const [x, y] of [
    [0, 0.78],
    [0.52, 0.48],
    [0.66, 0.02],
    [-0.66, 0.02],
    [-0.52, 0.48],
    [0, -0.82],
  ]) {
    const length = Math.hypot(x, y);
    for (const side of [0.102, -0.102]) {
      const vein = new THREE.Mesh(medallionVeinGeometry, medallionVeinMaterial);
      vein.position.set(x / 2, y / 2, side);
      vein.rotation.z = -Math.atan2(x, y);
      vein.scale.set(1, Math.max(0.001, length), 1);
      medallion.add(vein);
    }
  }

  // ── Fixed external pointer, curved arm and spout ───────────────────────
  const pointerAssembly = new THREE.Group();
  root.add(pointerAssembly);

  const socketPosition = METER_LAYOUT.arm.socket;
  const socketOuterGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.095, 0.11, 0.11, high ? 40 : 24),
  );
  socketOuterGeometry.rotateX(Math.PI / 2);
  const socket = new THREE.Mesh(socketOuterGeometry, gold);
  socket.position.set(socketPosition[0], socketPosition[1], socketPosition[2]);
  pointerAssembly.add(socket);

  const socketRingGeometry = trackGeometry(new THREE.TorusGeometry(0.1, 0.016, 8, 36));
  const socketRing = new THREE.Mesh(socketRingGeometry, gold);
  socketRing.position.set(socketPosition[0], socketPosition[1], socketPosition[2] + 0.06);
  pointerAssembly.add(socketRing);

  const pointerLeafMaterial = trackMaterial(
    materials
      .gold({
        roughness: 0.21,
        metalness: 0.74,
        envMapIntensity: 1.7,
        emissive: 0x3a2408,
        emissiveIntensity: 0.36,
        // The blade is seen from the camera side; the extruded edge and back
        // face must light as gold too, never as a black silhouette.
        side: THREE.DoubleSide,
      })
      .clone(),
  );
  const pointerLeafGeometry = trackGeometry(buildPointerLeafGeometry(THREE));

  const pointerLeafGroup = new THREE.Group();
  pointerLeafGroup.scale.setScalar(METER_LAYOUT.pointer.leafScale * 1.1);
  pointerLeafGroup.position.set(-0.92, -0.3, 0.18);
  // The apex points up-right, inward toward the selected chamber.
  pointerLeafGroup.rotation.z = -45 * DEG2RAD;
  pointerLeafGroup.rotation.x = -0.1;
  pointerAssembly.add(pointerLeafGroup);

  // A dark, slightly larger silhouette separates the gold blade from the gold
  // wheel rim; without it the pointer reads as another rim ornament.
  const pointerShadow = new THREE.Mesh(
    pointerLeafGeometry,
    trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x1c0d03,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    ),
  );
  pointerShadow.scale.setScalar(1.06);
  pointerShadow.position.z = -0.02;
  pointerShadow.renderOrder = 1;
  pointerLeafGroup.add(pointerShadow);

  const pointerLeaf = new THREE.Mesh(pointerLeafGeometry, pointerLeafMaterial);
  pointerLeafGroup.add(pointerLeaf);

  // Engraved veins are the strongest maple signal at phone size: the silhouette
  // is small, but the midrib and four lobes read immediately.
  const pointerVeinGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.022, 0.022, 1, 4),
  );
  const pointerVeinMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0x6b3d0f,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );
  for (const [x, y] of [
    [0, 0.86],
    [0.44, 0.58],
    [0.7, 0.18],
    [-0.7, 0.18],
    [-0.44, 0.58],
    [0, -0.58],
  ]) {
    const length = Math.hypot(x, y);
    const vein = new THREE.Mesh(pointerVeinGeometry, pointerVeinMaterial);
    vein.position.set(x / 2, y / 2, 0.075);
    vein.rotation.z = -Math.atan2(x, y);
    vein.scale.set(1, Math.max(0.001, length), 1);
    pointerLeafGroup.add(vein);
  }

  const armCurve = new THREE.CatmullRomCurve3(
    [
      METER_LAYOUT.arm.base,
      METER_LAYOUT.arm.shoulder,
      [-1.04, -0.31, 0.07],
      socketPosition,
      [-0.86, -0.42, 0.07],
      METER_LAYOUT.arm.spout,
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.4,
  );

  const armGeometry = trackGeometry(
    new THREE.TubeGeometry(armCurve, high ? 96 : 56, METER_LAYOUT.arm.tubeRadius, 10, false),
  );
  const arm = new THREE.Mesh(armGeometry, gold);
  pointerAssembly.add(arm);

  const armHighlightMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffe6ae,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const armHighlightGeometry = trackGeometry(
    new THREE.TubeGeometry(armCurve, high ? 96 : 56, METER_LAYOUT.arm.tubeRadius * 0.3, 6, false),
  );
  const armHighlight = new THREE.Mesh(armHighlightGeometry, armHighlightMaterial);
  armHighlight.position.z = 0.012;
  pointerAssembly.add(armHighlight);

  const spoutLipGeometry = trackGeometry(new THREE.TorusGeometry(0.05, 0.012, 8, 28));
  const spoutLip = new THREE.Mesh(spoutLipGeometry, gold);
  spoutLip.position.set(
    METER_LAYOUT.arm.spout[0],
    METER_LAYOUT.arm.spout[1],
    METER_LAYOUT.arm.spout[2],
  );
  spoutLip.rotation.x = Math.PI / 2.4;
  pointerAssembly.add(spoutLip);

  // ── Faceted crystal receiving bowl ─────────────────────────────────────
  const bowlGroup = new THREE.Group();
  bowlGroup.position.set(METER_LAYOUT.vessel.x, METER_LAYOUT.vessel.y, METER_LAYOUT.vessel.z);
  root.add(bowlGroup);

  // A single open shell, not a thick double wall: the liquid stays visible and
  // the twelve radial segments read as cut crystal instead of frosted glass.
  const bowlGlassMaterial = trackMaterial(createCrystalMaterial(THREE));
  const bowlGlassSource = trackGeometry(
    new THREE.LatheGeometry(
      BOWL_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
      constrained ? 10 : 12,
    ),
  );
  // Per-triangle normals make the low-segment lathe read as cut facets even
  // though the glass itself is almost clear.
  const bowlFacetGeometry = trackGeometry(bowlGlassSource.toNonIndexed());
  bowlFacetGeometry.computeVertexNormals();
  const bowlGlass = new THREE.Mesh(bowlFacetGeometry, bowlGlassMaterial);
  bowlGlass.renderOrder = 2;
  bowlGroup.add(bowlGlass);

  const bowlEdges = new THREE.LineSegments(
    trackGeometry(new THREE.EdgesGeometry(bowlGlassSource, 24)),
    trackMaterial(
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  bowlEdges.renderOrder = 3;
  bowlGroup.add(bowlEdges);

  // A crisp glass rim and base ring catch the light even when the body is almost
  // transparent; together with the facet edges they define the crystal.
  const bowlGlassRim = new THREE.Mesh(
    trackGeometry(
      new THREE.TorusGeometry(METER_LAYOUT.vessel.radius - 0.008, 0.006, 6, high ? 72 : 40),
    ),
    trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xeaffff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  bowlGlassRim.rotation.x = Math.PI / 2;
  bowlGlassRim.position.y = METER_LAYOUT.vessel.height - 0.004;
  bowlGlassRim.renderOrder = 4;
  bowlGroup.add(bowlGlassRim);

  const bowlBaseHighlight = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.235, 0.004, 6, high ? 48 : 28)),
    trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xdffcff,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  bowlBaseHighlight.rotation.x = Math.PI / 2;
  bowlBaseHighlight.position.y = 0.045;
  bowlBaseHighlight.renderOrder = 4;
  bowlGroup.add(bowlBaseHighlight);

  const bowlRim = new THREE.Mesh(
    trackGeometry(
      new THREE.TorusGeometry(METER_LAYOUT.vessel.radius, 0.02, 8, high ? 72 : 40),
    ),
    gold,
  );
  bowlRim.rotation.x = Math.PI / 2;
  bowlRim.position.y = METER_LAYOUT.vessel.height;
  bowlGroup.add(bowlRim);

  const bowlFoot = new THREE.Mesh(
    trackGeometry(new THREE.CylinderGeometry(0.22, 0.28, 0.12, 12)),
    gold,
  );
  bowlFoot.position.y = -0.05;
  bowlGroup.add(bowlFoot);

  const bowlFootRing = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.27, 0.02, 8, 32)),
    gold,
  );
  bowlFootRing.rotation.x = Math.PI / 2;
  bowlFootRing.position.y = -0.11;
  bowlGroup.add(bowlFootRing);

  const liquidMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: 0xa65e3b,
      metalness: 0,
      roughness: 0.06,
      transmission: 0,
      thickness: 0.3,
      ior: 1.34,
      transparent: true,
      opacity: 0.96,
      emissive: 0x2a0f04,
      emissiveIntensity: 0.58,
      envMapIntensity: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      side: THREE.DoubleSide,
      flatShading: true,
    }),
  );
  const liquidGeometry = trackGeometry(
    new THREE.CylinderGeometry(
      METER_LAYOUT.vessel.liquidRadius,
      METER_LAYOUT.vessel.liquidRadius * 0.93,
      METER_LAYOUT.vessel.liquidDepth,
      12,
      1,
      false,
    ),
  );
  liquidGeometry.translate(0, METER_LAYOUT.vessel.liquidDepth / 2, 0);
  const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquid.position.y = METER_LAYOUT.vessel.liquidFloor;
  liquid.scale.y = 0.001;
  liquid.renderOrder = 1;
  bowlGroup.add(liquid);

  const liquidSurfaceMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xc07048,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const liquidSurface = new THREE.Mesh(
    trackGeometry(new THREE.CircleGeometry(METER_LAYOUT.vessel.liquidRadius, 12)),
    liquidSurfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = METER_LAYOUT.vessel.liquidFloor + 0.004;
  liquidSurface.renderOrder = 3;
  bowlGroup.add(liquidSurface);

  const meniscusMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xc07048,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const meniscus = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.535, 0.009, 6, 36)),
    meniscusMaterial,
  );
  meniscus.rotation.x = Math.PI / 2;
  meniscus.position.y = METER_LAYOUT.vessel.liquidFloor + 0.006;
  meniscus.renderOrder = 4;
  bowlGroup.add(meniscus);

  const liquidLight = new THREE.PointLight(0xa65e3b, 0.2, 2.4, 2);
  liquidLight.position.set(0, METER_LAYOUT.vessel.liquidFloor + 0.12, 0.16);
  bowlGroup.add(liquidLight);

  const bowlRimLight = constrained ? null : new THREE.PointLight(0xbfe8ff, 0.6, 2.2, 2);
  if (bowlRimLight) {
    bowlRimLight.position.set(-0.2, METER_LAYOUT.vessel.height - 0.02, 0.35);
    bowlGroup.add(bowlRimLight);
  }

  const bowlShadowTexture = radialTexture(THREE, [
    [0, 'rgba(0, 0, 0, 0.55)'],
    [0.5, 'rgba(0, 0, 0, 0.22)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]);
  if (bowlShadowTexture) {
    const bowlShadow = new THREE.Mesh(
      trackGeometry(new THREE.PlaneGeometry(1.75, 1.75)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          map: bowlShadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.65,
        }),
      ),
    );
    bowlShadow.rotation.x = -Math.PI / 2;
    bowlShadow.position.set(
      METER_LAYOUT.vessel.x,
      METER_LAYOUT.vessel.y - 0.16,
      0.0,
    );
    root.add(bowlShadow);
  }

  // ── Lucky Number inside the selected chamber ───────────────────────────
  const numberCentre = {
    x:
      METER_LAYOUT.wheel.x +
      0.79 * Math.sin((POINTER_ANGLE_DEGREES * Math.PI) / 180),
    y:
      METER_LAYOUT.wheel.y +
      0.79 * Math.cos((POINTER_ANGLE_DEGREES * Math.PI) / 180),
  };
  // A world-space horizontal clip reveals the number from the top down as the
  // chamber drains, exactly as the liquid falls.
  const numberClip = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    -(numberCentre.y + 0.18),
  );
  const numberMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: null,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      clippingPlanes: [numberClip],
    }),
  );
  if (renderer) renderer.localClippingEnabled = true;
  const numberPlane = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(0.36, 0.36)),
    numberMaterial,
  );
  numberPlane.position.set(numberCentre.x, numberCentre.y, 0.2);
  numberPlane.visible = false;
  root.add(numberPlane);
  let numberTexture = null;
  let shownNumber = null;

  // ── Pour stream ────────────────────────────────────────────────────────
  const streamCurve = new THREE.CatmullRomCurve3(
    [
      METER_LAYOUT.arm.spout,
      [-0.785, -0.47, 0.05],
      [-0.78, -0.55, 0.05],
      [-0.78, -0.65, 0.05],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.4,
  );
  const streamGeometry = trackGeometry(
    new THREE.TubeGeometry(streamCurve, 48, 0.022, 8, false),
  );
  const streamMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0xa65e3b,
      emissive: 0x5c250f,
      emissiveIntensity: 0.5,
      metalness: 0.02,
      roughness: 0.16,
      transparent: true,
      opacity: 0.98,
      envMapIntensity: 1.3,
    }),
  );
  const stream = new THREE.Mesh(streamGeometry, streamMaterial);
  stream.renderOrder = 4;
  root.add(stream);

  const streamGlowMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffc08a,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const streamGlowGeometry = trackGeometry(
    new THREE.TubeGeometry(streamCurve, 48, 0.05, 6, false),
  );
  const streamGlow = new THREE.Mesh(streamGlowGeometry, streamGlowMaterial);
  streamGlow.renderOrder = 5;
  root.add(streamGlow);

  const splashMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffd2a4,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const splashGeometry = trackGeometry(new THREE.RingGeometry(0.03, 0.055, 36));
  const splash = new THREE.Mesh(splashGeometry, splashMaterial);
  splash.rotation.x = -Math.PI / 2;
  splash.position.set(METER_LAYOUT.vessel.x, -0.66, METER_LAYOUT.vessel.z + 0.02);
  splash.renderOrder = 6;
  root.add(splash);

  const dropletMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffd6ac,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const dropletGeometry = trackGeometry(new THREE.SphereGeometry(0.02, 8, 6));
  const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
  droplet.renderOrder = 6;
  root.add(droplet);

  // ── Golden transfer beam ───────────────────────────────────────────────
  const beamCurve = new THREE.CatmullRomCurve3(
    [
      METER_LAYOUT.beam.from,
      [-0.72, -0.48, 0.34],
      [-0.62, -1.02, 0.36],
      [-0.24, -1.3, 0.38],
      METER_LAYOUT.beam.to,
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.45,
  );
  const beamGeometry = trackGeometry(new THREE.TubeGeometry(beamCurve, 72, 0.055, 8, false));
  const beamMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffb545,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.renderOrder = 7;
  root.add(beam);

  const beamCoreGeometry = trackGeometry(new THREE.TubeGeometry(beamCurve, 72, 0.014, 6, false));
  const beamCoreMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffdda0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const beamCore = new THREE.Mesh(beamCoreGeometry, beamCoreMaterial);
  beamCore.renderOrder = 8;
  root.add(beamCore);

  const orbMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffe2a2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const orbGeometry = trackGeometry(new THREE.SphereGeometry(0.055, 14, 10));
  const orb = new THREE.Mesh(orbGeometry, orbMaterial);
  orb.renderOrder = 9;
  root.add(orb);

  // ── Ambient dust ───────────────────────────────────────────────────────
  const dust = createParticleField(THREE, {
    count: constrained ? 18 : 38,
    quality: stage.quality,
    color: 0xffd9a0,
    size: 0.012,
    spread: { x: 1.5, y: 2.2, z: 0.8 },
    drift: 0.14,
    seed: 23,
  });
  if (dust.points) {
    dust.points.position.y = 0.2;
    root.add(dust.points);
  }

  // ── State ──────────────────────────────────────────────────────────────
  const state = {
    wheelAngle: 0,
    targetWheelAngle: 0,
    drain: 0,
    targetDrain: 0,
    vesselFill: 0,
    targetVesselFill: 0,
    pour: 0,
    targetPour: 0,
    leaf: 0,
    targetLeaf: 0,
    beam: 0,
    targetBeam: 0,
    numberReveal: 0,
    targetNumberReveal: 0,
    phase: 'idle',
    colour: new THREE.Color(0xf5c451),
    targetColour: new THREE.Color(0xf5c451),
  };

  let selectedIndex = -1;
  const streamGeometries = [streamGeometry, streamGlowGeometry];
  let settleStart = null;
  let idleStopped = false;
  let pointerWakeAt = 0;

  function setChamberPalette(palette) {
    const colours = Array.isArray(palette) ? palette : [];
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const colour = colours[index];
      if (!colour) continue;
      chamberFills[index].material.uniforms.uColor.value.set(colour.hex);
    }
  }

  function setSelectedIndex(index) {
    selectedIndex = Number.isInteger(index) ? index : -1;
  }

  function applyColour(hex) {
    if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return;
    state.targetColour.set(hex);
  }

  function update(frameElapsed = 0) {
    const secs = Number(frameElapsed) || 0;

    // The component already supplies eased values; a light smoothing pass only
    // removes the one-frame stair-step of React state updates.
    state.wheelAngle += (state.targetWheelAngle - state.wheelAngle) * 0.4;
    state.drain += (state.targetDrain - state.drain) * 0.2;
    state.vesselFill += (state.targetVesselFill - state.vesselFill) * 0.18;
    state.pour += (state.targetPour - state.pour) * 0.3;
    state.leaf += (state.targetLeaf - state.leaf) * 0.24;
    state.beam += (state.targetBeam - state.beam) * 0.22;
    state.numberReveal += (state.targetNumberReveal - state.numberReveal) * 0.22;
    state.colour.lerp(state.targetColour, 0.16);

    wheelGroup.rotation.z = -state.wheelAngle * DEG2RAD;

    // The medallion is a real gold object that turns over and settles as the
    // small ornament at the top of the well. It stays visible: the percentage
    // is revealed behind it, never cross-faded through it.
    centreGroup.rotation.z = -wheelGroup.rotation.z;
    const leaf = clamp01(state.leaf);
    const float = state.phase === 'idle' ? Math.sin(secs * 1.15) * 0.012 : 0;
    medallion.rotation.y = leaf * Math.PI;
    medallion.rotation.z = Math.sin(leaf * Math.PI * 2) * 0.035 * (1 - leaf) + float;
    medallion.position.y = 0.01 + leaf * 0.37 + float;
    medallion.position.z = 0.16 + leaf * 0.01;
    medallion.scale.setScalar(0.54 * (1 - leaf * 0.48));
    medallionMaterial.opacity = 1;
    medallion.visible = true;

    // Every chamber is full except the selected one. The shader cuts only that
    // chamber at a falling wheel-space level, leaving its gold frame and floor
    // intact and exposing the number inside it.
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const chamber = chamberFills[index];
      if (index !== selectedIndex) {
        chamber.material.uniforms.uLevel.value = 10;
        continue;
      }
      const span = chamber.maxY - chamber.minY + 0.04;
      chamber.material.uniforms.uLevel.value =
        chamber.maxY + 0.02 - clamp01(state.drain) * span;
    }

    // The crystal bowl fills and stays full. Only the selected chamber empties;
    // the bowl is the colour's destination, not a second drain.
    const vesselFill = clamp01(state.vesselFill);
    const liquidHeight = vesselFill * METER_LAYOUT.vessel.liquidDepth;
    liquid.scale.y = Math.max(0.001, vesselFill);
    liquid.visible = vesselFill > 0.002;
    liquidMaterial.color.copy(state.colour).offsetHSL(0, 0.04, 0.13);
    liquidMaterial.emissive.copy(state.colour).multiplyScalar(0.22);
    liquidMaterial.emissiveIntensity = 0.35 + vesselFill * 0.23;
    liquidSurface.position.y = METER_LAYOUT.vessel.liquidFloor + liquidHeight + 0.004;
    liquidSurface.scale.setScalar(0.78 + vesselFill * 0.22);
    liquidSurfaceMaterial.color.copy(state.colour).offsetHSL(0, -0.02, 0.24);
    liquidSurfaceMaterial.opacity = vesselFill > 0.02 ? 0.52 : 0;
    meniscus.position.y = METER_LAYOUT.vessel.liquidFloor + liquidHeight + 0.008;
    meniscus.scale.setScalar(0.78 + vesselFill * 0.22);
    meniscusMaterial.color.copy(state.colour).offsetHSL(0, -0.03, 0.24);
    meniscusMaterial.opacity = vesselFill > 0.02 ? 0.62 : 0;
    liquidLight.color.copy(state.colour);
    liquidLight.intensity = 0.12 + vesselFill * 1.0;
    liquidLight.position.y = METER_LAYOUT.vessel.liquidFloor + liquidHeight * 0.65;

    // The stream exists only while colour is arriving; the vessel never drains.
    const pour = clamp01(state.pour);
    const streamVisible = pour > 0.02 && vesselFill < 0.998;
    stream.visible = streamVisible;
    streamGlow.visible = streamVisible;
    droplet.visible = streamVisible;
    if (streamVisible) {
      for (const geometry of streamGeometries) {
        const indexCount = geometry.index ? geometry.index.count : 0;
        if (indexCount > 0) geometry.setDrawRange(0, Math.max(6, Math.floor(indexCount * Math.min(1, pour * 1.2))));
      }
      streamMaterial.color.copy(state.colour).offsetHSL(0, -0.02, 0.02);
      streamMaterial.emissive.copy(state.colour).multiplyScalar(0.32);
      streamGlowMaterial.color.copy(state.colour).offsetHSL(0, -0.05, 0.22);
      const head = streamCurve.getPointAt(Math.min(0.999, Math.max(0, pour)));
      droplet.position.copy(head);
      droplet.scale.set(1, 1.5 + Math.sin(secs * 12) * 0.12, 1);
      dropletMaterial.color.copy(state.colour).offsetHSL(0, -0.05, 0.18);
      const impactY =
        METER_LAYOUT.vessel.y + METER_LAYOUT.vessel.liquidFloor + liquidHeight + 0.02;
      splash.position.y = impactY;
      const pulse = (secs * 1.9) % 1;
      splash.scale.setScalar(0.5 + pulse * 1.6);
      splashMaterial.opacity = (1 - pulse) * 0.55;
      splashMaterial.color.copy(state.colour).offsetHSL(0, -0.08, 0.3);
    } else {
      splashMaterial.opacity = 0;
    }

    // The golden beam carries the number from the vessel to its display.
    const beamProgress = clamp01(state.beam);
    const beamVisible = beamProgress > 0.005;
    beam.visible = beamVisible;
    beamCore.visible = beamVisible;
    orb.visible = beamVisible;
    if (beamVisible) {
      for (const geometry of [beamGeometry, beamCoreGeometry]) {
        const indexCount = geometry.index ? geometry.index.count : 0;
        if (indexCount > 0) geometry.setDrawRange(0, Math.max(6, Math.floor(indexCount * beamProgress)));
      }
      const fade = Math.sin(Math.min(1, beamProgress) * Math.PI);
      beamMaterial.opacity = 0.06 + fade * 0.36;
      beamCoreMaterial.opacity = 0.12 + fade * 0.6;
      const head = beamCurve.getPointAt(Math.min(0.999, beamProgress));
      orb.position.copy(head);
      orb.scale.setScalar(0.7 + fade * 0.9);
      orbMaterial.opacity = 0.25 + fade * 0.65;
    }

    // The number lives in the selected chamber while its liquid falls, then
    // travels continuously along the beam to its own display beside the bowl.
    // It never enters the colour bowl and never disappears mid-transfer.
    const numberReveal = clamp01(state.numberReveal);
    const travelling = beamProgress > 0.001 && numberReveal < 0.999;
    const inChamber = numberReveal < 0.999 && beamProgress <= 0.001;
    numberPlane.visible =
      shownNumber !== null && (travelling || (inChamber && state.drain > 0.06));
    if (numberPlane.visible) {
      numberPlane.quaternion.copy(camera.quaternion);
      if (travelling) {
        // No chamber clip while the number is in the air; the beam is its
        // reveal and the arrival display takes over at the end.
        numberClip.constant = 100;
        const head = beamCurve.getPointAt(Math.min(0.999, beamProgress));
        numberPlane.position.copy(head);
        numberPlane.position.z += 0.02;
        numberPlane.scale.setScalar(0.92 + Math.sin(beamProgress * Math.PI) * 0.28);
      } else {
        numberPlane.position.set(numberCentre.x, numberCentre.y, 0.2);
        numberPlane.scale.setScalar(1);
        const top = numberCentre.y + 0.18;
        const bottom = numberCentre.y - 0.18;
        const revealed = clamp01((state.drain - 0.06) / 0.84);
        numberClip.constant = -(top - revealed * (top - bottom));
      }
    }

    // Idle light: the wheel catches a slow sweep, the pointer glows faintly.
    const selected = selectedIndex >= 0 ? selectedIndex : 0;
    const selectedFill = chamberFills[selected];
    if (selectedFill) {
      selectedFill.material.emissiveIntensity += Math.sin(secs * 2.1) * 0.02;
    }
    if (faceLight) {
      faceLight.intensity = (high ? 1.35 : 1.05) + Math.sin(secs * 0.85) * 0.06;
    }
    lights.update(0.016);
    dust.setIntensity(0.35 + vesselFill * 0.4 + state.beam * 0.3);
    dust.update(0.016, secs);

    // A finished or untouched scene must not keep rendering forever. A state
    // change or a pointer movement wakes it again.
    const atRest =
      state.phase === 'idle' ||
      (state.phase === 'revealed' && state.beam <= 0.01 && state.numberReveal >= 0.99);
    if (atRest) {
      if (settleStart === null) settleStart = secs;
      const delay = state.phase === 'idle' ? IDLE_STOP_SECONDS : FINISHED_STOP_SECONDS;
      if (!idleStopped && secs - settleStart > delay) {
        idleStopped = true;
        surface.stop();
      }
    } else {
      settleStart = null;
      idleStopped = false;
    }
  }

  function clearReadyWatch() {
    if (readyWatchdog) {
      window.clearTimeout(readyWatchdog);
      readyWatchdog = 0;
    }
    if (readyFrame) {
      window.cancelAnimationFrame(readyFrame);
      readyFrame = 0;
    }
    if (readyHandoffFrame) {
      window.cancelAnimationFrame(readyHandoffFrame);
      readyHandoffFrame = 0;
    }
  }

  /**
   * The surface calls `onFrame` before it renders, so the first callback only
   * means a render was submitted. Two animation frames after it the canvas has
   * been presented; only then may the stage hand over.
   */
  function noteProducedFrame() {
    if (announced || failed || readyFrame || readyHandoffFrame) return;
    readyFrame = window.requestAnimationFrame(() => {
      readyFrame = 0;
      if (announced || failed) return;
      readyHandoffFrame = window.requestAnimationFrame(() => {
        readyHandoffFrame = 0;
        announceReady();
      });
    });
  }

  function armReadyWatchdog() {
    if (announced || failed || readyWatchdog) return;
    readyWatchdog = window.setTimeout(() => {
      readyWatchdog = 0;
      if (announced || failed) return;
      // No frame was produced. Keep the complete CSS meter instead of
      // revealing an empty canvas, and stop paying for the surface.
      failed = true;
      watchdogStopped = true;
      stopSurface();
      onUnavailable?.();
    }, READY_WATCHDOG_MS);
  }

  function announceReady() {
    if (announced || failed) return;
    clearReadyWatch();
    announced = true;
    ready = true;
    mark('meter-ready');
    onReady?.();
  }

  const wake = () => {
    if (pointerWakeAt > 0 && performance.now() - pointerWakeAt < 120) return;
    pointerWakeAt = performance.now();
    settleStart = null;
    if (idleStopped) {
      idleStopped = false;
      watchdogStopped = false;
      surface.start();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', wake, { passive: true });
  }

  update(0);
  surface.start();
  armReadyWatchdog();
  mark('meter-started');

  return {
    setState(next = {}) {
      const previous = {
        wheelAngle: state.targetWheelAngle,
        drain: state.targetDrain,
        vesselFill: state.targetVesselFill,
        pour: state.targetPour,
        leaf: state.targetLeaf,
        beam: state.targetBeam,
        numberReveal: state.targetNumberReveal,
        phase: state.phase,
        colour: state.targetColour.getHex(),
      };

      if (typeof next.wheelAngle === 'number' && Number.isFinite(next.wheelAngle)) {
        state.targetWheelAngle = next.wheelAngle;
      }
      const drain = next.chamberDrain ?? next.drain;
      if (typeof drain === 'number' && Number.isFinite(drain)) {
        state.targetDrain = clamp01(drain);
      }
      if (typeof next.vesselFill === 'number' && Number.isFinite(next.vesselFill)) {
        state.targetVesselFill = clamp01(next.vesselFill);
      }
      if (typeof next.pour === 'number' && Number.isFinite(next.pour)) {
        state.targetPour = clamp01(next.pour);
      }
      const leafExit = next.leafExit ?? next.leaf;
      if (typeof leafExit === 'number' && Number.isFinite(leafExit)) {
        state.targetLeaf = clamp01(leafExit);
      }
      if (typeof next.beam === 'number' && Number.isFinite(next.beam)) {
        state.targetBeam = clamp01(next.beam);
      }
      if (typeof next.numberReveal === 'number' && Number.isFinite(next.numberReveal)) {
        state.targetNumberReveal = clamp01(next.numberReveal);
      }
      if (typeof next.phase === 'string') {
        state.phase = next.phase;
      }
      if (typeof next.colour === 'string') applyColour(next.colour);
      if (Array.isArray(next.palette)) setChamberPalette(next.palette);
      if (typeof next.colourIndex === 'number') setSelectedIndex(next.colourIndex);
      const nextNumber = Number.isInteger(next.number)
        ? next.number
        : Number.isInteger(next.luckyNumber)
          ? next.luckyNumber
          : null;
      if (nextNumber !== null && nextNumber !== shownNumber) {
        shownNumber = nextNumber;
        if (numberTexture) numberTexture.dispose();
        numberTexture = makeNumberTexture(THREE, nextNumber);
        numberMaterial.map = numberTexture;
        numberMaterial.needsUpdate = true;
      }

      const changed =
        state.targetWheelAngle !== previous.wheelAngle ||
        state.targetDrain !== previous.drain ||
        state.targetVesselFill !== previous.vesselFill ||
        state.targetPour !== previous.pour ||
        state.targetLeaf !== previous.leaf ||
        state.targetBeam !== previous.beam ||
        state.targetNumberReveal !== previous.numberReveal ||
        state.phase !== previous.phase ||
        state.targetColour.getHex() !== previous.colour;

      if (changed) {
        settleStart = null;
        if (idleStopped) {
          idleStopped = false;
          watchdogStopped = false;
          surface.start();
        }
      }
      // A refreshed reading mounts already complete: jump instead of replaying
      // a pour the visitor already watched.
      if (next.instant === true) {
        state.wheelAngle = state.targetWheelAngle;
        state.drain = state.targetDrain;
        state.vesselFill = state.targetVesselFill;
        state.pour = state.targetPour;
        state.leaf = state.targetLeaf;
        state.beam = state.targetBeam;
        state.numberReveal = state.targetNumberReveal;
        state.colour.copy(state.targetColour);
      }
      if (next.reducedMotion === true) {
        state.wheelAngle = state.targetWheelAngle;
        state.drain = state.targetDrain;
        state.vesselFill = state.targetVesselFill;
        state.pour = state.targetPour;
        state.leaf = state.targetLeaf;
        state.beam = state.targetBeam;
        state.numberReveal = state.targetNumberReveal;
        surface.render();
      }
    },
    start() {
      watchdogStopped = false;
      surface.start();
    },
    stop() {
      watchdogStopped = false;
      idleStopped = true;
      surface.stop();
    },
    dispose() {
      clearReadyWatch();
      failed = true;
      announced = true;
      watchdogStopped = false;
      window.removeEventListener('pointermove', wake);
      resizeObserver?.disconnect();
      resizeObserver = null;
      numberTexture?.dispose();
      numberTexture = null;
      bowlShadowTexture?.dispose();
      surface.dispose();
      materials.dispose();
      lights.dispose();
      dust.dispose();
      environment?.dispose();
      haloTexture?.dispose();
      if (faceLight) scene.remove(faceLight);
      for (const material of ownedMaterials) {
        try {
          material.dispose?.();
        } catch {
          // A material already released must not block teardown.
        }
      }
      for (const geometry of ownedGeometries) {
        try {
          geometry.dispose?.();
        } catch {
          // A geometry already released must not block teardown.
        }
      }
      ownedMaterials.clear();
      ownedGeometries.clear();
    },
    get ready() {
      return ready;
    },
  };
}

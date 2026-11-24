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
  chamberFillFactor,
} from './meter-layout.js';

const DEG2RAD = Math.PI / 180;
const CAMERA_FOV = 32;
const CAMERA_DISTANCE = 6.6;

/** The tumbler's closed cross-section, revolved by LatheGeometry. */
const VESSEL_PROFILE = Object.freeze([
  [0.0, 0.0],
  [0.241, 0.0],
  [0.286, 0.015],
  [0.308, 0.05],
  [0.312, 0.196],
  [0.314, 0.538],
  [0.312, 0.599],
  [0.297, 0.63],
  [0.276, 0.624],
  [0.27, 0.599],
  [0.269, 0.185],
  [0.265, 0.101],
  [0.241, 0.084],
  [0.0, 0.078],
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
  let stopSurface = () => {};

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
      if (!announced) armReadyWatchdog();
      onContextRestored?.();
    },
    // A frame exception stops the shared loop. Never leave a blank canvas in
    // its place: hand the meter to its complete CSS fallback.
    onError: (error) => {
      clearReadyWatch();
      failed = true;
      console.warn('Lucky Meter scene frame failed; using the CSS meter.', error);
      onUnavailable?.();
    },
  });

  if (!surface || surface.kind !== 'three' || !surface.stage) {
    surface?.dispose?.();
    onUnavailable?.();
    return null;
  }

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
  camera.position.set(0, 0, CAMERA_DISTANCE);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

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
  const chamberMaterials = [];
  const chamberStates = [];

  const chamberShape = annularSectorShape(
    THREE,
    METER_LAYOUT.wheel.chamberInnerRadius + 0.012,
    METER_LAYOUT.wheel.chamberOuterRadius - 0.012,
    -CHAMBER_DEGREES / 2 + 1.15,
    CHAMBER_DEGREES / 2 - 1.15,
  );
  const frameShape = annularSectorShape(
    THREE,
    METER_LAYOUT.wheel.chamberInnerRadius,
    METER_LAYOUT.wheel.chamberOuterRadius,
    -CHAMBER_DEGREES / 2 + 0.4,
    CHAMBER_DEGREES / 2 - 0.4,
  );

  const frameGeometry = trackGeometry(
    new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: constrained ? 10 : 20,
    }),
  );
  const fillGeometry = trackGeometry(
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

    const fillMaterial = trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xf5c451,
        metalness: 0.08,
        roughness: 0.28,
        clearcoat: 0.85,
        clearcoatRoughness: 0.16,
        emissive: 0x2a1704,
        emissiveIntensity: 0.16,
        envMapIntensity: 1.15,
      }),
    );
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    fill.position.z = 0.125;
    group.add(fill);

    chamberFills.push({ mesh: fill, material: fillMaterial });
    chamberMaterials.push(fillMaterial);
    chamberStates.push({ colourHex: null });
  }

  // ── Central decorative maple leaf ──────────────────────────────────────
  const leafGeometry = trackGeometry(
    mapleLeafGeometry(THREE, { thickness: 0.11, bevel: 0.045, dome: 0.028 }),
  );
  const centralLeafMaterial = trackMaterial(
    materials
      .gold({
        roughness: 0.24,
        metalness: 0.72,
        envMapIntensity: 1.5,
        emissive: 0x3a2408,
        emissiveIntensity: 0.32,
      })
      .clone(),
  );
  centralLeafMaterial.transparent = true;
  centralLeafMaterial.opacity = 1;
  const centralLeaf = new THREE.Mesh(leafGeometry, centralLeafMaterial);
  centralLeaf.scale.setScalar(0.54);
  centralLeaf.position.set(0, 0.01, 0.12);
  wheelGroup.add(centralLeaf);

  // The pointer is the same maple silhouette but never fades: it is a separate
  // material so the central leaf's exit cannot dim the fixed pointer.
  const pointerLeafMaterial = trackMaterial(
    materials
      .gold({
        roughness: 0.22,
        metalness: 0.72,
        envMapIntensity: 1.6,
        emissive: 0x3a2408,
        emissiveIntensity: 0.34,
        // The leaf is seen from the camera side; the extruded edge and back
        // face must light as gold too, never as a black silhouette.
        side: THREE.DoubleSide,
      })
      .clone(),
  );

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

  const pointerLeaf = new THREE.Mesh(leafGeometry, pointerLeafMaterial);
  pointerLeaf.scale.setScalar(METER_LAYOUT.pointer.leafScale);
  pointerLeaf.position.set(socketPosition[0] + 0.075, socketPosition[1] + 0.05, socketPosition[2] + 0.08);
  // The apex points up-right, inward toward the selected chamber.
  pointerLeaf.rotation.z = -45 * DEG2RAD;
  pointerLeaf.rotation.x = -0.1;
  pointerAssembly.add(pointerLeaf);

  const armCurve = new THREE.CatmullRomCurve3(
    [
      METER_LAYOUT.arm.base,
      METER_LAYOUT.arm.shoulder,
      [-1.14, -0.22, 0.05],
      socketPosition,
      [-0.79, -0.31, 0.07],
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

  // ── Receiving vessel ───────────────────────────────────────────────────
  const vesselGroup = new THREE.Group();
  vesselGroup.position.set(METER_LAYOUT.vessel.x, METER_LAYOUT.vessel.y, METER_LAYOUT.vessel.z);
  root.add(vesselGroup);

  const glassMaterial = trackMaterial(
    materials.glass(0xf6d9a6, {
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity: 0.17,
      // Transparency and clear-coat read as glass without Three's transmission
      // pass, which costs an extra render target and has proven fragile across
      // software WebGL drivers. The vessel is never transparent to the reading.
      transmission: 0,
      thickness: 0,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const vesselGeometry = trackGeometry(
    new THREE.LatheGeometry(
      VESSEL_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
      high ? 72 : constrained ? 32 : 56,
    ),
  );
  vesselGeometry.computeVertexNormals();
  const vesselGlass = new THREE.Mesh(vesselGeometry, glassMaterial);
  vesselGlass.renderOrder = 2;
  vesselGroup.add(vesselGlass);

  const vesselRimGeometry = trackGeometry(new THREE.TorusGeometry(0.299, 0.014, 8, high ? 72 : 40));
  const vesselRim = new THREE.Mesh(vesselRimGeometry, gold);
  vesselRim.rotation.x = Math.PI / 2;
  vesselRim.position.y = 0.617;
  vesselGroup.add(vesselRim);

  const vesselFootGeometry = trackGeometry(new THREE.TorusGeometry(0.26, 0.008, 8, high ? 64 : 36));
  const vesselFoot = new THREE.Mesh(vesselFootGeometry, gold);
  vesselFoot.rotation.x = Math.PI / 2;
  vesselFoot.position.y = 0.018;
  vesselGroup.add(vesselFoot);

  const liquidMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: 0xa65e3b,
      metalness: 0,
      roughness: 0.11,
      transmission: 0,
      thickness: 0.45,
      ior: 1.34,
      transparent: true,
      opacity: 0.92,
      emissive: 0x2a0f04,
      emissiveIntensity: 0.4,
      envMapIntensity: 1.25,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide,
    }),
  );
  const liquidGeometry = trackGeometry(
    new THREE.CylinderGeometry(
      METER_LAYOUT.vessel.liquidRadius,
      METER_LAYOUT.vessel.liquidRadius * 0.97,
      METER_LAYOUT.vessel.liquidDepth,
      high ? 64 : constrained ? 28 : 44,
      1,
      false,
    ),
  );
  liquidGeometry.translate(0, METER_LAYOUT.vessel.liquidDepth / 2, 0);
  const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquid.position.y = 0.078;
  liquid.scale.y = 0.0001;
  liquid.renderOrder = 1;
  vesselGroup.add(liquid);

  const liquidSurfaceMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xc07048,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const liquidSurfaceGeometry = trackGeometry(
    new THREE.CircleGeometry(METER_LAYOUT.vessel.liquidRadius, high ? 56 : 30),
  );
  const liquidSurface = new THREE.Mesh(liquidSurfaceGeometry, liquidSurfaceMaterial);
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = 0.082;
  liquidSurface.renderOrder = 3;
  vesselGroup.add(liquidSurface);

  const meniscusGeometry = trackGeometry(new THREE.TorusGeometry(0.263, 0.007, 6, high ? 56 : 30));
  const meniscus = new THREE.Mesh(meniscusGeometry, liquidSurfaceMaterial);
  meniscus.rotation.x = Math.PI / 2;
  meniscus.renderOrder = 4;
  vesselGroup.add(meniscus);

  const liquidLight = new THREE.PointLight(0xa65e3b, 0.7, 2.2, 2);
  liquidLight.position.set(0, 0.3, 0.2);
  vesselGroup.add(liquidLight);

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
      [-0.54, -0.62, 0.28],
      [-0.26, -0.24, 0.34],
      [0, 0.2, 0.4],
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

  // ── Contact shadows and ambient dust ───────────────────────────────────
  const shadowTexture = radialTexture(THREE, [
    [0, 'rgba(0, 0, 0, 0.62)'],
    [0.44, 'rgba(0, 0, 0, 0.28)'],
    [1, 'rgba(0, 0, 0, 0)'],
  ]);
  let vesselShadow = null;
  if (shadowTexture) {
    vesselShadow = new THREE.Mesh(
      trackGeometry(new THREE.PlaneGeometry(1.25, 1.25)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.7,
        }),
      ),
    );
    vesselShadow.position.set(METER_LAYOUT.vessel.x, -1.56, 0.0);
    root.add(vesselShadow);
  }

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
      if (!colour || chamberStates[index].colourHex === colour.hex) continue;
      chamberStates[index].colourHex = colour.hex;
      const fillMaterial = chamberMaterials[index];
      fillMaterial.color.set(colour.hex);
      fillMaterial.emissive.set(colour.hex);
      fillMaterial.emissiveIntensity = 0.14;
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

    // The central leaf is a still, floating ornament in READY. On Start it
    // deliberately rotates back, recedes and fades until the well is clear.
    const leaf = clamp01(state.leaf);
    const float = state.phase === 'idle' ? Math.sin(secs * 1.15) * 0.045 : 0;
    centralLeaf.rotation.y = leaf * 1.35 + float * 0.6;
    centralLeaf.rotation.z = Math.sin(secs * 0.7) * 0.03 * (1 - leaf);
    centralLeaf.position.z = 0.12 - leaf * 0.42;
    centralLeaf.position.y = 0.01 + float - leaf * 0.05;
    const leafScale = 0.54 * (1 - leaf * 0.62);
    centralLeaf.scale.setScalar(Math.max(0.001, leafScale));
    centralLeafMaterial.opacity = 1 - leaf;
    centralLeaf.visible = leaf < 0.995;

    // Every chamber is full except the selected one. The selected chamber
    // recedes radially toward its inner opening as the pour runs.
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const fill = chamberFills[index];
      const factor = chamberFillFactor(index, selectedIndex, state.drain);
      // The chamber geometry is centred on the wheel, so scaling the fill mesh
      // drains only the selected chamber toward the well. No custom shader, no
      // extra program variant, and no transmission-pass uniforms to reconcile.
      fill.mesh.scale.setScalar(Math.max(0.001, factor));
      fill.mesh.visible = factor > 0.004;
      const selected = index === selectedIndex;
      fill.material.emissiveIntensity = selected
        ? 0.2 + state.beam * 0.18
        : state.phase === 'idle'
          ? 0.09
          : 0.16;
    }

    // The receiving vessel fills and stays full. Only the selected chamber
    // empties; the vessel is the destination, not a second drain.
    const vesselFill = clamp01(state.vesselFill);
    const liquidHeight = Math.max(0.0001, vesselFill * METER_LAYOUT.vessel.liquidDepth);
    liquid.scale.y = liquidHeight / METER_LAYOUT.vessel.liquidDepth;
    liquid.visible = vesselFill > 0.002;
    liquidMaterial.color.copy(state.colour);
    liquidMaterial.emissive.copy(state.colour).multiplyScalar(0.24);
    liquidMaterial.emissiveIntensity = 0.35 + vesselFill * 0.2;
    liquidSurface.position.y = 0.078 + liquidHeight + 0.004;
    liquidSurface.scale.setScalar(Math.max(0.001, 0.4 + vesselFill * 0.6));
    liquidSurfaceMaterial.color.copy(state.colour).offsetHSL(0, -0.08, 0.2);
    liquidSurfaceMaterial.opacity = vesselFill > 0.01 ? 0.32 + Math.sin(secs * 3.2) * 0.06 : 0;
    meniscus.position.y = 0.078 + liquidHeight + 0.006;
    meniscus.scale.setScalar(Math.max(0.001, 0.4 + vesselFill * 0.6));
    meniscus.visible = vesselFill > 0.01;
    liquidLight.color.copy(state.colour);
    liquidLight.intensity = 0.15 + vesselFill * 0.75;
    liquidLight.position.y = 0.078 + liquidHeight * 0.7;

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
      const impactY = 0.078 + liquidHeight - 1.2 + 0.02;
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
      surface.start();
    },
    stop() {
      idleStopped = true;
      surface.stop();
    },
    dispose() {
      clearReadyWatch();
      failed = true;
      announced = true;
      window.removeEventListener('pointermove', wake);
      surface.dispose();
      materials.dispose();
      lights.dispose();
      dust.dispose();
      environment?.dispose();
      haloTexture?.dispose();
      shadowTexture?.dispose();
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

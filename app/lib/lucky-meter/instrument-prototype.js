/**
 * Spec 218 design prototype: the Lucky Meter instrument on a phone stage.
 *
 * This module is deliberately development-only. It mounts through the Creative
 * Workbench so the geometry, materials, light rig and camera are exercised
 * through the production graphics entry points without changing the visitor
 * route or destabilising `meter-scene.js`.
 *
 * The prototype validates:
 *   - the gold twelve-chamber wheel and fixed 7:30 maple pointer/spout;
 *   - a real medallion flip that reveals the percentage well;
 *   - a horizontal drain of only the selected chamber;
 *   - a wide, faceted crystal bowl that fills with the selected seasonal colour.
 *
 * It uses the real autumn palette and the real colour-pointer maths. The 78%
 * reading and 27 number are illustrative; the prototype never generates or
 * stores a result.
 *
 * Time map (seconds):
 *   0.00        READY: medallion closed, all chambers full, bowl empty.
 *   0.00–1.25   medallion turns over and settles at the top of the well.
 *   1.25–2.00   percentage hold.
 *   2.00–4.00   selected chamber drains, bowl fills, number emerges.
 *   4.00–6.00   FINISHED hold.
 */

import { buildMapleLeafGeometry } from '../gpu-geometry.js';
import { createLightRig } from '../graphics/lighting.js';
import { createMaterialLibrary } from '../graphics/materials.js';
import { createParticleField } from '../graphics/particles.js';
import {
  CHAMBER_COUNT,
  CHAMBER_DEGREES,
  METER_LAYOUT,
  POINTER_ANGLE_DEGREES,
  instrumentFraming,
  polarPosition,
} from './meter-layout.js';
import { colourPointerRotation } from './reveal.js';
import { getPaletteForSeasonKey } from './sparks-and-seasonal-colours.js';

const DEG2RAD = Math.PI / 180;
const CAMERA_FOV = 32;

// The responsive framing is shared with the production scene so the prototype
// and the visitor experience cannot drift apart.
export { instrumentFraming } from './meter-layout.js';

/** The prototype bowl sits directly beneath the fixed spout. */
const BOWL_POSITION = Object.freeze({ x: -0.78, y: -1.28, z: 0.05 });
const BOWL_RADIUS = 0.62;
const BOWL_HEIGHT = 0.36;
const BOWL_LIQUID_HEIGHT = 0.27;
const BOWL_LIQUID_FLOOR = 0.075;

const ILLUSTRATIVE_PERCENTAGE = 78;
const ILLUSTRATIVE_NUMBER = 27;

/** Autumn contains Deep Teal, the reference's selected colour. */
const PROTOTYPE_PALETTE = getPaletteForSeasonKey('autumn');

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(value) {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Screen angle (0° = 12 o'clock, clockwise) to a Three.js math angle. */
function toMathAngle(screenDegrees) {
  return (90 - screenDegrees) * DEG2RAD;
}

function annularSectorShape(THREE, innerRadius, outerRadius, startDegrees, endDegrees) {
  const start = toMathAngle(startDegrees);
  const end = toMathAngle(endDegrees);
  const shape = new THREE.Shape();
  shape.moveTo(Math.cos(start) * outerRadius, Math.sin(start) * outerRadius);
  shape.absarc(0, 0, outerRadius, start, end, true);
  shape.lineTo(Math.cos(end) * innerRadius, Math.sin(end) * innerRadius);
  shape.absarc(0, 0, innerRadius, end, start, false);
  shape.closePath();
  return shape;
}

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
 * The same tiny procedurally lit room the production meter uses. A metal
 * material without an environment reads black; this costs one short PMREM
 * frame and no network request.
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
    // A large warm panel in front of the object is what keeps the gold face
    // from reflecting only the dark room. The cool panel gives the crystal
    // bowl its hard, bright facet highlights.
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

function mapleLeafGeometry(THREE, options) {
  const mesh = buildMapleLeafGeometry(options);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A broader, shorter-stemmed maple blade for the fixed pointer. The shared
 * medallion silhouette has long horizontal lobe spikes that read as a star at
 * 390 px; this outline keeps the lobes as wedges and gives the stem enough
 * length to meet the socket without crossing the chamber.
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

function makePercentageTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, 640, 640);
  const glow = context.createRadialGradient(320, 320, 12, 320, 320, 300);
  glow.addColorStop(0, 'rgba(255, 202, 112, 0.13)');
  glow.addColorStop(0.55, 'rgba(255, 170, 60, 0.04)');
  glow.addColorStop(1, 'rgba(255, 150, 40, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 640, 640);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f7e7c4';
  context.shadowColor = 'rgba(255, 188, 82, 0.65)';
  context.shadowBlur = 26;
  context.font = '600 300px Georgia, "Times New Roman", serif';
  context.fillText(`${ILLUSTRATIVE_PERCENTAGE}%`, 320, 275);

  context.shadowBlur = 0;
  context.strokeStyle = 'rgba(232, 190, 112, 0.55)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(220, 374);
  context.lineTo(420, 374);
  context.stroke();

  context.fillStyle = '#e8ca8e';
  context.font = '600 48px "Helvetica Neue", Arial, sans-serif';
  drawSpacedText(context, 'HIGH RESONANCE', 320, 436, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeNumberTexture(THREE) {
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
  context.strokeText(String(ILLUSTRATIVE_NUMBER), 160, 168);
  context.fillStyle = '#fff0ce';
  context.shadowColor = 'rgba(255, 190, 82, 0.75)';
  context.shadowBlur = 16;
  context.fillText(String(ILLUSTRATIVE_NUMBER), 160, 168);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A coloured enamel fill that can be cut at a horizontal wheel-space level.
 * The chamber geometry is rotated into place, so `position.y` is the wheel's
 * vertical axis. Discarding above the level drains only that chamber and
 * leaves the gold frame untouched.
 */
function createFillMaterial(THREE, colour) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colour.hex) },
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

/**
 * Builds the prototype on an already-created Creative Workbench surface.
 *
 * @param {{ surface: object, seed?: number }} options
 * @returns {null | { update: (frame?: { delta?: number }) => void, setTime: (seconds: number) => void, dispose: () => void }}
 */
export function buildInstrumentPrototype({ surface, seed = 218 } = {}) {
  const stage = surface?.stage;
  const THREE = stage?.three;
  if (!THREE || !stage.scene || !stage.camera) return null;
  if (typeof document === 'undefined') return null;

  const scene = stage.scene;
  const camera = stage.camera;
  const renderer = stage.renderer;
  const quality = stage.quality ?? { tier: 'balanced' };
  const constrained = quality.tier === 'constrained';
  const high = quality.tier === 'high';

  const materials = createMaterialLibrary(THREE, { quality });
  const rig = createLightRig(THREE, { quality, budget: stage.budget });
  rig.addTo(scene);

  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  const trackGeometry = (geometry) => {
    ownedGeometries.add(geometry);
    return geometry;
  };
  const trackMaterial = (material) => {
    ownedMaterials.add(material);
    return material;
  };
  const trackTexture = (texture) => {
    if (texture) ownedTextures.add(texture);
    return texture;
  };

  const viewportWidth = Number(stage.size?.width) || 390;
  const viewportHeight = Number(stage.size?.height) || 844;
  const framing = instrumentFraming(viewportWidth, viewportHeight);
  camera.fov = CAMERA_FOV;
  camera.near = 0.1;
  camera.far = 60;
  camera.position.set(0, framing.lookY, framing.distance);
  camera.lookAt(0, framing.lookY, 0);
  camera.updateProjectionMatrix();

  if (renderer) renderer.toneMappingExposure = 1.15;

  scene.background = new THREE.Color(0x050812);

  const environment = createEnvironment(THREE, renderer);
  if (environment) {
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.15;
  }

  const root = new THREE.Group();
  scene.add(root);

  const gold = materials.gold({
    color: 0xf7c85c,
    roughness: 0.23,
    metalness: 1,
    envMapIntensity: 1.65,
    emissive: 0x2a1606,
    emissiveIntensity: 0.06,
  });

  const faceLight = constrained
    ? null
    : new THREE.PointLight(0xffe6b8, high ? 1.7 : 1.5, 12, 2);
  if (faceLight) {
    faceLight.position.set(0.8, 1.2, 5.0);
    scene.add(faceLight);
  }

  const frontLight = constrained
    ? null
    : new THREE.PointLight(0xfff1d2, 0.55, 10, 2);
  if (frontLight) {
    frontLight.position.set(-1.0, 0.4, 4.6);
    scene.add(frontLight);
  }

  // ── Backdrop: a cool nebula, a warm halo, a teal pool and particles ─────
  const skyTexture = trackTexture(
    radialTexture(THREE, [
      [0, 'rgba(46, 62, 116, 0.34)'],
      [0.5, 'rgba(24, 32, 66, 0.18)'],
      [1, 'rgba(5, 8, 18, 0)'],
    ]),
  );
  if (skyTexture) {
    const sky = new THREE.Mesh(
      trackGeometry(new THREE.PlaneGeometry(8.4, 11.4)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          map: skyTexture,
          transparent: true,
          depthWrite: false,
          opacity: 0.9,
        }),
      ),
    );
    sky.position.set(0, 0, -3.0);
    scene.add(sky);
  }

  const haloTexture = trackTexture(
    radialTexture(THREE, [
      [0, 'rgba(255, 214, 138, 0.42)'],
      [0.44, 'rgba(255, 172, 68, 0.12)'],
      [1, 'rgba(255, 150, 50, 0)'],
    ]),
  );
  if (haloTexture) {
    const halo = new THREE.Mesh(
      trackGeometry(new THREE.PlaneGeometry(4.6, 4.6)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          map: haloTexture,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.52,
        }),
      ),
    );
    halo.position.set(0, METER_LAYOUT.wheel.y + 0.02, -0.55);
    root.add(halo);
  }

  const bowlGlowTexture = trackTexture(
    radialTexture(THREE, [
      [0, 'rgba(78, 190, 190, 0.3)'],
      [0.55, 'rgba(42, 130, 140, 0.08)'],
      [1, 'rgba(20, 70, 90, 0)'],
    ]),
  );
  if (bowlGlowTexture) {
    const bowlGlow = new THREE.Mesh(
      trackGeometry(new THREE.PlaneGeometry(1.8, 1.8)),
      trackMaterial(
        new THREE.MeshBasicMaterial({
          map: bowlGlowTexture,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0.38,
        }),
      ),
    );
    bowlGlow.position.set(BOWL_POSITION.x, BOWL_POSITION.y + 0.06, -0.35);
    root.add(bowlGlow);
  }

  const stars = createParticleField(THREE, {
    count: 150,
    quality,
    color: 0xbfd8ff,
    size: 0.018,
    spread: { x: 4.4, y: 7.2, z: 2.2 },
    drift: 0.08,
    seed,
  });
  if (stars.points) {
    stars.points.position.set(0, -0.1, -2.2);
    scene.add(stars.points);
  }

  const motes = createParticleField(THREE, {
    count: 80,
    quality,
    color: 0xffd479,
    size: 0.02,
    spread: { x: 3.2, y: 3.4, z: 1.6 },
    drift: 0.12,
    seed: seed + 7,
  });
  if (motes.points) {
    motes.points.position.set(0, 0.4, 0.2);
    root.add(motes.points);
  }

  // ── Wheel ──────────────────────────────────────────────────────────────
  const wheelGroup = new THREE.Group();
  wheelGroup.name = 'prototype-wheel';
  wheelGroup.position.set(METER_LAYOUT.wheel.x, METER_LAYOUT.wheel.y, METER_LAYOUT.wheel.z);
  root.add(wheelGroup);

  const bodyGeometry = trackGeometry(
    new THREE.CylinderGeometry(
      METER_LAYOUT.wheel.outerRadius + 0.01,
      METER_LAYOUT.wheel.outerRadius + 0.01,
      0.26,
      high ? 96 : constrained ? 40 : 64,
    ),
  );
  bodyGeometry.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeometry, gold);
  body.position.z = -0.14;
  wheelGroup.add(body);

  // A thick outer band and a second edge give the wheel a struck-metal body,
  // not a flat ring with a painted face.
  const outerBand = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(1.04, 0.06, 16, high ? 96 : 64)),
    gold,
  );
  outerBand.position.z = 0.02;
  wheelGroup.add(outerBand);

  const outerEdge = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(1.075, 0.018, 10, high ? 96 : 64)),
    gold,
  );
  outerEdge.position.z = 0.04;
  wheelGroup.add(outerEdge);

  const innerRim = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.53, 0.04, 12, high ? 80 : 48)),
    gold,
  );
  innerRim.position.z = 0.055;
  wheelGroup.add(innerRim);

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
  const wellGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.505, 0.505, 0.03, high ? 80 : 48),
  );
  wellGeometry.rotateX(Math.PI / 2);
  const well = new THREE.Mesh(wellGeometry, wellMaterial);
  well.position.z = 0.035;
  wheelGroup.add(well);

  // ── Twelve chambers ────────────────────────────────────────────────────
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
  // The hole is slightly smaller than the fill, which tucks the enamel under the
  // frame lip instead of leaving a visible gap.
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
    const frameGroup = new THREE.Group();
    frameGroup.rotation.z = -index * CHAMBER_DEGREES * DEG2RAD;
    wheelGroup.add(frameGroup);

    const frame = new THREE.Mesh(frameGeometry, gold);
    frame.position.z = 0.06;
    frameGroup.add(frame);

    // A gold floor behind the enamel is what the empty chamber shows after the
    // pour. Without it the recessed hole falls into the dark body and the
    // emerging number has no readable ground.
    const floorGeometry = trackGeometry(
      new THREE.ShapeGeometry(chamberShape, constrained ? 10 : 20),
    );
    floorGeometry.rotateZ(-index * CHAMBER_DEGREES * DEG2RAD);
    const floor = new THREE.Mesh(floorGeometry, gold);
    floor.position.z = 0.045;
    wheelGroup.add(floor);

    const colour = PROTOTYPE_PALETTE[index] ?? PROTOTYPE_PALETTE[0];
    const fillGeometry = trackGeometry(fillBaseGeometry.clone());
    fillGeometry.rotateZ(-index * CHAMBER_DEGREES * DEG2RAD);
    fillGeometry.computeBoundingBox();
    const bounds = fillGeometry.boundingBox;
    const fillMaterial = trackMaterial(createFillMaterial(THREE, colour));
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    // Recessed behind the gold frame lip, so the chambers read as inlaid
    // enamel wells rather than coloured stickers on a flat plate.
    fill.position.z = 0.07;
    fill.renderOrder = 1;
    wheelGroup.add(fill);

    chamberFills.push({
      material: fillMaterial,
      minY: bounds?.min.y ?? -1,
      maxY: bounds?.max.y ?? 1,
      mesh: fill,
      colour,
    });
  }

  const selectedIndex = Math.max(
    0,
    PROTOTYPE_PALETTE.findIndex((colour) => colour.id === 'deep-teal'),
  );
  const selectedColour = PROTOTYPE_PALETTE[selectedIndex] ?? PROTOTYPE_PALETTE[0];
  const wheelAngle = colourPointerRotation(selectedColour.id, PROTOTYPE_PALETTE);
  wheelGroup.rotation.z = -wheelAngle * DEG2RAD;

  // The wheel turns to put the selected chamber under the pointer. The well and
  // its reading belong to the visitor, not the mechanism: counter-rotate their
  // own group so the percentage and maple medallion stay upright.
  const centreGroup = new THREE.Group();
  centreGroup.rotation.z = -wheelGroup.rotation.z;
  wheelGroup.add(centreGroup);

  // ── Percentage well and the flipping medallion ─────────────────────────
  const percentageTexture = trackTexture(makePercentageTexture(THREE));
  const percentageMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: percentageTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  const percentage = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(0.82, 0.82)),
    percentageMaterial,
  );
  percentage.name = 'prototype-percentage';
  percentage.position.set(0, -0.01, 0.085);
  percentage.visible = false;
  centreGroup.add(percentage);

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
  medallion.name = 'prototype-medallion';
  medallion.scale.setScalar(0.56);
  medallion.position.set(0, 0.01, 0.16);
  centreGroup.add(medallion);

  // Raised veins turn the stamped silhouette into a readable maple relief. A
  // single unit cylinder is shared; each vein is scaled to its lobe and the
  // whole set inherits the medallion's flip and settle.
  const veinMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffe2a2,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const veinGeometry = trackGeometry(new THREE.CylinderGeometry(0.0085, 0.0085, 1, 4));
  const veinTips = [
    [0, 0.78],
    [0.52, 0.48],
    [0.66, 0.02],
    [-0.66, 0.02],
    [-0.52, 0.48],
    [0, -0.82],
  ];
  for (const [x, y] of veinTips) {
    const length = Math.hypot(x, y);
    for (const side of [0.102, -0.102]) {
      const vein = new THREE.Mesh(veinGeometry, veinMaterial);
      vein.position.set(x / 2, y / 2, side);
      vein.rotation.z = -Math.atan2(x, y);
      vein.scale.set(1, Math.max(0.001, length), 1);
      medallion.add(vein);
    }
  }

  // ── Fixed 7:30 pointer, curved arm and spout ──────────────────────────
  const pointerGroup = new THREE.Group();
  root.add(pointerGroup);

  const socket = new THREE.Mesh(
    trackGeometry(new THREE.CylinderGeometry(0.095, 0.11, 0.11, high ? 40 : 24)),
    gold,
  );
  socket.geometry.rotateX(Math.PI / 2);
  socket.position.set(-0.95, -0.35, 0.08);
  pointerGroup.add(socket);

  const socketRing = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.1, 0.016, 8, 36)),
    gold,
  );
  socketRing.position.set(-0.95, -0.35, 0.145);
  pointerGroup.add(socketRing);

  const pointerMaterial = trackMaterial(
    materials
      .gold({
        roughness: 0.21,
        metalness: 0.74,
        envMapIntensity: 1.7,
        emissive: 0x3a2408,
        emissiveIntensity: 0.36,
        side: THREE.DoubleSide,
      })
      .clone(),
  );
  const pointerLeafGeometry = trackGeometry(buildPointerLeafGeometry(THREE));

  const pointerLeafGroup = new THREE.Group();
  pointerLeafGroup.scale.setScalar(METER_LAYOUT.pointer.leafScale * 1.1);
  pointerLeafGroup.position.set(-0.92, -0.30, 0.18);
  pointerLeafGroup.rotation.z = -45 * DEG2RAD;
  pointerLeafGroup.rotation.x = -0.1;
  pointerGroup.add(pointerLeafGroup);

  // A dark, slightly larger silhouette separates the gold leaf from the gold
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

  const pointerLeaf = new THREE.Mesh(pointerLeafGeometry, pointerMaterial);
  pointerLeafGroup.add(pointerLeaf);

  // Engraved veins are the strongest maple signal at 390 px: the silhouette is
  // small, but the midrib and four lobes read immediately.
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
      [-1.28, -0.46, 0.01],
      [-1.15, -0.34, 0.04],
      [-1.04, -0.31, 0.07],
      [-0.95, -0.35, 0.08],
      [-0.86, -0.42, 0.07],
      [-0.78, -0.62, 0.05],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.4,
  );
  const arm = new THREE.Mesh(
    trackGeometry(
      new THREE.TubeGeometry(armCurve, high ? 96 : 56, METER_LAYOUT.arm.tubeRadius, 10, false),
    ),
    gold,
  );
  pointerGroup.add(arm);

  const spoutLip = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.05, 0.012, 8, 28)),
    gold,
  );
  spoutLip.position.set(-0.78, -0.62, 0.05);
  spoutLip.rotation.x = Math.PI / 2.4;
  pointerGroup.add(spoutLip);

  // ── Faceted crystal bowl ───────────────────────────────────────────────
  const bowlGroup = new THREE.Group();
  bowlGroup.position.set(BOWL_POSITION.x, BOWL_POSITION.y, BOWL_POSITION.z);
  root.add(bowlGroup);

  // A single open shell, not a thick double wall: the liquid stays visible and
  // the twelve radial segments read as cut crystal instead of frosted glass.
  const bowlProfile = [
    [0.0, 0.0],
    [0.2, 0.0],
    [0.23, 0.015],
    [0.24, 0.035],
    [0.26, 0.05],
    [0.38, 0.1],
    [0.51, 0.18],
    [0.59, 0.28],
    [BOWL_RADIUS, BOWL_HEIGHT],
  ];
  const bowlGlassMaterial = trackMaterial(createCrystalMaterial(THREE));
  const bowlGlassSource = trackGeometry(
    new THREE.LatheGeometry(
      bowlProfile.map(([x, y]) => new THREE.Vector2(x, y)),
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

  // A crisp glass rim and foot ring catch the light even when the body is
  // almost transparent; together with the facet edges they define the crystal.
  const bowlGlassRim = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(BOWL_RADIUS - 0.008, 0.006, 6, high ? 72 : 40)),
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
  bowlGlassRim.position.y = BOWL_HEIGHT - 0.004;
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
    trackGeometry(new THREE.TorusGeometry(BOWL_RADIUS, 0.02, 8, high ? 72 : 40)),
    gold,
  );
  bowlRim.rotation.x = Math.PI / 2;
  bowlRim.position.y = BOWL_HEIGHT;
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

  const liquidColour = new THREE.Color(selectedColour.hex).offsetHSL(0, 0.04, 0.13);
  const liquidMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: liquidColour,
      metalness: 0,
      roughness: 0.06,
      transmission: 0,
      thickness: 0.3,
      ior: 1.34,
      transparent: true,
      opacity: 0.96,
      emissive: liquidColour.clone().multiplyScalar(0.22),
      emissiveIntensity: 0.58,
      envMapIntensity: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      side: THREE.DoubleSide,
      flatShading: true,
    }),
  );
  const liquidGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.54, 0.5, BOWL_LIQUID_HEIGHT, 12, 1, false),
  );
  liquidGeometry.translate(0, BOWL_LIQUID_HEIGHT / 2, 0);
  const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquid.position.y = BOWL_LIQUID_FLOOR;
  liquid.scale.y = 0.001;
  liquid.renderOrder = 1;
  bowlGroup.add(liquid);

  const liquidSurfaceMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: liquidColour.clone().offsetHSL(0, -0.02, 0.24),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const liquidSurface = new THREE.Mesh(
    trackGeometry(new THREE.CircleGeometry(0.53, 12)),
    liquidSurfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = BOWL_LIQUID_FLOOR + 0.004;
  liquidSurface.renderOrder = 3;
  bowlGroup.add(liquidSurface);

  const meniscusMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: liquidColour.clone().offsetHSL(0, -0.03, 0.24),
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
  meniscus.position.y = BOWL_LIQUID_FLOOR + 0.006;
  meniscus.renderOrder = 4;
  bowlGroup.add(meniscus);

  const liquidLight = new THREE.PointLight(selectedColour.hex, 0.2, 2.4, 2);
  liquidLight.position.set(0, BOWL_LIQUID_FLOOR + 0.12, 0.16);
  bowlGroup.add(liquidLight);

  const bowlRimLight = constrained ? null : new THREE.PointLight(0xbfe8ff, 0.6, 2.2, 2);
  if (bowlRimLight) {
    bowlRimLight.position.set(-0.2, BOWL_HEIGHT - 0.02, 0.35);
    bowlGroup.add(bowlRimLight);
  }

  const bowlShadowTexture = trackTexture(
    radialTexture(THREE, [
      [0, 'rgba(0, 0, 0, 0.55)'],
      [0.5, 'rgba(0, 0, 0, 0.22)'],
      [1, 'rgba(0, 0, 0, 0)'],
    ]),
  );
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
    bowlShadow.position.set(BOWL_POSITION.x, BOWL_POSITION.y - 0.16, 0.0);
    root.add(bowlShadow);
  }

  // ── Number inside the selected chamber ─────────────────────────────────
  const numberTexture = trackTexture(makeNumberTexture(THREE));
  const numberCentre = polarPosition(
    POINTER_ANGLE_DEGREES,
    (METER_LAYOUT.wheel.chamberInnerRadius + METER_LAYOUT.wheel.chamberOuterRadius) / 2,
    { x: 0, y: METER_LAYOUT.wheel.y },
  );
  // A world-space horizontal clip reveals the number from the top down as the
  // chamber drains. MeshBasicMaterial keeps the cream/gold texture crisp; the
  // custom shader path was washing the digits out on the software renderer.
  const numberClip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(numberCentre.y + 0.18));
  const numberMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: numberTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      clippingPlanes: [numberClip],
    }),
  );
  if (renderer) renderer.localClippingEnabled = true;
  const number = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(0.36, 0.36)),
    numberMaterial,
  );
  number.position.set(numberCentre.x, numberCentre.y, 0.18);
  number.visible = false;
  root.add(number);

  // ── State ──────────────────────────────────────────────────────────────
  let elapsed = 0;
  let disposed = false;

  function applyFrame(time) {
    const seconds = Math.max(0, Number.isFinite(time) ? time : 0);

    const flip = easeInOutCubic(clamp01(seconds / 1.25));
    const settle = smoothstep(0.15, 1, flip);
    medallion.rotation.y = flip * Math.PI;
    medallion.rotation.z = Math.sin(flip * Math.PI * 2) * 0.035 * (1 - flip);
    medallion.position.y = 0.01 + settle * 0.37;
    medallion.position.z = 0.16 + settle * 0.01;
    medallion.scale.setScalar(0.56 * (1 - settle * 0.55));

    const percentageOpacity = smoothstep(0.55, 0.98, flip);
    percentageMaterial.opacity = percentageOpacity;
    percentage.visible = percentageOpacity > 0.01;
    percentage.scale.setScalar(0.94 + percentageOpacity * 0.06);

    const drain = smoothstep(2.0, 4.0, seconds);
    const fill = smoothstep(2.15, 4.0, seconds);
    const reveal = smoothstep(2.15, 3.9, seconds);

    for (let index = 0; index < chamberFills.length; index += 1) {
      const chamber = chamberFills[index];
      if (index !== selectedIndex) {
        chamber.material.uniforms.uLevel.value = 10;
        continue;
      }
      const span = chamber.maxY - chamber.minY + 0.04;
      chamber.material.uniforms.uLevel.value = chamber.maxY + 0.02 - drain * span;
    }

    liquid.scale.y = Math.max(0.001, fill);
    liquid.visible = fill > 0.004;
    liquidSurface.position.y = BOWL_LIQUID_FLOOR + BOWL_LIQUID_HEIGHT * fill + 0.004;
    liquidSurface.scale.setScalar(0.78 + fill * 0.22);
    liquidSurfaceMaterial.opacity = fill > 0.02 ? 0.52 : 0;
    meniscus.position.y = BOWL_LIQUID_FLOOR + BOWL_LIQUID_HEIGHT * fill + 0.008;
    meniscus.scale.setScalar(0.78 + fill * 0.22);
    meniscusMaterial.opacity = fill > 0.02 ? 0.62 : 0;
    liquidLight.intensity = 0.12 + fill * 1.0;
    liquidLight.position.y = BOWL_LIQUID_FLOOR + BOWL_LIQUID_HEIGHT * fill * 0.65;

    const numberTop = numberCentre.y + 0.18;
    const numberBottom = numberCentre.y - 0.18;
    numberClip.constant = -(numberTop - reveal * (numberTop - numberBottom));
    number.visible = reveal > 0.01;

    if (faceLight) faceLight.intensity = (high ? 1.7 : 1.5) + Math.sin(seconds * 0.9) * 0.05;
    stars.update(0.0001, seconds);
    motes.update(0.0001, seconds);
    rig.update(0);
  }

  applyFrame(0);

  return {
    update({ delta = 0 } = {}) {
      if (disposed) return;
      elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
      applyFrame(elapsed);
      stars.update(Math.max(0.0001, delta), elapsed);
      motes.update(Math.max(0.0001, delta), elapsed);
    },
    setTime(seconds) {
      if (disposed) return;
      elapsed = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
      applyFrame(elapsed);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(root);
      if (faceLight) scene.remove(faceLight);
      if (frontLight) scene.remove(frontLight);
      if (stars.points) scene.remove(stars.points);
      stars.dispose();
      motes.dispose();
      rig.dispose();
      materials.dispose();
      environment?.dispose();
      if (scene.environment === environment?.texture) scene.environment = null;
      for (const texture of ownedTextures) {
        try {
          texture.dispose?.();
        } catch {
          // A texture already released must not block teardown.
        }
      }
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
      ownedTextures.clear();
      ownedMaterials.clear();
      ownedGeometries.clear();
    },
  };
}

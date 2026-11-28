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
  CHAMBER_CUP,
  CHAMBER_DEGREES,
  METER_LAYOUT,
  POINTER_ANGLE_DEGREES,
  chamberCentre,
  numberTransferPath,
  sampleNumberPath,
  stageFraming,
} from './meter-layout.js';

const DEG2RAD = Math.PI / 180;
const CAMERA_FOV = 32;

/**
 * The crystal bowl's open cross-section: a deep, flared cup rather than a
 * shallow dish, so a full bowl reads as a filled vessel with a real liquid
 * column.
 */
const BOWL_PROFILE = Object.freeze([
  [0.0, 0.0],
  [0.13, 0.0],
  [0.16, 0.025],
  [0.19, 0.05],
  [0.33, 0.13],
  [0.45, 0.24],
  [0.53, 0.35],
  [0.57, 0.41],
  [METER_LAYOUT.vessel.radius, METER_LAYOUT.vessel.height],
]);

/**
 * The bowl's inner wall radius at a local height. The profile is piecewise
 * linear, so interpolating it keeps the liquid exactly inside the glass shell
 * at every level instead of ballooning past the flare near the foot.
 */
function bowlInnerRadiusAt(y) {
  const height = METER_LAYOUT.vessel.height;
  const level = Math.max(0, Math.min(height, Number(y) || 0));
  for (let index = 1; index < BOWL_PROFILE.length; index += 1) {
    const [x1, y1] = BOWL_PROFILE[index];
    const [x0, y0] = BOWL_PROFILE[index - 1];
    if (level <= y1) {
      const span = y1 - y0 || 1;
      const t = Math.max(0, Math.min(1, (level - y0) / span));
      return x0 + (x1 - x0) * t;
    }
  }
  return METER_LAYOUT.vessel.radius;
}

/** The liquid's own band inside the bowl, shared by the body and its surface. */
const BOWL_LIQUID_BASE = METER_LAYOUT.vessel.liquidFloor;
const BOWL_LIQUID_TOP = METER_LAYOUT.vessel.liquidTop;
const BOWL_LIQUID_INSET = METER_LAYOUT.vessel.liquidInset;

/** The moment the idle scene stops rendering; a state change wakes it. */
const IDLE_STOP_SECONDS = 4;
const FINISHED_STOP_SECONDS = 1.25;

/** The longest wait for a produced frame before the complete CSS meter wins. */
export const READY_WATCHDOG_MS = 3000;

/**
 * The resting size of the central maple relief. It leaves room for the laurel
 * wreath and the turned rings that frame it inside the well.
 */
const MEDALLION_SCALE = 0.455;

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

/** A rounded rectangle as a THREE.Shape, used by the plaque and the token. */
function roundedRectShape(THREE, width, height, radius) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);
  return shape;
}

/**
 * One compartment's wedge: two radial edges and two arcs with rounded corners,
 * which is the cell shape the reference uses around its wheel. Angles follow
 * screen convention (0° is 12 o'clock, clockwise positive).
 */
function chamberWedgePath(path, { angle, inner, outer, halfAngle, corner = 0.028 }) {
  const polar = (radius, offset) => [
    Math.sin(angle + offset) * radius,
    Math.cos(angle + offset) * radius,
  ];
  const corners = [
    polar(inner, -halfAngle),
    polar(outer, -halfAngle),
    polar(outer, halfAngle),
    polar(inner, halfAngle),
  ];
  const eased = corners.map((point, index) => {
    const previous = corners[(index + corners.length - 1) % corners.length];
    const next = corners[(index + 1) % corners.length];
    const towards = (from, to) => {
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const length = Math.hypot(dx, dy) || 1;
      return [
        from[0] + (dx / length) * corner,
        from[1] + (dy / length) * corner,
      ];
    };
    return {
      point,
      entry: towards(point, previous),
      exit: towards(point, next),
    };
  });

  path.moveTo(eased[0].exit[0], eased[0].exit[1]);
  for (let index = 1; index <= eased.length; index += 1) {
    const current = eased[index % eased.length];
    path.lineTo(current.entry[0], current.entry[1]);
    path.quadraticCurveTo(
      current.point[0],
      current.point[1],
      current.exit[0],
      current.exit[1],
    );
  }
  path.closePath();
  return path;
}

/**
 * A gold-on-transparent lettering texture, used for the banner, the plaque
 * header and the colour bar. One canvas per string, cached by the caller.
 */
function makeEngravingTexture(THREE, text, options = {}) {
  if (typeof document === 'undefined') return null;
  const width = options.width ?? 512;
  const height = options.height ?? 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, width, height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${options.weight ?? 700} ${options.fontSize ?? 64}px ${
    options.font ?? '"Cinzel", "Playfair Display", Georgia, serif'
  }`;
  const spacing = options.spacing ?? 0;
  const glow = context.createLinearGradient(0, height * 0.2, 0, height * 0.8);
  glow.addColorStop(0, options.light ?? '#fffdf0');
  glow.addColorStop(0.45, options.mid ?? '#ffe9b8');
  glow.addColorStop(1, options.deep ?? '#c07f24');
  context.strokeStyle = 'rgba(36, 12, 3, 0.9)';
  context.lineWidth = options.outline ?? 6;
  if (spacing === 0) {
    context.strokeText(text, width / 2, height / 2);
    context.fillStyle = glow;
    context.fillText(text, width / 2, height / 2);
  } else {
    const characters = Array.from(text);
    const widths = characters.map((character) => context.measureText(character).width);
    const total =
      widths.reduce((sum, value) => sum + value, 0) + spacing * (characters.length - 1);
    let cursor = width / 2 - total / 2;
    for (let index = 0; index < characters.length; index += 1) {
      const x = cursor + widths[index] / 2;
      context.strokeText(characters[index], x, height / 2);
      context.fillStyle = glow;
      context.fillText(characters[index], x, height / 2);
      cursor += widths[index] + spacing;
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
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
function createEnvironment(THREE, renderer, artwork) {
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

    // The supplied artwork as a soft-box: its gold, red enamel and seasonal
    // glass become the highlights travelling across the instrument's metal and
    // crystal, so the rendered object reflects its own design language.
    if (artwork) {
      const artworkPanel = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 20),
        new THREE.MeshBasicMaterial({ map: artwork, color: 0x5e5e5e, toneMapped: false }),
      );
      artworkPanel.position.set(-1.0, 0.8, 9.2);
      artworkPanel.lookAt(0, 0.6, 0);
      scene.add(artworkPanel);
    }

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
 * The medallion's maple blade. The reference leaf has three long lobes and two
 * notches on each side, a wide waist and a short stem; a parametric spike disc
 * reads as a star instead, so the silhouette is cut from that outline and
 * extruded with a real bevelled edge.
 */
/**
 * Offsets a closed outline inward by a constant distance, using each vertex's
 * miter so the rim keeps an even width into the notches. A uniform scale cannot
 * do this: it leaves the gold rim far too wide where the outline turns in, and
 * the notches then read as gold bands across the blade.
 */
function insetOutline(outline, inset) {
  const count = outline.length;
  let area = 0;
  for (let index = 0; index < count; index += 1) {
    const [x1, y1] = outline[index];
    const [x2, y2] = outline[(index + 1) % count];
    area += x1 * y2 - x2 * y1;
  }
  // Clockwise and counter-clockwise outlines need opposite normals.
  const sign = area > 0 ? 1 : -1;
  const edgeNormal = (from, to) => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy) || 1;
    return [(sign * dy) / length, (-sign * dx) / length];
  };
  return outline.map(([x, y], index) => {
    const before = edgeNormal(outline[(index - 1 + count) % count], outline[index]);
    const after = edgeNormal(outline[index], outline[(index + 1) % count]);
    const bisectorX = before[0] + after[0];
    const bisectorY = before[1] + after[1];
    const bisectorLength = Math.hypot(bisectorX, bisectorY) || 1;
    const normalX = bisectorX / bisectorLength;
    const normalY = bisectorY / bisectorLength;
    const miter = Math.max(0.5, normalX * before[0] + normalY * before[1]);
    return [x - (normalX * inset) / miter, y - (normalY * inset) / miter];
  });
}

function mapleSilhouetteGeometry(THREE, options = {}) {
  const rightHalf = [
    [0.0, 1.0],
    [0.09, 0.7],
    [0.26, 0.76],
    [0.21, 0.5],
    [0.44, 0.52],
    [0.34, 0.28],
    [0.48, 0.1],
    [0.3, 0.0],
    [0.36, -0.2],
    [0.2, -0.16],
    [0.16, -0.46],
    [0.07, -0.38],
    [0.065, -0.7],
    [0.0, -0.66],
  ];
  const outline = [...rightHalf];
  for (let index = rightHalf.length - 2; index >= 1; index -= 1) {
    outline.push([-rightHalf[index][0], rightHalf[index][1]]);
  }
  const points = options.inset ? insetOutline(outline, options.inset) : outline;

  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: options.thickness ?? 0.12,
    bevelEnabled: true,
    bevelThickness: options.bevel ?? 0.03,
    bevelSize: options.bevel ?? 0.026,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geometry.center();
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
      // 1 cuts the mesh above the level (the bowl's liquid); 0 fills the whole
      // face and draws the level as a line (the glazed compartments).
      uClip: { value: 1 },
      // Optional depth gradient: the bowl's liquid is deeper than one visible
      // wall, so it darkens toward the floor and brightens near the surface.
      uDeepen: { value: 0 },
      // Internal illumination. Zero for the bowl's liquid (which is lit by its
      // own point light), one for the back-lit glass compartments.
      uGlow: { value: 0 },
      // Suspended micro-bubbles and a bright cut edge, both compartment-only.
      uBubbles: { value: 0 },
      uSurface: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying float vLocalY;
      varying vec2 vUv;
      varying vec2 vCell;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        // Screen-vertical, measured from the object's own centre. Liquid
        // settles level in the visitor's frame, so a cell on the wheel's side
        // draws its surface horizontally rather than radially.
        vLocalY = viewPosition.y - (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y;
        // The cell's own face coordinates, in screen space, so a glass sheen can
        // be drawn exactly where a curved surface would catch the light.
        vCell = (viewPosition.xy - (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xy) /
          vec2(0.19, 0.22);
        vUv = uv;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uLevel;
      uniform float uOpacity;
      uniform float uClip;
      uniform float uDeepen;
      uniform float uGlow;
      uniform float uBubbles;
      uniform float uSurface;
      uniform float uTime;
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying float vLocalY;
      varying vec2 vUv;
      varying vec2 vCell;

      float hash21(vec2 value) {
        vec2 seeded = fract(value * vec2(123.34, 456.21));
        seeded += dot(seeded, seeded + 45.32);
        return fract(seeded.x * seeded.y);
      }

      void main() {
        if (uClip > 0.5 && vLocalY > uLevel) discard;
        vec3 normal = normalize(vNormalView);
        vec3 view = normalize(vViewDirection);
        vec3 lightA = normalize(vec3(-0.34, 0.5, 0.95));
        vec3 lightB = normalize(vec3(0.62, 0.28, 0.9));
        float diffuse = max(dot(normal, lightA), 0.0);
        float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.0);
        float specularA = pow(max(dot(normal, normalize(lightA + view)), 0.0), 26.0);
        float specularB = pow(max(dot(normal, normalize(lightB + view)), 0.0), 92.0);

        // Enamel depth: the colour deepens in the block's shadowed lower half
        // and lifts toward the light at the top, without leaving the palette.
        float depth = clamp(vLocalY / max(uLevel, 0.0001), 0.0, 1.0);
        vec3 colour = mix(uColor * 0.6, uColor * 1.06, pow(depth, 1.2));
        colour *= 0.92 + 0.2 * diffuse;
        colour += uColor * (0.05 + 0.12 * uGlow) * (0.35 + 0.65 * depth);
        // A thick glass wall deepens toward its outline; the thin skin over the
        // top face picks up a bright sheen instead.
        colour *= 1.0 - fresnel * 0.45;
        colour += mix(uColor, vec3(1.0), 0.3) * fresnel * 0.12;
        colour += vec3(1.0, 0.97, 0.9) * specularA * 0.13;
        colour += vec3(1.0) * specularB * 0.32;

        // Suspended micro-bubbles below the surface: a filled glass bead with a
        // brighter rim, drawn as one hashed cell, drifting slowly upward.
        float surfaceY = uLevel - clamp(uLevel * 0.16, 0.012, 0.05);
        if (uBubbles > 0.001 && vLocalY < surfaceY) {
          vec2 cellUv = vec2(vUv.x * 7.0, vUv.y * 13.0 + uTime * 0.1);
          vec2 cell = floor(cellUv);
          vec2 local = (fract(cellUv) - vec2(0.5, 0.45)) * vec2(1.0, 1.12);
          float radius = 0.09 + hash21(cell) * 0.1;
          float distanceToCentre = length(local);
          float bead = smoothstep(radius, radius * 0.35, distanceToCentre);
          float ring = smoothstep(radius, radius * 0.84, distanceToCentre) -
            smoothstep(radius * 0.84, radius * 0.52, distanceToCentre);
          colour += mix(uColor, vec3(1.0), 0.8) * (bead * 0.3 + ring * 0.28) * uBubbles;
        }

        // The liquid level itself: a bright meniscus line just under the cut,
        // with a soft sheen hanging beneath it.
        float line = smoothstep(0.03, 0.0, abs(vLocalY - surfaceY)) * uSurface;
        float sheen = smoothstep(surfaceY - 0.075, surfaceY, vLocalY) *
          step(vLocalY, surfaceY) * uSurface;
        colour += mix(uColor, vec3(1.0), 0.75) * line * 0.5;
        colour += mix(uColor, vec3(1.0), 0.4) * sheen * 0.12;

        // Glass: a broad curved reflection near the top of the cell and a foot
        // that darkens where the block thickens at its base. Both are shaded on
        // top of the seasonal colour and never shift its hue.
        if (uSurface > 0.5) {
          float sheenArc = smoothstep(
            0.62,
            0.0,
            length((vCell - vec2(-0.1, 0.52)) / vec2(0.86, 0.4))
          );
          colour += vec3(1.0, 0.985, 0.95) * sheenArc * 0.34;
          float glint = smoothstep(
            0.6,
            0.0,
            length((vCell - vec2(0.3, 0.46)) / vec2(0.32, 0.18))
          );
          colour += vec3(1.0) * glint * 0.22;
          float foot = smoothstep(-0.05, -0.98, vCell.y);
          colour *= 1.0 - foot * 0.42;
        }

        if (uDeepen > 0.5) {
          colour *= mix(0.72, 1.0, depth);
        }
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
function createCrystalMaterial(THREE, options = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTint: { value: new THREE.Color(options.tint ?? 0xdffcff) },
      uTintDeep: { value: new THREE.Color(options.deepTint ?? 0x9fc6ff) },
      // 1 turns the smooth lathe into flat diamond-cut plates by quantising the
      // view-space normal; the geometry cost stays at one shell.
      uFacet: { value: options.facet === false ? 0 : 1 },
      uFacetCount: { value: Number.isFinite(options.facets) ? options.facets : 5.5 },
      uBrightness: { value: Number.isFinite(options.brightness) ? options.brightness : 1 },
      uAlpha: { value: Number.isFinite(options.alphaScale) ? options.alphaScale : 1 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying vec2 vUv;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        vUv = uv;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uTint;
      uniform vec3 uTintDeep;
      uniform float uFacet;
      uniform float uFacetCount;
      uniform float uBrightness;
      uniform float uAlpha;
      uniform float uTime;
      varying vec3 vNormalView;
      varying vec3 vViewDirection;
      varying vec2 vUv;

      float hash21(vec2 value) {
        vec2 seeded = fract(value * vec2(123.34, 456.21));
        seeded += dot(seeded, seeded + 45.32);
        return fract(seeded.x * seeded.y);
      }

      void main() {
        vec3 normal = normalize(vNormalView);
        vec3 view = normalize(vViewDirection);

        // Diamond-cut facet plates, each catching the light on its own.
        vec3 facetNormal = normal;
        float facetId = 0.5;
        if (uFacet > 0.5) {
          vec3 grid = floor(normal * uFacetCount + 0.5);
          facetNormal = normalize(grid + sign(grid) * 0.16);
          facetId = hash21(grid.xy + grid.z);
        }

        float facing = abs(dot(facetNormal, view));
        float fresnel = pow(1.0 - facing, 2.6);
        vec3 lightA = normalize(vec3(-0.45, 0.55, 0.9));
        vec3 lightB = normalize(vec3(0.55, 0.25, 0.95));
        float specularA = pow(max(dot(facetNormal, normalize(lightA + view)), 0.0), 90.0);
        float specularB = pow(max(dot(facetNormal, normalize(lightB + view)), 0.0), 26.0);

        // Refraction: bend the view ray through the glass and read a two-pole
        // sky. Cheap, stable and it gives the bowl real depth behind the rim.
        vec3 refracted = refract(-view, facetNormal, 0.58);
        float sky = clamp(refracted.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 refractionTint = mix(vec3(0.3, 0.44, 0.72), vec3(1.0, 0.86, 0.62), sky);
        refractionTint += vec3(0.14, -0.02, -0.12) * (facetId - 0.5) * uFacet;

        vec3 colour = uTint * (0.46 + 0.54 * specularB) + refractionTint * 0.24;
        colour += vec3(1.0, 0.97, 0.88) * specularA * 0.95;
        colour += uTintDeep * fresnel * 0.3;

        // A facet occasionally throws a hard sparkle as the light crosses it.
        float twinkle = pow(max(sin(uTime * 0.9 + facetId * 6.28318), 0.0), 22.0);
        colour += vec3(1.0, 0.98, 0.92) * twinkle * uFacet * 0.35;

        // A solid block of glass, not a film: the body carries visible mass,
        // and it thickens toward the base where the wall is deepest.
        float alpha = 0.14 + fresnel * 0.4 + specularA * 0.3 + specularB * 0.05;
        alpha += (1.0 - clamp(vUv.y, 0.0, 1.0)) * 0.16;
        alpha += twinkle * 0.2 * uFacet;

        // The cut itself: a diamond lattice ground into the glass, each plate
        // chiselled along its edges and tilted on its own so the bowl reads as
        // thick cut crystal instead of a clear shell.
        if (uFacet > 0.5) {
          vec2 gridUv = vec2(vUv.x * 11.0, vUv.y * 3.6);
          vec2 diamond = vec2(
            abs(fract(gridUv.x + gridUv.y) - 0.5),
            abs(fract(gridUv.x - gridUv.y) - 0.5)
          );
          float edge = 1.0 - smoothstep(0.0, 0.17, min(diamond.x, diamond.y));
          float plate = hash21(
            floor(vec2(gridUv.x + gridUv.y, gridUv.x - gridUv.y))
          );
          // Each plate carries its own density, so the cut reads as mass rather
          // than as bright lines drawn on a transparent sheet.
          colour *= mix(0.84, 1.14, plate);
          colour += vec3(1.0, 0.98, 0.92) * edge * 0.18;
          colour += (uTint + uTintDeep) * (plate - 0.5) * 0.3;
          alpha += clamp(plate, 0.0, 1.0) * 0.24;
          alpha += edge * 0.1;
        }

        alpha *= uAlpha;
        gl_FragColor = vec4(colour * uBrightness, clamp(alpha, 0.0, 0.8));
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/**
 * Revolves a closed 2D cross-section around the ring axis and lays the result
 * flat against the instrument face, so a single lathe produces a solid gold
 * band with real front, back, chamfer and inner return faces.
 *
 * @param {any} THREE
 * @param {ReadonlyArray<readonly [number, number]>} profile radius/x, depth/y
 * @param {number} segments
 */
function revolvedRingGeometry(THREE, profile, segments) {
  const geometry = new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    Math.max(3, Math.round(segments)),
  );
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A ring of identical gold beads — rivets on the housing, a beaded border on
 * the well — as one instanced draw call.
 *
 * @param {any} THREE
 * @param {{ count: number, radius: number, z?: number, size?: number, centre?: [number, number], bulge?: number }} options
 */
function beadRingGeometry(THREE, options) {
  const count = Math.max(1, Math.round(options.count));
  const radius = Math.max(0.001, options.radius);
  const size = Math.max(0.001, options.size ?? 0.012);
  const [centreX, centreY] = options.centre ?? [0, 0];
  const z = Number.isFinite(options.z) ? options.z : 0;
  const bulge = Number.isFinite(options.bulge) ? options.bulge : 0;
  const geometry = new THREE.SphereGeometry(size, 8, 6);
  const mesh = new THREE.InstancedMesh(geometry, null, count);
  // Instances sit far from the geometry's origin, so its bounding sphere is
  // not a valid cull volume for the batch.
  mesh.frustumCulled = false;
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    matrix.makeTranslation(
      centreX + Math.cos(angle) * radius,
      centreY + Math.sin(angle) * radius,
      z + Math.abs(Math.sin(angle)) * bulge,
    );
    mesh.setMatrixAt(index, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
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

/**
 * Loads the reference artwork once, AVIF first with the WebP derivative as the
 * fallback, matching the site's image delivery. It is only ever used as a
 * reflection source: nothing is drawn to the visitor as a flat image.
 *
 * @param {any} THREE
 * @returns {Promise<any|null>}
 */
function loadArtworkTexture(THREE) {
  if (typeof document === 'undefined' || typeof THREE.TextureLoader !== 'function') {
    return Promise.resolve(null);
  }
  const loader = new THREE.TextureLoader();
  const candidates = ['/assets/lucky-meter-artwork.avif', '/assets/lucky-meter-artwork.webp'];
  return new Promise((resolve) => {
    const attempt = (index) => {
      if (index >= candidates.length) {
        resolve(null);
        return;
      }
      loader.load(
        candidates[index],
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 2;
          resolve(texture);
        },
        undefined,
        () => attempt(index + 1),
      );
    };
    attempt(0);
  });
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
  let disposed = false;
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

  let environment = createEnvironment(THREE, renderer);
  if (environment) {
    scene.environment = environment.texture;
    scene.environmentIntensity = 1.15;
  }
  let artworkTexture = null;
  if (!constrained) {
    // The artwork arrives after first paint; the procedural room lights the
    // instrument until it does, then the probe is rebuilt with it in place.
    loadArtworkTexture(THREE)
      .then((texture) => {
        if (disposed || !texture) {
          texture?.dispose();
          return;
        }
        artworkTexture = texture;
        const rebuilt = createEnvironment(THREE, renderer, texture);
        if (!rebuilt) return;
        scene.environment = rebuilt.texture;
        const previous = environment;
        environment = rebuilt;
        previous?.dispose();
      })
      .catch(() => {
        // A missing reflection source only costs some highlight colour.
      });
  }

  const lights = createLightRig(THREE, { quality: stage.quality, budget: stage.budget });
  lights.addTo(scene);

  // A dedicated key light for the wheel face, so the chambers read as lit metal
  // even when the shared rig is reduced to one light. The constrained tier keeps
  // the rig's single light and skips this one so the budget is never exceeded.
  const faceLight = constrained ? null : new THREE.PointLight(0xfff0d2, high ? 1.7 : 1.4, 11, 2);
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

  const gold = materials.gold({
    color: 0xdc951f,
    roughness: 0.18,
    envMapIntensity: 2.0,
    emissive: 0x2a1400,
    emissiveIntensity: 0.3,
  });
  // Two more metals give the housing its layered construction: a hot polished
  // band that takes a hard highlight, and a deep bronze case that reads as the
  // instrument's body behind the goldwork.
  const polishedGold = trackMaterial(
    materials.gold({ color: 0xffcf7a, roughness: 0.11, envMapIntensity: 2.4 }),
  );
  const bronze = trackMaterial(
    materials.gold({ color: 0x6b4a1a, roughness: 0.46, envMapIntensity: 0.85 }),
  );
  // Small ornaments sit far from the key light; a warm self-lit gold keeps
  // laurels, screws and veins reading as metal instead of black shapes.
  const warmGold = trackMaterial(
    materials.gold({
      color: 0xffc65e,
      roughness: 0.3,
      envMapIntensity: 1.3,
      emissive: 0x2e1c05,
      emissiveIntensity: 0.6,
    }),
  );
  const animatedMaterials = [];
  const housingSegments = high ? 96 : constrained ? 40 : 64;

  // ── Layer 1: the deep case the whole wheel is set into ─────────────────
  const caseGeometry = trackGeometry(
    new THREE.CylinderGeometry(
      METER_LAYOUT.wheel.outerRadius - 0.02,
      METER_LAYOUT.wheel.outerRadius - 0.035,
      0.3,
      housingSegments,
    ),
  );
  caseGeometry.rotateX(Math.PI / 2);
  const housingCase = new THREE.Mesh(caseGeometry, bronze);
  housingCase.position.z = -0.16;
  wheelGroup.add(housingCase);

  // ── Layer 2: the sculpted gold housing ────────────────────────────────
  // One closed cross-section revolved into a solid band: outer wall, rolled
  // front lip, chamfer, inner return and a recessed seat for the plate.
  const housing = new THREE.Mesh(
    trackGeometry(
      revolvedRingGeometry(
        THREE,
        [
          [0.966, 0.2],
          [1.012, 0.218],
          [1.058, 0.198],
          [1.088, 0.152],
          [1.106, 0.088],
          [1.116, 0.0],
          [1.104, -0.096],
          [1.076, -0.16],
          [1.03, -0.2],
          [0.99, -0.206],
          [0.972, -0.14],
          [0.962, 0.06],
        ],
        housingSegments,
      ),
    ),
    gold,
  );
  housing.position.z = -0.03;
  wheelGroup.add(housing);

  // Machined highlight bands: two mirror rings that separate the layers.
  for (const [radius, tube, z] of [
    [1.11, 0.0085, 0.03],
    [1.1, 0.0065, -0.088],
  ]) {
    const band = new THREE.Mesh(
      trackGeometry(new THREE.TorusGeometry(radius, tube, 6, high ? 96 : 48)),
      polishedGold,
    );
    band.position.z = z;
    wheelGroup.add(band);
  }

  // Rivets around the front lip: one instanced draw for the whole set.
  const rivets = beadRingGeometry(THREE, {
    count: high ? 36 : 24,
    radius: 1.038,
    z: 0.186,
    size: 0.0105,
  });
  rivets.material = polishedGold;
  wheelGroup.add(rivets);

  // ── Layer 3: the stepped bezel that frames the reading well ────────────
  const innerBezel = new THREE.Mesh(
    trackGeometry(
      revolvedRingGeometry(
        THREE,
        [
          [0.51, 0.15],
          [0.548, 0.16],
          [0.578, 0.134],
          [0.586, 0.096],
          [0.562, 0.07],
          [0.522, 0.078],
        ],
        housingSegments,
      ),
    ),
    gold,
  );
  wheelGroup.add(innerBezel);
  const innerBeads = beadRingGeometry(THREE, {
    count: high ? 56 : 36,
    radius: 0.552,
    z: 0.158,
    size: 0.0085,
  });
  innerBeads.material = polishedGold;
  wheelGroup.add(innerBeads);

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
  // One punched gold plate holds twelve glass cups. The plate is real geometry
  // with twelve circular windows, so each colour sits *in* the instrument as a
  // lit compartment rather than being painted on its face.
  const chamberFills = [];

  // The plate is extruded in twelve pieces, one per window. A single disc with
  // thirteen holes makes the triangulator bridge the central opening across the
  // narrow web beside each window, and those bridges survived as stray gold
  // triangles lying across the reading well. One window per piece cannot do it.
  const plateInnerRadius = 0.5;
  const plateOuterRadius = METER_LAYOUT.wheel.outerRadius - 0.03;
  const plateHalfAngle = (CHAMBER_DEGREES / 2 - 1.3) * DEG2RAD;
  const plateWindowRadius = CHAMBER_CUP.radius + 0.006;
  const plateWindowCentre =
    (METER_LAYOUT.wheel.chamberInnerRadius + METER_LAYOUT.wheel.chamberOuterRadius) / 2;
  const plateGeometry = (() => {
    const shape = new THREE.Shape();
    chamberWedgePath(shape, {
      angle: 0,
      inner: plateInnerRadius,
      outer: plateOuterRadius,
      halfAngle: plateHalfAngle,
      corner: 0.03,
    });
    const window = new THREE.Path();
    window.absarc(0, plateWindowCentre, plateWindowRadius, 0, Math.PI * 2, true);
    shape.holes.push(window);
    return trackGeometry(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.014,
        bevelSize: 0.012,
        bevelSegments: 2,
        curveSegments: constrained ? 16 : 28,
      }),
    );
  })();
  // The plate is the dark metal the windows are punched through; the polished
  // gold lives on the bezels and spokes, so the twelve compartments carry the
  // colour instead of a wide field of flat gold.
  for (let index = 0; index < CHAMBER_COUNT; index += 1) {
    const plateSegment = new THREE.Mesh(plateGeometry, gold);
    plateSegment.rotation.z = -index * CHAMBER_DEGREES * DEG2RAD;
    plateSegment.position.z = 0.02;
    wheelGroup.add(plateSegment);
  }

  // A dark bronze well behind the plate: every window becomes a deep
  // compartment instead of a hole punched through a flat disc.
  const plateRecess = new THREE.Mesh(
    trackGeometry(new THREE.CylinderGeometry(1.02, 1.02, 0.03, housingSegments)),
    bronze,
  );
  plateRecess.rotation.x = Math.PI / 2;
  plateRecess.position.z = -0.075;
  wheelGroup.add(plateRecess);

  // Radial gold spokes between the windows keep the plate reading as a wheel
  // and separate the cups into individual compartments.
  const spokeGeometry = trackGeometry(new THREE.BoxGeometry(0.05, 0.4, 0.11));
  for (let index = 0; index < CHAMBER_COUNT; index += 1) {
    const angle = toMathAngle(index * CHAMBER_DEGREES + CHAMBER_DEGREES / 2);
    const radius = METER_LAYOUT.wheel.chamberOuterRadius - 0.25;
    const spoke = new THREE.Mesh(spokeGeometry, polishedGold);
    spoke.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.055);
    spoke.rotation.z = angle - Math.PI / 2;
    wheelGroup.add(spoke);
  }

  const cupGlassMaterial = trackMaterial(
    createCrystalMaterial(THREE, {
      facet: false,
      brightness: 0.6,
      alphaScale: 0.13,
      tint: 0xeaf8ff,
    }),
  );
  animatedMaterials.push(cupGlassMaterial);
  // Each chamber is a wedge-shaped glazed cell, the shape the reference draws:
  // a radial block that widens outward, with a rounded gold frame around it.
  const cellInnerRadius = METER_LAYOUT.wheel.chamberInnerRadius + 0.004;
  const cellOuterRadius = METER_LAYOUT.wheel.chamberOuterRadius - 0.006;
  const cellMidRadius = (cellInnerRadius + cellOuterRadius) / 2;
  const cellHalfAngle = (CHAMBER_DEGREES / 2 - 1.3) * DEG2RAD;
  const cellShape = (inset) => {
    const shape = new THREE.Shape();
    chamberWedgePath(shape, {
      angle: 0,
      inner: cellInnerRadius + inset,
      outer: cellOuterRadius - inset,
      halfAngle: cellHalfAngle,
      corner: 0.028,
    });
    return shape;
  };
  const extrudeCell = (inset, depth, bevel) => {
    const geometry = trackGeometry(
      new THREE.ExtrudeGeometry(cellShape(inset), {
        depth,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        curveSegments: constrained ? 6 : 10,
      }),
    );
    // The cell's origin becomes its own centre, so the shader's vertical axis
    // and the mesh's placement share one frame.
    geometry.translate(0, -cellMidRadius, 0);
    return geometry;
  };

  const cupLiquidGeometry = extrudeCell(0.006, 0.085, 0.012);
  const cupGlassGeometry = extrudeCell(0.002, 0.02, 0.006);
  const cupBackGeometry = extrudeCell(0.012, 0.03, 0);
  // The frame is a real ring: the cell's wedge with its own opening cut out, so
  // gold shows around every segment instead of a solid plate in front of it.
  const cupFrameGeometry = (() => {
    const shape = cellShape(-0.018);
    const hole = new THREE.Path();
    chamberWedgePath(hole, {
      angle: 0,
      inner: cellInnerRadius + 0.001,
      outer: cellOuterRadius - 0.001,
      halfAngle: cellHalfAngle,
      corner: 0.026,
    });
    shape.holes.push(hole);
    const geometry = trackGeometry(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.03,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.008,
        bevelSegments: 2,
        curveSegments: constrained ? 6 : 10,
      }),
    );
    geometry.translate(0, -cellMidRadius, 0);
    return geometry;
  })();

  const cupCentreRadius =
    (METER_LAYOUT.wheel.chamberInnerRadius + METER_LAYOUT.wheel.chamberOuterRadius) / 2;

  for (let index = 0; index < CHAMBER_COUNT; index += 1) {
    const group = new THREE.Group();
    group.rotation.z = -index * CHAMBER_DEGREES * DEG2RAD;
    wheelGroup.add(group);

    // A raised gold frame holds the cell, then the bronze cell itself.
    const frame = new THREE.Mesh(cupFrameGeometry, polishedGold);
    frame.position.set(0, cellMidRadius, 0.185);
    group.add(frame);

    const back = new THREE.Mesh(cupBackGeometry, bronze);
    back.position.set(0, cellMidRadius, 0.12);
    group.add(back);

    // A thin glazed face over the enamel. It is nearly invisible face-on and
    // only catches light at its edges, so it adds gloss without milking the
    // colour out of the cell.
    const glass = new THREE.Mesh(cupGlassGeometry, cupGlassMaterial);
    glass.position.set(0, cellMidRadius, 0.212);
    glass.renderOrder = 2;
    // The reference's segments are bare enamel, not covered by a lens: the
    // glaze only survives as the rim highlight, which the frame already gives.
    glass.visible = false;

    const rimMaterial = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0xfff2cc,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    // The envelope the choreography pulses: a bright additive edge sitting on
    // the cell's gold frame, which reads as light catching the bezel.
    const rim = new THREE.Mesh(cupFrameGeometry, rimMaterial);
    rim.name = `chamber-rim-${index}`;
    rim.position.set(0, cellMidRadius, 0.196);
    rim.scale.set(1.02, 1.02, 1);
    rim.renderOrder = 4;
    group.add(rim);

    const fillMaterial = trackMaterial(createFillMaterial(THREE, '#f5c451'));
    // Internal illumination, suspended bubbles and the liquid line. The face is
    // never clipped: the whole cell is filled and the level is drawn as a line.
    fillMaterial.uniforms.uGlow.value = 1;
    fillMaterial.uniforms.uBubbles.value = 0.4;
    fillMaterial.uniforms.uSurface.value = 1;
    fillMaterial.uniforms.uLevel.value = 0.078;
    fillMaterial.uniforms.uClip.value = 0;
    animatedMaterials.push(fillMaterial);
    const liquid = new THREE.Mesh(cupLiquidGeometry, fillMaterial);
    liquid.position.set(0, cellMidRadius, 0.132);
    liquid.name = `chamber-liquid-${index}`;
    liquid.renderOrder = 1;
    group.add(liquid);

    chamberFills.push({ material: fillMaterial, mesh: liquid, rimMaterial, glass, dome: glass });
  }

  // ── Central medallion and the reading well ─────────────────────────────
  // The wheel turns to put the selected chamber under the pointer. The well and
  // its reading belong to the visitor, not the mechanism: counter-rotate their
  // own group so the medallion and percentage stay upright while the chambers
  // turn. The medallion is real geometry that turns over, not a cross-fade.
  const centreGroup = new THREE.Group();
  wheelGroup.add(centreGroup);

  // Decorative rings and a laurel wreath frame the medallion, as in the
  // reference: a beaded border, two turned gold rings and twenty-six bronze
  // leaves laid tangentially around the well.
  const wellRing = new THREE.Mesh(
    trackGeometry(
      revolvedRingGeometry(
        THREE,
        [
          [0.396, 0.128],
          [0.424, 0.142],
          [0.452, 0.126],
          [0.448, 0.098],
          [0.41, 0.1],
        ],
        high ? 96 : 56,
      ),
    ),
    polishedGold,
  );
  centreGroup.add(wellRing);
  const wellBeads = beadRingGeometry(THREE, {
    count: high ? 44 : 30,
    radius: 0.478,
    z: 0.116,
    size: 0.0075,
  });
  wellBeads.material = polishedGold;
  centreGroup.add(wellBeads);

  const wreathLeafGeometry = trackGeometry(buildPointerLeafGeometry(THREE));
  const wreath = new THREE.InstancedMesh(wreathLeafGeometry, warmGold, 16);
  wreath.frustumCulled = false;
  {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();
    for (let index = 0; index < 16; index += 1) {
      // A laurel wreath around the relief, with a gap at the top for the crown.
      // Two laurel branches climb the sides of the well, as in the reference:
      // eight slim leaves each, turning outward as they rise, leaving the crown
      // clear for the maple.
      const side = index < 8 ? 1 : -1;
      const climb = (index % 8) / 7;
      const angle = (side === 1 ? 34 + climb * 82 : 244 + climb * 82) * DEG2RAD;
      position.set(Math.sin(angle) * 0.45, Math.cos(angle) * 0.45, 0.128);
      euler.set(0, 0, angle + Math.PI / 2 + side * 0.35);
      quaternion.setFromEuler(euler);
      scale.set(0.052, 0.082, 0.028);
      matrix.compose(position, quaternion, scale);
      wreath.setMatrixAt(index, matrix);
    }
    wreath.instanceMatrix.needsUpdate = true;
  }
  centreGroup.add(wreath);

  // The reference's blade: three long lobes and two notches a side, a wide
  // waist and a short stem, extruded with a true bevelled edge.
  const leafGeometry = trackGeometry(
    mapleSilhouetteGeometry(THREE, { thickness: 0.11, bevel: 0.022 }),
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
  medallion.scale.setScalar(MEDALLION_SCALE);
  medallion.position.set(0, 0.01, 0.16);
  centreGroup.add(medallion);

  // The leaf itself is red enamel inset into its gold rim, exactly as the
  // reference draws it: gold silhouette, deep red blade, raised gold veins.
  const medallionInlay = new THREE.Mesh(
    trackGeometry(
      mapleSilhouetteGeometry(THREE, { thickness: 0.04, bevel: 0.008, inset: 0.052 }),
    ),
    trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xc21d10,
        metalness: 0.4,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        emissive: 0x5e0c04,
        emissiveIntensity: 0.9,
        envMapIntensity: 1.2,
        side: THREE.DoubleSide,
      }),
    ),
  );
  medallionInlay.position.z = 0.062;
  medallion.add(medallionInlay);

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

  // ── Fixed 7:30 spout ───────────────────────────────────────────────────
  // The pointer is an open, angle-cut gold pipe. The cup that lands under it is
  // read by the mouth, and the same mouth pours that cup's colour into the bowl
  // below. It never rotates, so the selection maths is unchanged.
  const spoutAssembly = new THREE.Group();
  root.add(spoutAssembly);

  const socketPosition = METER_LAYOUT.spout.socket;
  const socketOuterGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.1, 0.118, 0.12, high ? 40 : 24),
  );
  socketOuterGeometry.rotateX(Math.PI / 2);
  const socket = new THREE.Mesh(socketOuterGeometry, gold);
  socket.position.set(socketPosition[0], socketPosition[1], socketPosition[2]);
  spoutAssembly.add(socket);

  const socketRingGeometry = trackGeometry(new THREE.TorusGeometry(0.105, 0.017, 8, 36));
  const socketRing = new THREE.Mesh(socketRingGeometry, gold);
  socketRing.position.set(socketPosition[0], socketPosition[1], socketPosition[2] + 0.06);
  spoutAssembly.add(socketRing);

  const spoutCurve = new THREE.CatmullRomCurve3(
    [
      socketPosition,
      [-0.79, -0.2, 0.075],
      METER_LAYOUT.spout.elbow,
      [-0.795, -0.47, 0.082],
      METER_LAYOUT.spout.mouth,
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.4,
  );
  const spoutTubeGeometry = trackGeometry(
    new THREE.TubeGeometry(spoutCurve, high ? 72 : 48, METER_LAYOUT.pointer.tubeRadius, 14, false),
  );
  const spoutTube = new THREE.Mesh(spoutTubeGeometry, gold);
  spoutAssembly.add(spoutTube);

  // The channel inside the pipe: dark at rest, lit by the colour while pouring.
  const spoutChannelMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      color: 0xffd9a6,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const spoutChannel = new THREE.Mesh(
    trackGeometry(
      new THREE.TubeGeometry(
        spoutCurve,
        high ? 72 : 48,
        METER_LAYOUT.pointer.tubeRadius * 0.42,
        8,
        false,
      ),
    ),
    spoutChannelMaterial,
  );
  spoutChannel.renderOrder = 6;
  spoutAssembly.add(spoutChannel);

  // The mouth: an open cylinder whose end plane is cut at an angle, so the
  // opening reads as a real pipe lip rather than a painted ring.
  const mouthDirection = spoutCurve.getTangentAt(0.999).normalize();
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(
    METER_LAYOUT.spout.mouth[0],
    METER_LAYOUT.spout.mouth[1],
    METER_LAYOUT.spout.mouth[2],
  );
  mouthGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mouthDirection);
  spoutAssembly.add(mouthGroup);

  const spoutMouth = new THREE.Mesh(
    trackGeometry(
      new THREE.CylinderGeometry(
        METER_LAYOUT.pointer.mouthRadius,
        METER_LAYOUT.pointer.tubeRadius,
        0.16,
        high ? 24 : 16,
        1,
        true,
      ),
    ),
    gold,
  );
  spoutMouth.rotation.x = METER_LAYOUT.spout.mouthAngleDegrees * DEG2RAD;
  mouthGroup.add(spoutMouth);

  const mouthInnerGeometry = trackGeometry(
    new THREE.CircleGeometry(METER_LAYOUT.pointer.mouthRadius * 0.9, high ? 24 : 16),
  );
  mouthInnerGeometry.rotateX(-Math.PI / 2);
  const spoutThroat = new THREE.Mesh(
    mouthInnerGeometry,
    trackMaterial(new THREE.MeshBasicMaterial({ color: 0x1a0c03, side: THREE.DoubleSide })),
  );
  spoutThroat.position.y = 0.055;
  spoutThroat.rotation.x = METER_LAYOUT.spout.mouthAngleDegrees * DEG2RAD;
  mouthGroup.add(spoutThroat);

  const mouthRimGeometry = trackGeometry(
    new THREE.TorusGeometry(METER_LAYOUT.pointer.mouthRadius, 0.016, 8, high ? 32 : 20),
  );
  mouthRimGeometry.rotateX(Math.PI / 2);
  const spoutLip = new THREE.Mesh(mouthRimGeometry, gold);
  spoutLip.position.y = -0.075;
  spoutLip.rotation.x = METER_LAYOUT.spout.mouthAngleDegrees * DEG2RAD;
  mouthGroup.add(spoutLip);

  // ── Faceted crystal receiving bowl ─────────────────────────────────────
  const bowlGroup = new THREE.Group();
  bowlGroup.position.set(METER_LAYOUT.vessel.x, METER_LAYOUT.vessel.y, METER_LAYOUT.vessel.z);
  // The reference's vessel is a generous serving bowl; its depth and cut are
  // tied to the wheel, so the whole vessel scales together rather than growing
  // a taller wall.
  bowlGroup.scale.setScalar(1.12);
  root.add(bowlGroup);

  // A single open shell, not a thick double wall: the liquid stays visible and
  // the twelve radial segments read as cut crystal instead of frosted glass.
  const bowlGlassMaterial = trackMaterial(
    createCrystalMaterial(THREE, { facet: true, facets: 2.4, brightness: 1.62 }),
  );
  animatedMaterials.push(bowlGlassMaterial);
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

  // A second wall of the same cut, inset inside the first: together they give
  // the rim visible thickness and a second refractive layer behind the glass.
  const bowlInnerMaterial = trackMaterial(
    createCrystalMaterial(THREE, {
      facet: true,
      facets: 3.2,
      brightness: 0.88,
      deepTint: 0xd8f0ff,
    }),
  );
  animatedMaterials.push(bowlInnerMaterial);
  const bowlInner = new THREE.Mesh(
    trackGeometry(
      new THREE.LatheGeometry(
        BOWL_PROFILE.map(([x, y]) =>
          new THREE.Vector2(Math.max(0.002, x * 0.885), y * 0.94),
        ),
        constrained ? 10 : 12,
      ),
    ),
    bowlInnerMaterial,
  );
  bowlInner.renderOrder = 1;
  bowlGroup.add(bowlInner);

  const bowlEdges = new THREE.LineSegments(
    trackGeometry(new THREE.EdgesGeometry(bowlGlassSource, 24)),
    trackMaterial(
      new THREE.LineBasicMaterial({
        color: 0xfff6e2,
        transparent: true,
        opacity: 1,
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
        opacity: 0.72,
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

  // The crystal rim itself: a real polished edge, with a fine gold fillet
  // beneath it where the glass meets its mount.
  const bowlRimMaterial = trackMaterial(
    createCrystalMaterial(THREE, { facet: false, brightness: 1.4, tint: 0xf2ffff }),
  );
  animatedMaterials.push(bowlRimMaterial);
  const bowlRim = new THREE.Mesh(
    trackGeometry(
      new THREE.TorusGeometry(METER_LAYOUT.vessel.radius - 0.004, 0.032, 10, high ? 72 : 40),
    ),
    bowlRimMaterial,
  );
  bowlRim.rotation.x = Math.PI / 2;
  bowlRim.position.y = METER_LAYOUT.vessel.height;
  bowlRim.renderOrder = 4;
  bowlGroup.add(bowlRim);

  const bowlRimFillet = new THREE.Mesh(
    trackGeometry(
      new THREE.TorusGeometry(METER_LAYOUT.vessel.radius - 0.004, 0.008, 6, high ? 72 : 40),
    ),
    polishedGold,
  );
  bowlRimFillet.rotation.x = Math.PI / 2;
  bowlRimFillet.position.y = METER_LAYOUT.vessel.height - 0.026;
  bowlGroup.add(bowlRimFillet);

  // A turned gold foot: a lathe profile with a knop, a step and a plinth.
  const bowlFoot = new THREE.Mesh(
    trackGeometry(
      new THREE.LatheGeometry(
        [
          [0.16, -0.175],
          [0.245, -0.17],
          [0.29, -0.148],
          [0.302, -0.108],
          [0.276, -0.072],
          [0.232, -0.048],
          [0.206, -0.026],
          [0.19, -0.008],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        constrained ? 18 : 36,
      ),
    ),
    gold,
  );
  bowlGroup.add(bowlFoot);

  const bowlFootRing = new THREE.Mesh(
    trackGeometry(new THREE.TorusGeometry(0.288, 0.011, 6, high ? 48 : 28)),
    polishedGold,
  );
  bowlFootRing.rotation.x = Math.PI / 2;
  bowlFootRing.position.y = -0.118;
  bowlGroup.add(bowlFootRing);

  // Cut-glass sparkles: a handful of billboarded glints that ride the rim and
  // body. Sprites keep the effect cheap and always face the visitor.
  const sparkleTexture = radialTexture(THREE, [
    [0, 'rgba(255, 255, 255, 1)'],
    [0.22, 'rgba(226, 246, 255, 0.55)'],
    [0.55, 'rgba(190, 224, 255, 0.14)'],
    [1, 'rgba(160, 200, 255, 0)'],
  ]);
  const sparkles = [];
  for (let index = 0; index < (constrained ? 3 : 7); index += 1) {
    const angle = (index / 7) * Math.PI * 2 + 0.4;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sparkleTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.5,
      }),
    );
    const level = 0.12 + (index % 3) * 0.11;
    sprite.position.set(
      Math.cos(angle) * bowlInnerRadiusAt(level) * 0.94,
      level,
      Math.sin(angle) * bowlInnerRadiusAt(level) * 0.55 + 0.08,
    );
    sprite.scale.setScalar(index % 2 === 0 ? 0.13 : 0.085);
    sprite.renderOrder = 6;
    bowlGroup.add(sprite);
    sparkles.push({ sprite, phase: index * 1.37, rate: 0.9 + (index % 3) * 0.4 });
  }

  // The liquid is the bowl's own inner shell, revolved from the same profile
  // as the glass and held just inside it. The fill shader cuts it flat at the
  // current level, so any amount of liquid keeps the crystal silhouette: a
  // straight cylinder used to punch through the flare near the foot.
  const liquidProfilePoints = [[0, BOWL_LIQUID_BASE]];
  const LIQUID_PROFILE_STEPS = 18;
  for (let step = 1; step <= LIQUID_PROFILE_STEPS; step += 1) {
    const y = BOWL_LIQUID_BASE + (BOWL_LIQUID_TOP - BOWL_LIQUID_BASE) * (step / LIQUID_PROFILE_STEPS);
    liquidProfilePoints.push([bowlInnerRadiusAt(y) * BOWL_LIQUID_INSET, y]);
  }

  const liquidMaterial = trackMaterial(createFillMaterial(THREE, '#a65e3b'));
  liquidMaterial.uniforms.uLevel.value = BOWL_LIQUID_BASE;
  liquidMaterial.uniforms.uOpacity.value = 0;
  liquidMaterial.uniforms.uDeepen.value = 1;
  const liquid = new THREE.Mesh(
    trackGeometry(
      new THREE.LatheGeometry(
        liquidProfilePoints.map(([x, y]) => new THREE.Vector2(x, y)),
        12,
      ),
    ),
    liquidMaterial,
  );
  liquid.renderOrder = 1;
  liquid.visible = false;
  bowlGroup.add(liquid);

  // The cut top is capped by a surface disc whose radius follows the same inner
  // wall, so the liquid always meets the glass instead of floating inside it.
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
    trackGeometry(new THREE.CircleGeometry(1, 12)),
    liquidSurfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = BOWL_LIQUID_BASE + 0.004;
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
    trackGeometry(new THREE.TorusGeometry(1, 0.018, 6, 24)),
    meniscusMaterial,
  );
  meniscus.rotation.x = Math.PI / 2;
  meniscus.position.y = BOWL_LIQUID_BASE + 0.006;
  meniscus.renderOrder = 4;
  bowlGroup.add(meniscus);

  // A soft sheen on the surface: the liquid reads as glossy rather than as a
  // painted disc, and its colour glows the way the reference bowl does.
  const liquidSheenTexture = radialTexture(THREE, [
    [0, 'rgba(255, 255, 255, 0.9)'],
    [0.42, 'rgba(255, 255, 255, 0.24)'],
    [1, 'rgba(255, 255, 255, 0)'],
  ]);
  const liquidSheenMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: liquidSheenTexture,
      color: 0xc07048,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const liquidSheen = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(2, 2)),
    liquidSheenMaterial,
  );
  liquidSheen.rotation.x = -Math.PI / 2;
  liquidSheen.renderOrder = 5;
  bowlGroup.add(liquidSheen);

  const liquidLight = new THREE.PointLight(0xa65e3b, 0.2, 2.4, 2);
  liquidLight.name = 'bowl-liquid-light';
  liquidLight.position.set(0, BOWL_LIQUID_BASE + 0.12, 0.16);
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

  // ── The arched "Lucky Meter" banner ───────────────────────────────────
  const engravingTextures = new Set();
  const engraving = (text, options) => {
    const texture = makeEngravingTexture(THREE, text, options);
    if (texture) engravingTextures.add(texture);
    return texture;
  };

  const bannerGroup = new THREE.Group();
  bannerGroup.position.set(METER_LAYOUT.banner.x, METER_LAYOUT.banner.y, METER_LAYOUT.banner.z);
  root.add(bannerGroup);

  const bannerHalf = METER_LAYOUT.banner.width / 2;
  const bannerHalfHeight = METER_LAYOUT.banner.height / 2;
  // The reference's banner is a plate bent around the wheel: a wide arc band
  // with dropped ends, so the crown rises and the ribbon curves with the
  // instrument instead of sitting on it like a straight sign.
  const bannerArcRadius = 3;
  const bannerArcHalf = Math.asin(Math.min(0.97, bannerHalf / bannerArcRadius));
  // Each layer is its own band, inset from the one beneath it, so the gold frame
  // shows as a real rolled edge rather than a scaled copy of one shape.
  const bannerArchGeometry = (inset, depth, bevel) => {
    const shape = new THREE.Shape();
    const inner = bannerArcRadius - bannerHalfHeight + inset;
    const outer = bannerArcRadius + bannerHalfHeight - inset;
    shape.absarc(0, 0, outer, Math.PI / 2 - bannerArcHalf, Math.PI / 2 + bannerArcHalf, false);
    shape.absarc(0, 0, inner, Math.PI / 2 + bannerArcHalf, Math.PI / 2 - bannerArcHalf, true);
    shape.closePath();
    const geometry = trackGeometry(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 2,
        curveSegments: constrained ? 12 : 26,
      }),
    );
    geometry.translate(0, -bannerArcRadius, 0);
    return geometry;
  };

  const bannerBorder = new THREE.Mesh(bannerArchGeometry(0, 0.095, 0), gold);
  bannerBorder.position.z = -0.02;
  bannerGroup.add(bannerBorder);

  // Rolled gold rims along both arcs: real tube sections that carry a highlight
  // around the whole edge, as the reference's banner does.
  const bannerRollGeometry = (radius) => {
    const geometry = trackGeometry(
      new THREE.TorusGeometry(radius, 0.03, 10, constrained ? 24 : 64, bannerArcHalf * 2),
    );
    geometry.rotateZ(Math.PI / 2 - bannerArcHalf);
    geometry.translate(0, -bannerArcRadius, 0);
    return geometry;
  };
  for (const radius of [
    bannerArcRadius - bannerHalfHeight,
    bannerArcRadius + bannerHalfHeight,
  ]) {
    const rolled = new THREE.Mesh(bannerRollGeometry(radius), polishedGold);
    rolled.position.z = 0.028;
    bannerGroup.add(rolled);
  }

  // Ornamental end scrolls: a real volute tube curled in on itself at each end
  // of the plate, as the reference finishes its banner rather than cutting the
  // band off square.
  const bannerScrollGeometry = (side) => {
    const points = [];
    const steps = constrained ? 30 : 54;
    // Two and a quarter turns, opening outward: the ear leaves the plate
    // horizontally, sweeps down and then curls into a tight spiral tip.
    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps;
      const angle = t * Math.PI * 4.5;
      const radius = 0.012 + 0.088 * t;
      points.push(
        new THREE.Vector3(
          side * (Math.cos(angle) * radius * 1.15 + 0.02),
          Math.sin(angle) * radius * 0.92,
          0,
        ),
      );
    }
    return trackGeometry(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), steps, 0.019, 10, false),
    );
  };
  const bannerEndX = Math.sin(bannerArcHalf) * bannerArcRadius;
  const bannerEndY = Math.cos(bannerArcHalf) * bannerArcRadius - bannerArcRadius;
  for (const side of [-1, 1]) {
    const scroll = new THREE.Mesh(bannerScrollGeometry(side), gold);
    scroll.position.set(side * (bannerEndX + 0.055), bannerEndY - 0.015, 0.035);
    scroll.scale.setScalar(1.35);
    bannerGroup.add(scroll);

    // A turned finial caps each scroll where it meets the plate.
    const boss = new THREE.Mesh(
      trackGeometry(new THREE.SphereGeometry(0.026, 14, 12)),
      polishedGold,
    );
    boss.position.set(side * (bannerEndX + 0.012), bannerEndY + 0.005, 0.05);
    bannerGroup.add(boss);
  }

  const bannerEnamelMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: 0x8d1113,
      metalness: 0.18,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      emissive: 0x3a0505,
      emissiveIntensity: 0.5,
      envMapIntensity: 0.9,
      side: THREE.DoubleSide,
    }),
  );
  const bannerEnamel = new THREE.Mesh(bannerArchGeometry(0.03, 0.05, 0), bannerEnamelMaterial);
  bannerEnamel.position.z = 0.045;
  bannerGroup.add(bannerEnamel);

  const bannerTextMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: engraving('Lucky Meter', { width: 960, height: 200, fontSize: 112, spacing: 3 }),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const bannerText = new THREE.Mesh(trackGeometry(new THREE.PlaneGeometry(1.22, 0.31)), bannerTextMaterial);
  // In front of the raised enamel field (which reaches z ≈ 0.108 with its
  // bevel), so the arched lettering is never swallowed by the second layer.
  bannerText.position.set(0, -0.01, 0.132);
  bannerGroup.add(bannerText);

  const bannerLeafGeometry = trackGeometry(buildPointerLeafGeometry(THREE));
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(bannerLeafGeometry, gold);
    leaf.scale.setScalar(0.12);
    leaf.position.set(side * 0.82, -0.02, 0.12);
    leaf.rotation.z = side * 1.3;
    bannerGroup.add(leaf);
  }

  // A second, raised enamel field: the crimson panel steps down from the gilt
  // frame in two layers, so light breaks along the step instead of one plane.
  const bannerEnamelTop = new THREE.Mesh(
    bannerArchGeometry(0.058, 0.022, 0.012),
    trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xa4151a,
        metalness: 0.2,
        roughness: 0.26,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: 0x430606,
        emissiveIntensity: 0.55,
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      }),
    ),
  );
  bannerEnamelTop.position.z = 0.074;
  bannerGroup.add(bannerEnamelTop);

  // Polished screw heads where the banner is bolted to its frame.
  const bannerScrewGeometry = trackGeometry(new THREE.SphereGeometry(0.024, 10, 8));
  for (const side of [-1, 1]) {
    const screw = new THREE.Mesh(bannerScrewGeometry, polishedGold);
    screw.position.set(side * 0.66, -0.115, 0.115);
    bannerGroup.add(screw);
  }

  // ── The ornate Lucky Number plaque ─────────────────────────────────────
  // The number's own destination: a gold-framed enamel display with an engraved
  // header and a recessed slot. It is deliberately separate from the bowl.
  const plaqueGroup = new THREE.Group();
  plaqueGroup.position.set(METER_LAYOUT.plaque.x, METER_LAYOUT.plaque.y, METER_LAYOUT.plaque.z);
  // Sized to sit with the vessel as the reference's second container, not as a
  // label beneath the wheel.
  plaqueGroup.scale.setScalar(1.14);
  root.add(plaqueGroup);

  const plaqueWidth = METER_LAYOUT.plaque.width;
  const plaqueHeight = METER_LAYOUT.plaque.height;
  // The plate is a real gilded frame rather than a slab: one extruded ring
  // with a bevelled face around an actual opening, over a deep case, with a
  // black well set back inside it and its own internal light.
  const plaqueFrameShape = roundedRectShape(THREE, plaqueWidth, plaqueHeight, 0.085);
  const plaqueOpening = roundedRectShape(
    THREE,
    plaqueWidth - 0.128,
    plaqueHeight - 0.128,
    0.048,
  );
  plaqueFrameShape.holes.push(new THREE.Path(plaqueOpening.getPoints(28)));

  const plaqueFrame = new THREE.Mesh(
    trackGeometry(
      new THREE.ExtrudeGeometry(plaqueFrameShape, {
        depth: 0.062,
        bevelEnabled: true,
        bevelThickness: 0.022,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 10,
      }),
    ),
    polishedGold,
  );
  plaqueFrame.position.z = 0.014;
  plaqueGroup.add(plaqueFrame);

  // The case behind the frame, seen as the plate's depth at every edge.
  const plaqueCase = new THREE.Mesh(
    trackGeometry(new THREE.BoxGeometry(plaqueWidth - 0.05, plaqueHeight - 0.05, 0.17)),
    trackMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x150f07,
        metalness: 0.62,
        roughness: 0.32,
        clearcoat: 0.7,
        clearcoatRoughness: 0.2,
        envMapIntensity: 0.8,
      }),
    ),
  );
  plaqueCase.position.z = -0.062;
  plaqueGroup.add(plaqueCase);

  // The interior light: a warm wash inside the recess that lifts with the
  // number's arrival. It is the plaque's own illumination, not a page glow.
  const plaqueGlowMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: haloTexture,
      color: 0xffd9a0,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const plaqueGlow = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(plaqueWidth * 0.96, plaqueHeight * 0.8)),
    plaqueGlowMaterial,
  );
  plaqueGlow.position.z = -0.018;
  plaqueGroup.add(plaqueGlow);

  // Screw heads at the corners and a small maple finial beneath the frame.
  const plaqueCornerGeometry = trackGeometry(new THREE.SphereGeometry(0.024, 10, 8));
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      const corner = new THREE.Mesh(plaqueCornerGeometry, polishedGold);
      corner.position.set(x * (plaqueWidth / 2 - 0.034), y * (plaqueHeight / 2 - 0.034), 0.088);
      plaqueGroup.add(corner);
    }
  }
  const plaqueCrest = new THREE.Mesh(
    trackGeometry(buildPointerLeafGeometry(THREE)),
    gold,
  );
  plaqueCrest.scale.setScalar(0.075);
  plaqueCrest.position.set(0, -plaqueHeight / 2 + 0.012, 0.09);
  plaqueCrest.rotation.z = Math.PI;
  plaqueGroup.add(plaqueCrest);

  const plaqueHeaderMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: engraving('YOUR LUCKY NUMBER', {
        width: 512,
        height: 96,
        fontSize: 40,
        spacing: 1.6,
        outline: 4,
      }),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const plaqueHeader = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(0.78, 0.17)),
    plaqueHeaderMaterial,
  );
  plaqueHeader.position.set(0, plaqueHeight / 2 - 0.145, 0.085);
  plaqueGroup.add(plaqueHeader);

  // The black interior itself: a deep, glossy, near-black field set back
  // behind the frame's face so the number reads as recessed into the plate.
  const plaqueInsetMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: 0x020408,
      metalness: 0.7,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      emissive: 0x030508,
      emissiveIntensity: 0.6,
      envMapIntensity: 1.2,
    }),
  );
  const plaqueInset = new THREE.Mesh(
    trackGeometry(
      new THREE.PlaneGeometry(plaqueWidth - 0.13, plaqueHeight - 0.13),
    ),
    plaqueInsetMaterial,
  );
  plaqueInset.position.set(0, 0, -0.006);
  plaqueGroup.add(plaqueInset);

  // The empty slot is two real gold bars sitting proud of the black well, not
  // a painted dash: they catch the plaque's own light like the reference's.
  const dashGeometry = trackGeometry(
    new THREE.ExtrudeGeometry(roundedRectShape(THREE, 0.09, 0.03, 0.014), {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
      curveSegments: 6,
    }),
  );
  const plaqueSlotMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: 0xffd489,
      metalness: 0.86,
      roughness: 0.18,
      emissive: 0x5a3407,
      emissiveIntensity: 0.5,
      transparent: true,
      envMapIntensity: 1.8,
    }),
  );
  for (const side of [-1, 1]) {
    const dash = new THREE.Mesh(dashGeometry, plaqueSlotMaterial);
    dash.position.set(side * 0.072, -0.088, 0.078);
    plaqueGroup.add(dash);
  }

  // Laurel sprigs frame the slot: a slender stem with paired leaves, as in the
  // reference, instead of a pair of medallions.
  const laurelLeafGeometry = trackGeometry(new THREE.SphereGeometry(1, 8, 6));
  const laurelStemGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.006, 0.0035, 0.4, 8),
  );
  for (const side of [-1, 1]) {
    const sprig = new THREE.Group();
    sprig.position.set(side * 0.226, -0.062, 0.068);
    sprig.rotation.z = side * -0.16;
    sprig.add(new THREE.Mesh(laurelStemGeometry, warmGold));

    const leafCount = high ? 14 : 9;
    const leaves = new THREE.InstancedMesh(laurelLeafGeometry, warmGold, leafCount);
    leaves.frustumCulled = false;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scale = new THREE.Vector3();
    for (let index = 0; index < leafCount; index += 1) {
      const t = index / (leafCount - 1);
      const outward = index % 2 === 0 ? 1 : -1;
      position.set(side * outward * (0.024 + 0.014 * Math.sin(t * Math.PI)), -0.19 + t * 0.38, 0.004);
      euler.set(0, 0, side * outward * (0.95 - 0.55 * t));
      quaternion.setFromEuler(euler);
      const size = 0.037 - 0.011 * t;
      scale.set(size * 0.5, size, 0.006);
      matrix.compose(position, quaternion, scale);
      leaves.setMatrixAt(index, matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
    sprig.add(leaves);
    plaqueGroup.add(sprig);
  }

  // ── The gold colour bar beneath the bowl ───────────────────────────────
  const barGroup = new THREE.Group();
  barGroup.position.set(METER_LAYOUT.colourBar.x, METER_LAYOUT.colourBar.y, METER_LAYOUT.colourBar.z);
  root.add(barGroup);

  const barBody = new THREE.Mesh(
    trackGeometry(
      new THREE.ExtrudeGeometry(
        roundedRectShape(THREE, METER_LAYOUT.colourBar.width, METER_LAYOUT.colourBar.height, 0.08),
        {
          depth: 0.05,
          bevelEnabled: true,
          bevelThickness: 0.016,
          bevelSize: 0.014,
          bevelSegments: 2,
          curveSegments: 8,
        },
      ),
    ),
    gold,
  );
  barGroup.add(barBody);

  // A recessed bronze field inside the gilt frame, with turned end caps: the
  // bar reads as a cast nameplate rather than a printed strip.
  const barField = new THREE.Mesh(
    trackGeometry(
      new THREE.ExtrudeGeometry(
        roundedRectShape(
          THREE,
          METER_LAYOUT.colourBar.width * 0.9,
          METER_LAYOUT.colourBar.height * 0.7,
          0.05,
        ),
        {
          depth: 0.012,
          bevelEnabled: true,
          bevelThickness: 0.006,
          bevelSize: 0.008,
          bevelSegments: 1,
          curveSegments: 8,
        },
      ),
    ),
    bronze,
  );
  barField.position.set(0, -0.008, 0.052);
  barGroup.add(barField);

  const barCapGeometry = trackGeometry(
    new THREE.CylinderGeometry(0.034, 0.042, 0.06, 12),
  );
  barCapGeometry.rotateX(Math.PI / 2);
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(barCapGeometry, polishedGold);
    cap.position.set(side * (METER_LAYOUT.colourBar.width / 2 - 0.02), 0, 0.03);
    barGroup.add(cap);
  }

  const barLabelMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: engraving('YOUR LUCKY COLOUR', {
        width: 512,
        height: 96,
        fontSize: 36,
        spacing: 1.4,
        outline: 4,
      }),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const barLabel = new THREE.Mesh(trackGeometry(new THREE.PlaneGeometry(0.9, 0.13)), barLabelMaterial);
  barLabel.position.set(0, 0.055, 0.078);
  barGroup.add(barLabel);

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
      METER_LAYOUT.spout.mouth,
      [-0.782, -0.66, 0.055],
      [-0.78, -0.73, 0.06],
      [-0.78, -0.8, 0.06],
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

  // ── The Lucky Number's independent flight ──────────────────────────────
  // The number is its own dimensional object: a gold token with the engraved
  // numeral, its own halo and a short trail. It leaves the selected cup after
  // the drain, never the spout, and seats itself in the plaque.
  const tokenGroup = new THREE.Group();
  tokenGroup.name = 'number-token';
  tokenGroup.visible = false;
  root.add(tokenGroup);

  const tokenPlate = new THREE.Mesh(
    trackGeometry(
      new THREE.ExtrudeGeometry(roundedRectShape(THREE, 0.58, 0.42, 0.09), {
        depth: 0.07,
        bevelEnabled: true,
        bevelThickness: 0.022,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 8,
      }),
    ),
    trackMaterial(
      materials
        .gold({
          roughness: 0.18,
          metalness: 0.82,
          envMapIntensity: 1.8,
          emissive: 0x3a2306,
          emissiveIntensity: 0.55,
        })
        .clone(),
    ),
  );
  tokenGroup.add(tokenPlate);

  const numeralMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: null,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const numeralPlane = new THREE.Mesh(
    trackGeometry(new THREE.PlaneGeometry(0.44, 0.44)),
    numeralMaterial,
  );
  numeralPlane.position.z = 0.082;
  tokenGroup.add(numeralPlane);

  const tokenHaloTexture = radialTexture(THREE, [
    [0, 'rgba(255, 236, 180, 0.85)'],
    [0.4, 'rgba(255, 190, 90, 0.35)'],
    [1, 'rgba(255, 160, 40, 0)'],
  ]);
  const tokenHaloMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: tokenHaloTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
    }),
  );
  const tokenHalo = new THREE.Mesh(trackGeometry(new THREE.PlaneGeometry(1.4, 1.4)), tokenHaloMaterial);
  tokenHalo.position.z = -0.05;
  tokenGroup.add(tokenHalo);

  const trailMaterial = trackMaterial(
    new THREE.MeshBasicMaterial({
      map: tokenHaloTexture,
      color: 0xffcf82,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const trailGeometry = trackGeometry(new THREE.PlaneGeometry(0.2, 0.2));
  const trailSprites = [];
  for (let index = 0; index < 6; index += 1) {
    const sprite = new THREE.Mesh(trailGeometry, trailMaterial);
    sprite.visible = false;
    root.add(sprite);
    trailSprites.push(sprite);
  }

  let flightPoints = [];
  let flightPathKey = '';

  /**
   * The token leaves the cup the wheel lands on. The selected index is
   * published while the wheel is still spinning, so the path is built from the
   * landing angle the scene is easing toward — never from the angle the wheel
   * happens to be passing through on the frame the index becomes known — and
   * it is rebuilt if the selection or that landing angle changes.
   */
  function ensureFlightPath() {
    if (selectedIndex < 0) return;
    const key = `${selectedIndex}:${state.targetWheelAngle.toFixed(3)}`;
    if (flightPoints.length > 0 && key === flightPathKey) return;
    flightPoints = numberTransferPath({
      index: selectedIndex,
      wheelAngle: state.targetWheelAngle,
    });
    flightPathKey = key;
  }

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
      // The cell wears the seasonal Lucky Colour exactly as the palette defines
      // it. Depth and gloss come from the material and its lighting, never from
      // shifting the hue, saturation or lightness of the visitor's colour.
      chamberFills[index].material.uniforms.uColor.value.set(colour.hex);
    }
  }

  function setSelectedIndex(index) {
    const next = Number.isInteger(index) ? index : -1;
    if (next !== selectedIndex) flightPoints = [];
    selectedIndex = next;
  }

  function applyColour(hex) {
    if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return;
    state.targetColour.set(hex);
  }

  function update(frameElapsed = 0) {
    const secs = Number(frameElapsed) || 0;
    // One clock for every custom material: bubbles drift and facets sparkle
    // without each material owning a timer.
    for (const material of animatedMaterials) {
      const time = material.uniforms?.uTime;
      if (time) time.value = secs;
    }

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
    medallion.scale.setScalar(MEDALLION_SCALE * (1 - leaf * 0.45));
    medallionMaterial.opacity = 1;
    medallion.visible = true;

    // Every cup is full except the selected one. Only the selected cup's liquid
    // column shortens; its glass, bezel and rim stay exactly where they are, and
    // the other eleven never move.
    const choreo = state.choreography || {};
    const focus = clamp01(choreo.focus ?? 0);
    const rimGlow = clamp01(choreo.rim ?? 0);
    for (let index = 0; index < CHAMBER_COUNT; index += 1) {
      const chamber = chamberFills[index];
      const isSelected = index === selectedIndex;
      const fill = isSelected ? 1 - clamp01(state.drain) : 1;
      chamber.mesh.scale.y = Math.max(0.001, fill);
      chamber.mesh.visible = fill > 0.004;
      chamber.rimMaterial.opacity = isSelected ? 0.5 + rimGlow * 0.5 : 0.24 + (1 - focus) * 0.12;
    }

    bannerTextMaterial.opacity = 0.8 + clamp01(choreo.banner ?? 0) * 0.2;
    bannerEnamelMaterial.emissiveIntensity = 0.36 + clamp01(choreo.banner ?? 0) * 0.42;
    spoutChannelMaterial.opacity = clamp01(choreo.pourGlow ?? 0) * 0.8;
    spoutChannelMaterial.color.copy(state.colour).offsetHSL(0, -0.05, 0.2);
    plaqueSlotMaterial.opacity = state.numberReveal > 0.004 ? 0 : 1;

    // The plaque's interior warms as the number approaches and settles.
    plaqueGlowMaterial.opacity =
      (state.phase === 'idle' ? 0.08 : 0.22) +
      clamp01(state.numberReveal) * 0.34 +
      clamp01(choreo.plaque ?? 0) * 0.24;

    // Crystal glints ride the bowl continuously and quicken as it fills. The
    // glass itself is lit by the same choreography, so the highlights and the
    // light on the facets always agree.
    const bowlGlow = clamp01(choreo.bowl ?? 0);
    for (const sparkle of sparkles) {
      const pulse = Math.max(0, Math.sin(secs * sparkle.rate + sparkle.phase));
      sparkle.sprite.material.opacity =
        0.1 + Math.pow(pulse, 6) * (0.5 + state.vesselFill * 0.3 + bowlGlow * 0.2);
    }
    bowlRimMaterial.uniforms.uBrightness.value = 1.35 + bowlGlow * 0.5;

    // Only the selected cup empties; the bowl is the colour's destination, not
    // a second drain.
    const vesselFill = clamp01(state.vesselFill);
    const liquidLevel = BOWL_LIQUID_BASE + vesselFill * (BOWL_LIQUID_TOP - BOWL_LIQUID_BASE);
    const surfaceRadius = bowlInnerRadiusAt(liquidLevel) * BOWL_LIQUID_INSET;
    liquid.visible = vesselFill > 0.002;
    liquidMaterial.uniforms.uLevel.value = liquidLevel;
    liquidMaterial.uniforms.uOpacity.value = liquid.visible ? 1 : 0;
    liquidMaterial.uniforms.uColor.value.copy(state.colour).offsetHSL(0, 0.12, 0.04);
    liquidSurface.position.y = liquidLevel + 0.004;
    liquidSurface.scale.setScalar(surfaceRadius);
    liquidSurfaceMaterial.color.copy(state.colour).offsetHSL(0, -0.02, 0.24);
    liquidSurfaceMaterial.opacity = vesselFill > 0.02 ? 0.52 : 0;
    meniscus.position.y = liquidLevel + 0.008;
    meniscus.scale.setScalar(surfaceRadius);
    meniscusMaterial.color.copy(state.colour).offsetHSL(0, -0.03, 0.24);
    meniscusMaterial.opacity = vesselFill > 0.02 ? 0.78 : 0;
    liquidSheen.position.y = liquidLevel + 0.01;
    liquidSheen.scale.setScalar(surfaceRadius * 1.02);
    liquidSheenMaterial.color.copy(state.colour).offsetHSL(0, 0.05, 0.3);
    liquidSheenMaterial.opacity = vesselFill > 0.02 ? 0.34 : 0;
    liquidLight.color.copy(state.colour);
    liquidLight.intensity = 0.12 + vesselFill * 1.0;
    liquidLight.position.y = BOWL_LIQUID_BASE + (liquidLevel - BOWL_LIQUID_BASE) * 0.65;

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
      const impactY = METER_LAYOUT.vessel.y + liquidLevel + 0.02;
      splash.position.y = impactY;
      const pulse = (secs * 1.9) % 1;
      splash.scale.setScalar(0.5 + pulse * 1.6);
      splashMaterial.opacity = (1 - pulse) * 0.55;
      splashMaterial.color.copy(state.colour).offsetHSL(0, -0.08, 0.3);
    } else {
      splashMaterial.opacity = 0;
    }

    // The Lucky Number is its own object. It forms in the selected cup while
    // the liquid falls, then leaves the cup, flies a continuous arc in front of
    // the instrument and seats itself in the plaque's recess. It never touches
    // the spout, the stream or the bowl.
    const transfer = clamp01(state.numberReveal);
    ensureFlightPath();
    const flying = transfer > 0.004 && transfer < 0.995 && flightPoints.length > 0;
    tokenGroup.visible = flying;
    if (flying) {
      const head = sampleNumberPath(flightPoints, transfer);
      tokenGroup.position.set(head.x, head.y, head.z);
      tokenGroup.quaternion.copy(camera.quaternion);
      tokenGroup.rotateZ(Math.sin(transfer * Math.PI * 2) * 0.14);
      const pop = Math.sin(Math.min(1, transfer * 1.6) * Math.PI * 0.5);
      tokenGroup.scale.setScalar(0.72 + pop * 0.34);
      tokenHaloMaterial.opacity = 0.3 + Math.sin(transfer * Math.PI) * 0.5;
      tokenPlate.material.emissiveIntensity = 0.4 + Math.sin(transfer * Math.PI) * 0.55;
      // The trail fades out before the token reaches the plaque, so no ghost
      // rings are left hanging beside the reading.
      const trailStrength =
        Math.sin(transfer * Math.PI) * 0.5 * clamp01((0.88 - transfer) / 0.12);
      trailMaterial.opacity = trailStrength;
      for (let index = 0; index < trailSprites.length; index += 1) {
        const point = sampleNumberPath(flightPoints, Math.max(0, transfer - (index + 1) * 0.03));
        const sprite = trailSprites[index];
        sprite.visible = trailStrength > 0.01;
        sprite.position.set(point.x, point.y, point.z - 0.02);
        sprite.quaternion.copy(camera.quaternion);
        sprite.scale.setScalar(1 - index * 0.12);
      }
    } else {
      trailMaterial.opacity = 0;
      for (const sprite of trailSprites) sprite.visible = false;
    }

    // In the cup the number is revealed by the falling liquid; once it detaches
    // the cup copy is gone and the token is the only number in the air.
    const numberReveal = clamp01(state.numberReveal);
    const inChamber = numberReveal < 0.004 && state.drain > 0.06;
    numberPlane.visible = shownNumber !== null && inChamber;
    if (inChamber) {
      numberPlane.quaternion.copy(camera.quaternion);
      numberPlane.position.set(numberCentre.x, numberCentre.y, 0.2);
      numberPlane.scale.setScalar(1);
      const top = numberCentre.y + 0.18;
      const bottom = numberCentre.y - 0.18;
      const revealed = clamp01((state.drain - 0.06) / 0.84);
      numberClip.constant = -(top - revealed * (top - bottom));
    }


    const selected = selectedIndex >= 0 ? selectedIndex : 0;
    const selectedFill = chamberFills[selected];
    // Only the idle meter breathes. Every other phase belongs to the `rim`
    // envelope assigned above, which this write used to overwrite on every
    // frame, so the selected cup never showed its landing light.
    if (selectedFill && state.phase === 'idle') {
      selectedFill.rimMaterial.opacity = 0.34 + Math.sin(secs * 2.1) * 0.04;
    }
    if (faceLight) {
      faceLight.intensity = (high ? 1.35 : 1.05) + Math.sin(secs * 0.85) * 0.06;
    }
    lights.update(0.016);
    dust.setIntensity(clamp01(choreo.dust ?? 0.35) * 0.9 + vesselFill * 0.15);
    dust.update(0.016, secs);

    // A finished or untouched scene must not keep rendering forever. A state
    // change or a pointer movement wakes it again.
    const atRest =
      state.phase === 'idle' ||
      (state.phase === 'revealed' && state.numberReveal >= 0.99);
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
      if (next.choreography && typeof next.choreography === 'object') {
        state.choreography = { ...state.choreography, ...next.choreography };
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
        numeralMaterial.map = numberTexture;
        numeralMaterial.needsUpdate = true;
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
        // Only one frame is drawn under reduced motion, so the colour has to
        // land with every other scalar; the 0.16 lerp in `update` cannot close
        // the gap in a single pass and the bowl would render the old colour.
        state.colour.copy(state.targetColour);
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
      disposed = true;
      failed = true;
      announced = true;
      watchdogStopped = false;
      window.removeEventListener('pointermove', wake);
      resizeObserver?.disconnect();
      resizeObserver = null;
      numberTexture?.dispose();
      numberTexture = null;
      tokenHaloTexture?.dispose();
      for (const texture of engravingTextures) texture?.dispose?.();
      bowlShadowTexture?.dispose();
      liquidSheenTexture?.dispose();
      surface.dispose();
      materials.dispose();
      lights.dispose();
      dust.dispose();
      environment?.dispose();
      artworkTexture?.dispose();
      sparkleTexture?.dispose();
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

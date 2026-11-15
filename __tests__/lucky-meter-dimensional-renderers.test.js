import { describe, it, expect } from 'vitest';
import {
  MEDALLION_PROFILE,
  buildMapleLeafGeometry,
  buildMedallionGeometry,
  mapleLeafOutline,
  polygonArea,
  triangulatePolygon,
} from '../app/lib/gpu-geometry';
import {
  EFFECT_CAMERA,
  composeTrs,
  depthDistance,
  depthScale,
  normalMatrixFromMat4,
  orthographicMat4,
} from '../app/lib/gpu-math';
import {
  MAX_SCENE_LIGHTS,
  clearSceneLights,
  getSceneLights,
  publishSceneLights,
  sampleSceneLightLift,
} from '../app/lib/gpu-scene-light';
import { resolveRenderQuality } from '../app/lib/graphics-capabilities';

/**
 * Focused guards for the dimensional renderers added in this pass.
 *
 * These check the geometry and lighting maths rather than the pixels: the
 * silhouette is a real maple leaf, the meshes are well-formed for WebGL, the
 * shared camera behaves monotonically, and the scene-light bus is bounded. The
 * behaviour of the meter itself is covered by the existing lifecycle suites.
 */

function unitLengths(normals) {
  const lengths = [];
  for (let index = 0; index < normals.length; index += 3) {
    lengths.push(
      Math.hypot(normals[index], normals[index + 1], normals[index + 2]),
    );
  }
  return lengths;
}

function assertWellFormedMesh(mesh) {
  expect(mesh.positions.length % 3).toBe(0);
  expect(mesh.normals.length).toBe(mesh.positions.length);
  expect(mesh.albedos.length).toBe(mesh.positions.length);
  expect(mesh.indices.length % 3).toBe(0);
  expect(mesh.indices.length).toBeGreaterThan(0);

  const vertexCount = mesh.positions.length / 3;
  for (const index of mesh.indices) {
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(vertexCount);
  }
  for (const length of unitLengths(mesh.normals)) {
    expect(length).toBeGreaterThan(0.9);
    expect(length).toBeLessThan(1.1);
  }
}

describe('golden maple leaf silhouette', () => {
  it('is a symmetric Canadian maple leaf with defined lobes and a stem', () => {
    const outline = mapleLeafOutline();
    expect(outline.length).toBe(26);

    // Symmetric about x = 0: every point has a mirrored partner.
    for (const [x, y] of outline) {
      const hasMirror = outline.some(
        ([otherX, otherY]) => Math.abs(otherX + x) < 1e-9 && Math.abs(otherY - y) < 1e-9,
      );
      expect(hasMirror).toBe(true);
    }

    const ys = outline.map(([, y]) => y);
    const xs = outline.map(([x]) => x);
    // Apex above, stem below, widest lobes around +/-0.62.
    expect(Math.max(...ys)).toBeCloseTo(0.905, 3);
    expect(Math.min(...ys)).toBeCloseTo(-0.782, 3);
    expect(Math.max(...xs)).toBeCloseTo(0.622, 3);
    expect(Math.min(...xs)).toBeCloseTo(-0.622, 3);

    // Counter-clockwise winding, so the shared shader's two-sided lighting sees
    // a consistent front face.
    expect(polygonArea(outline)).toBeGreaterThan(0);
  });

  it('triangulates the silhouette without losing area', () => {
    const outline = mapleLeafOutline();
    const triangles = triangulatePolygon(outline);
    expect(triangles.length % 3).toBe(0);
    expect(triangles.length).toBe((outline.length - 2) * 3);

    let triangulated = 0;
    for (let index = 0; index < triangles.length; index += 3) {
      const a = outline[triangles[index]];
      const b = outline[triangles[index + 1]];
      const c = outline[triangles[index + 2]];
      triangulated += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
    }
    expect(triangulated).toBeCloseTo(polygonArea(outline), 6);
  });

  it('builds an extruded, bevelled ornament rather than a flat card', () => {
    const mesh = buildMapleLeafGeometry({ thickness: 0.1, bevel: 0.05, dome: 0.028 });
    assertWellFormedMesh(mesh);

    const zs = [];
    for (let index = 2; index < mesh.positions.length; index += 3) zs.push(mesh.positions[index]);
    // Real thickness: the ornament has a front face, an edge and a back face.
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(0.05);
    expect(Math.max(...zs)).toBeGreaterThan(0);
    expect(Math.min(...zs)).toBeLessThan(0);
  });
});

describe('medallion construction', () => {
  it('describes a layered profile from the coin wall to the enamel well', () => {
    expect(MEDALLION_PROFILE.length).toBeGreaterThanOrEqual(10);
    const radii = MEDALLION_PROFILE.map((ring) => ring.r);
    expect(radii[0]).toBeCloseTo(1, 5);
    // The profile runs monotonically inwards, so the lathe never folds over.
    for (let index = 1; index < radii.length; index += 1) {
      expect(radii[index]).toBeLessThanOrEqual(radii[index - 1] + 1e-9);
    }
    // Both metal and enamel albedos exist: the centre is not one flat colour.
    const distinct = new Set(MEDALLION_PROFILE.map((ring) => ring.albedo.join(',')));
    expect(distinct.size).toBeGreaterThan(1);
    // At least one milled ring, which is what catches the sweep highlight.
    expect(MEDALLION_PROFILE.some((ring) => ring.modulate)).toBe(true);
  });

  it('builds a well-formed lit mesh at every quality level', () => {
    for (const segments of [128, 160, 192]) {
      const mesh = buildMedallionGeometry({ segments });
      assertWellFormedMesh(mesh);
      // The coin has visible relief, not a flat disc.
      const zs = [];
      for (let index = 2; index < mesh.positions.length; index += 3) zs.push(mesh.positions[index]);
      expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(0.05);
    }
  });
});

describe('shared effect camera', () => {
  it('turns a depth multiplier into a monotonic screen scale', () => {
    expect(depthScale(0.3)).toBeLessThan(depthScale(1));
    expect(depthScale(1)).toBeLessThan(depthScale(1.7));
    expect(depthDistance(1)).toBe(EFFECT_CAMERA.baseDepth);
    expect(depthScale(1)).toBeCloseTo(EFFECT_CAMERA.focal / EFFECT_CAMERA.baseDepth, 6);
    // Depth is clamped so an out-of-range author cannot divide by zero.
    expect(Number.isFinite(depthScale(0))).toBe(true);
    expect(Number.isFinite(depthScale(99))).toBe(true);
    expect(depthScale(99)).toBe(depthScale(EFFECT_CAMERA.maxDepth));
  });

  it('composes translation, rotation and scale without aliasing the output', () => {
    const matrix = composeTrs({ x: 3, y: -2, z: -1200, rotationX: 0.25, rotationY: 0.4, scale: 2 });
    expect(matrix[12]).toBeCloseTo(3, 6);
    expect(matrix[13]).toBeCloseTo(-2, 6);
    expect(matrix[14]).toBeCloseTo(-1200, 6);
    // Every basis column keeps the full scale length: the composition is rigid.
    for (let column = 0; column < 3; column += 1) {
      expect(
        Math.hypot(matrix[column * 4], matrix[column * 4 + 1], matrix[column * 4 + 2]),
      ).toBeCloseTo(2, 5);
    }
  });

  it('projects the frame centre to the origin under the ornament camera', () => {
    const projection = orthographicMat4(-400, 400, -300, 300, -1000, 1000);
    expect(projection[0]).toBeCloseTo(2 / 800, 6);
    expect(projection[5]).toBeCloseTo(2 / 600, 6);
    expect(projection[12]).toBeCloseTo(0, 6);
    expect(projection[13]).toBeCloseTo(0, 6);
  });

  it('builds an orthonormal normal matrix for a rotated, scaled mesh', () => {
    const matrix = composeTrs({ rotationX: 0.3, rotationY: 0.8, scale: 1.5 });
    const normalMatrix = normalMatrixFromMat4(matrix);
    expect(normalMatrix.length).toBe(9);
    // Uniform scale must not change the normals' length.
    for (let column = 0; column < 3; column += 1) {
      const length = Math.hypot(
        normalMatrix[column * 3],
        normalMatrix[column * 3 + 1],
        normalMatrix[column * 3 + 2],
      );
      expect(length).toBeCloseTo(1, 5);
    }

    // A face normal must be transformed by the rotation and not by the scale.
    const reference = composeTrs({ rotationX: 0.3, rotationY: 0.8, scale: 1 });
    const normal = [0, 0, 1];
    const transformed = [
      normalMatrix[0] * normal[0] + normalMatrix[3] * normal[1] + normalMatrix[6] * normal[2],
      normalMatrix[1] * normal[0] + normalMatrix[4] * normal[1] + normalMatrix[7] * normal[2],
      normalMatrix[2] * normal[0] + normalMatrix[5] * normal[1] + normalMatrix[8] * normal[2],
    ];
    const expected = [reference[8], reference[9], reference[10]];
    for (let axis = 0; axis < 3; axis += 1) {
      expect(transformed[axis]).toBeCloseTo(expected[axis], 5);
    }
  });
});

describe('shared scene-light bus', () => {
  it('keeps a bounded set of lights and clears cleanly', () => {
    clearSceneLights();
    expect(getSceneLights().count).toBe(0);
    expect(MAX_SCENE_LIGHTS).toBe(4);

    // The stage sorts by strength before publishing; the bus itself keeps the
    // first four so the shader's fixed light array is never exceeded.
    publishSceneLights([
      { x: 10, y: 20, radius: 200, intensity: 0.9, color: [1, 0, 0] },
      { x: 30, y: 40, radius: 200, intensity: 0.7, color: [0, 1, 0] },
      { x: 50, y: 60, radius: 200, intensity: 0.4, color: [0, 0, 1] },
      { x: 70, y: 80, radius: 200, intensity: 0.2, color: [1, 1, 0] },
      { x: 90, y: 100, radius: 200, intensity: 0.1, color: [1, 0, 1] },
      { x: 110, y: 120, radius: 200, intensity: 0.05, color: [0, 1, 1] },
    ]);

    const lights = getSceneLights();
    expect(lights.count).toBe(MAX_SCENE_LIGHTS);
    expect(Array.from(lights.intensity)).toEqual([
      expect.closeTo(0.9, 5),
      expect.closeTo(0.7, 5),
      expect.closeTo(0.4, 5),
      expect.closeTo(0.2, 5),
    ]);
    expect(lights.x[0]).toBe(10);
    expect(lights.red[0]).toBe(1);
    expect(lights.green[0]).toBe(0);
    expect(lights.version).toBeGreaterThan(0);

    clearSceneLights();
    expect(getSceneLights().count).toBe(0);
  });

  it('reports a lift that falls off with distance', () => {
    clearSceneLights();
    publishSceneLights([
      { x: 100, y: 100, radius: 300, intensity: 1, color: [1, 1, 1] },
    ]);
    const near = sampleSceneLightLift(100, 100);
    const mid = sampleSceneLightLift(100, 260);
    const far = sampleSceneLightLift(100, 900);
    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThanOrEqual(far);
    expect(near).toBeLessThanOrEqual(1);
    clearSceneLights();
  });
});

describe('ornament and mesh quality budgets', () => {
  it('scales detail with the resolved capability tier', () => {
    const high = resolveRenderQuality({
      deviceMemory: 8,
      hardwareConcurrency: 8,
      viewportWidth: 1280,
      viewportHeight: 800,
      pixelRatio: 1,
    });
    const constrained = resolveRenderQuality({ saveData: true });

    expect(high.tier).toBe('high');
    expect(high.meshSegments).toBeGreaterThan(constrained.meshSegments);
    expect(high.ornament.far).toBeGreaterThan(constrained.ornament.far);
    expect(high.ornament.near).toBeGreaterThan(0);
    // A constrained device never pays for the foreground leaf layer.
    expect(constrained.ornament.near).toBe(0);
    expect(constrained.foreground).toBe(false);
    expect(constrained.haze).toBe(false);
  });
});

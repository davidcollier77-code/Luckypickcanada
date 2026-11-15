/**
 * Procedural geometry for the Lucky Meter's dimensional objects.
 *
 * Two shapes are authored here rather than modelled as assets:
 *
 *   - The medallion: a solid coin with an outer wall, a milled rim, a flat top
 *     annulus, a chamfer, a recessed step, a raised inner bezel and a gently
 *     domed enamel well. Per-vertex albedo separates polished gold from enamel,
 *     so the whole object is one buffer and one draw call.
 *   - The Canadian maple leaf: an explicit eleven-point silhouette, ear-clipped,
 *     extruded, bevelled on both faces and domed, so it reads as stamped sheet
 *     metal with a real edge rather than a flat cut-out.
 *
 * Every builder is a pure function returning plain arrays. No GPU object is
 * created here, which keeps the shapes unit-testable without a graphics context.
 */

/** Signed area of a polygon in the XY plane. Positive means counter-clockwise. */
export function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function cross2(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pointInTriangle(point, a, b, c) {
  const d1 = cross2(a, b, point);
  const d2 = cross2(b, c, point);
  const d3 = cross2(c, a, point);
  const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNegative && hasPositive);
}

/**
 * Ear clipping for a simple polygon.
 *
 * Returns a flat index list of triangles referencing the input point order. The
 * outline of a maple leaf has deep concave notches and a narrow stem, so the
 * loop skips any candidate ear that still contains another vertex and falls back
 * to the first convex vertex if a degenerate configuration blocks progress.
 * That keeps a malformed input from looping forever without silently dropping
 * the shape.
 *
 * @param {Array<[number, number]>} points
 * @returns {number[]} Triangle indices.
 */
export function triangulatePolygon(points) {
  const count = points.length;
  if (count < 3) return [];

  const remaining = points.map((_, index) => index);
  // Work counter-clockwise so "convex" has one meaning.
  if (polygonArea(points) < 0) remaining.reverse();

  const triangles = [];
  let guard = 0;
  const guardLimit = count * count * 2;

  while (remaining.length > 3 && guard < guardLimit) {
    guard += 1;
    let clipped = false;

    for (let cursor = 0; cursor < remaining.length; cursor += 1) {
      const previousIndex = remaining[(cursor - 1 + remaining.length) % remaining.length];
      const currentIndex = remaining[cursor];
      const nextIndex = remaining[(cursor + 1) % remaining.length];
      const a = points[previousIndex];
      const b = points[currentIndex];
      const c = points[nextIndex];

      if (cross2(a, b, c) <= 0) continue;

      let containsOther = false;
      for (const candidate of remaining) {
        if (candidate === previousIndex || candidate === currentIndex || candidate === nextIndex) {
          continue;
        }
        if (pointInTriangle(points[candidate], a, b, c)) {
          containsOther = true;
          break;
        }
      }
      if (containsOther) continue;

      triangles.push(previousIndex, currentIndex, nextIndex);
      remaining.splice(cursor, 1);
      clipped = true;
      break;
    }

    if (!clipped) {
      // No valid ear: clip the first convex vertex so the walk terminates with a
      // usable surface instead of returning nothing.
      for (let cursor = 0; cursor < remaining.length; cursor += 1) {
        const previousIndex = remaining[(cursor - 1 + remaining.length) % remaining.length];
        const currentIndex = remaining[cursor];
        const nextIndex = remaining[(cursor + 1) % remaining.length];
        if (cross2(points[previousIndex], points[currentIndex], points[nextIndex]) > 0) {
          triangles.push(previousIndex, currentIndex, nextIndex);
          remaining.splice(cursor, 1);
          clipped = true;
          break;
        }
      }
      if (!clipped) break;
    }
  }

  if (remaining.length === 3) {
    triangles.push(remaining[0], remaining[1], remaining[2]);
  }
  return triangles;
}

/** Scales a polygon toward its centroid, which bevels without self-intersecting. */
function scalePolygon(points, factor) {
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point[0];
    sumY += point[1];
  }
  const centreX = sumX / points.length;
  const centreY = sumY / points.length;
  return points.map((point) => [
    centreX + (point[0] - centreX) * factor,
    centreY + (point[1] - centreY) * factor,
  ]);
}

/**
 * The Canadian maple leaf silhouette: eleven points, defined lobes, a stem.
 *
 * Coordinates are unit-space with +Y up, symmetric about x = 0 and scaled so the
 * widest lobes sit near ±0.62. The right half is authored explicitly and then
 * mirrored so the silhouette stays exactly symmetrical, which is what makes the
 * leaf read as the maple leaf rather than a generic starburst.
 *
 * @returns {Array<[number, number]>} Counter-clockwise outline.
 */
export function mapleLeafOutline() {
  const rightHalf = [
    [0.0, 0.905], // apex
    // Valleys stay shallow relative to the tips: deep notches turn the leaf
    // into a star at the small sizes it is actually drawn at.
    [0.105, 0.615], // valley below the apex
    [0.212, 0.688], // upper lobe tip
    [0.205, 0.492], // valley
    [0.352, 0.47], // middle lobe tip
    [0.338, 0.302], // valley
    [0.622, 0.3], // widest outer lobe tip
    [0.425, 0.118], // valley
    [0.472, -0.128], // lower lobe tip
    [0.245, -0.104], // valley
    [0.268, -0.372], // base point
    [0.07, -0.332], // stem shoulder
    [0.058, -0.762], // stem right
    [0.0, -0.782], // stem bottom
  ];

  const outline = [...rightHalf];
  // Mirror everything strictly below the apex, from the stem bottom back up to
  // (but excluding) the apex itself.
  for (let index = rightHalf.length - 2; index >= 1; index -= 1) {
    const point = rightHalf[index];
    outline.push([-point[0], point[1]]);
  }

  return polygonArea(outline) < 0 ? outline.reverse() : outline;
}

/**
 * Extrudes the maple-leaf silhouette into a bevelled, domed ornament.
 *
 * The front and back faces share one bevel profile: a full-size edge ring at the
 * mid-thickness, two progressively smaller and higher rings, then a plateau.
 * Each band owns its own vertices so normals break at the crease, which is what
 * gives the ornament a crisp bevelled edge instead of a soft blob.
 *
 * @param {{ thickness?: number, bevel?: number, dome?: number, size?: number }} [options]
 * @returns {{ positions: Float32Array, normals: Float32Array, albedos: Float32Array, indices: Uint16Array }}
 */
export function buildMapleLeafGeometry({
  thickness = 0.1,
  bevel = 0.055,
  dome = 0.035,
  size = 1,
} = {}) {
  const outline = mapleLeafOutline();
  const halfThickness = Math.max(0.004, thickness / 2);
  const bevelDepth = Math.min(halfThickness * 0.92, Math.max(0.004, bevel));

  // One shared gold albedo: the material is uniform, the shading supplies the
  // variation. Slight warm bias keeps the leaf on the same metal as the ring.
  const albedo = [0.92, 0.7, 0.3];

  const positions = [];
  const normals = [];
  const albedos = [];
  const indices = [];

  const pushVertex = (x, y, z, nx, ny, nz) => {
    positions.push(x * size, y * size, z * size);
    normals.push(nx, ny, nz);
    albedos.push(albedo[0], albedo[1], albedo[2]);
    return positions.length / 3 - 1;
  };

  // Accumulate a triangle's face normal into a band-local vertex range.
  const addTriangle = (a, b, c) => {
    indices.push(a, b, c);
  };

  const normalise = (vector) => {
    const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
    return [vector[0] / length, vector[1] / length, vector[2] / length];
  };

  /**
   * Builds one surface from a centre point out to a ring, with a per-vertex
   * offset applied along +Z. Normals come from accumulated face normals inside
   * this call only, so neighbouring bands stay creased.
   */
  const buildCap = (ring, zAt, direction) => {
    const base = positions.length / 3;
    const vertexNormals = [];

    for (const point of ring) {
      const radius = Math.hypot(point[0], point[1]);
      const lift = direction * dome * Math.max(0, 1 - (radius / 0.62) ** 2);
      const index = pushVertex(point[0], point[1], zAt + lift, 0, 0, direction);
      vertexNormals.push(index);
    }

    const centreIndex = pushVertex(0, 0, zAt + direction * dome, 0, 0, direction);
    const ringIndices = vertexNormals;

    const accumulator = new Map();
    const accumulate = (index, normal) => {
      const current = accumulator.get(index) || [0, 0, 0];
      accumulator.set(index, [
        current[0] + normal[0],
        current[1] + normal[1],
        current[2] + normal[2],
      ]);
    };

    for (let index = 0; index < ringIndices.length; index += 1) {
      const current = ringIndices[index];
      const next = ringIndices[(index + 1) % ringIndices.length];
      addTriangle(centreIndex, current, next);

      const ax = positions[current * 3];
      const ay = positions[current * 3 + 1];
      const az = positions[current * 3 + 2];
      const bx = positions[next * 3];
      const by = positions[next * 3 + 1];
      const bz = positions[next * 3 + 2];
      const cx = 0;
      const cy = 0;
      const cz = positions[centreIndex * 3 + 2];

      const edge1 = [bx - ax, by - ay, bz - az];
      const edge2 = [cx - ax, cy - ay, cz - az];
      const face = normalise([
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0],
      ]);
      accumulate(current, face);
      accumulate(next, face);
      accumulate(centreIndex, face);
    }

    for (const [index, normal] of accumulator) {
      const unit = normalise(normal);
      normals[index * 3] = unit[0];
      normals[index * 3 + 1] = unit[1];
      normals[index * 3 + 2] = unit[2];
    }

    return { base, ring: ringIndices, centre: centreIndex };
  };

  /** Builds a strip between two rings, with its own duplicated vertices. */
  const buildBand = (innerRing, innerZ, outerRing, outerZ, innerNormal, outerNormal) => {
    const inner = innerRing.map((point) =>
      pushVertex(point[0], point[1], innerZ, innerNormal[0], innerNormal[1], innerNormal[2]),
    );
    const outer = outerRing.map((point) =>
      pushVertex(point[0], point[1], outerZ, outerNormal[0], outerNormal[1], outerNormal[2]),
    );

    for (let index = 0; index < inner.length; index += 1) {
      const next = (index + 1) % inner.length;
      addTriangle(inner[index], outer[index], outer[next]);
      addTriangle(inner[index], outer[next], inner[next]);
    }
  };

  const plateauScale = 0.855;
  const midScale = 0.935;
  const shoulderScale = 0.98;

  const plateau = scalePolygon(outline, plateauScale);
  const shoulder = scalePolygon(outline, midScale);
  const mid = scalePolygon(outline, shoulderScale);

  // Normal for a bevel sloping outward and downward, and for the vertical rim.
  const bevelNormal = normalise([0.62, 0.08, 0.78]);
  const shoulderNormal = normalise([0.34, 0.04, 0.94]);
  const rimNormal = normalise([1, 0.12, 0]);

  for (const direction of [1, -1]) {
    const plateauZ = direction * halfThickness;
    const shoulderZ = direction * (halfThickness - bevelDepth * 0.34);
    const midZ = direction * (halfThickness - bevelDepth * 0.72);
    const edgeZ = direction * (halfThickness - bevelDepth);

    buildCap(plateau, plateauZ, direction);
    buildBand(
      shoulder,
      shoulderZ,
      plateau,
      plateauZ,
      [shoulderNormal[0] * direction, shoulderNormal[1], shoulderNormal[2] * direction],
      [bevelNormal[0] * direction, bevelNormal[1], bevelNormal[2] * direction],
    );
    buildBand(
      mid,
      midZ,
      shoulder,
      shoulderZ,
      [bevelNormal[0] * direction, bevelNormal[1], bevelNormal[2] * direction],
      [shoulderNormal[0] * direction, shoulderNormal[1], shoulderNormal[2] * direction],
    );
    buildBand(
      outline,
      edgeZ,
      mid,
      midZ,
      [rimNormal[0] * direction, rimNormal[1], 0],
      [bevelNormal[0] * direction, bevelNormal[1], bevelNormal[2] * direction],
    );
  }

  // The extruded edge itself, connecting the two bevel rims.
  const edgeZ = halfThickness - bevelDepth;
  buildBand(
    outline,
    -edgeZ,
    outline,
    edgeZ,
    [rimNormal[0], rimNormal[1], 0],
    [rimNormal[0], rimNormal[1], 0],
  );

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    albedos: new Float32Array(albedos),
    indices: new Uint16Array(indices),
  };
}

/**
 * The medallion's radial construction, from the outer edge inwards.
 *
 * `modulate` adds a milled coin-edge ripple to a ring: `r + amplitude *
 * cos(frequency * theta)`. Values are in local units where the outer edge is
 * radius 1, so the consumer scales the whole object to the meter's box.
 */
export const MEDALLION_PROFILE = Object.freeze([
  // Outer wall of the coin, seen at grazing angles.
  { r: 1.0, z: -0.02, albedo: [0.66, 0.45, 0.15] },
  { r: 1.0, z: 0.085, albedo: [0.8, 0.58, 0.22] },
  // Milled rim: the coin edge, rippled radially. The frequency has to stay far
  // enough below the lathe's segment count that the ripple reads as milling and
  // not as a jagged sawtooth after rasterising.
  { r: 1.0, z: 0.145, albedo: [0.92, 0.72, 0.34], modulate: { amplitude: 0.014, frequency: 24 } },
  // Flat top annulus of the rim.
  { r: 0.955, z: 0.16, albedo: [1.0, 0.84, 0.45] },
  // Chamfer down toward the bezel.
  { r: 0.925, z: 0.118, albedo: [0.9, 0.68, 0.28] },
  // Thin recess wall.
  { r: 0.918, z: 0.06, albedo: [0.5, 0.33, 0.1] },
  // Raised inner bezel.
  { r: 0.9, z: 0.088, albedo: [1.0, 0.86, 0.5] },
  { r: 0.878, z: 0.094, albedo: [1.0, 0.88, 0.54] },
  // Step into the enamel well.
  { r: 0.872, z: 0.048, albedo: [0.36, 0.24, 0.08] },
  // Enamel well wall and floor.
  { r: 0.862, z: 0.03, albedo: [0.09, 0.07, 0.05] },
  { r: 0.856, z: 0.006, albedo: [0.075, 0.06, 0.045] },
  { r: 0.5, z: 0.012, albedo: [0.055, 0.045, 0.035] },
  { r: 0.0, z: 0.016, albedo: [0.05, 0.041, 0.032] },
]);

/**
 * Revolves `MEDALLION_PROFILE` into a closed, lit coin.
 *
 * Bands are generated between consecutive profile rings; each band owns two
 * rings of duplicated vertices so creases stay sharp. A ring at radius 0 closes
 * the centre with a triangle fan. Normals are derived analytically from the
 * profile direction, which is exact for a surface of revolution and avoids a
 * second pass over the triangles.
 *
 * @param {{ segments?: number }} [options]
 * @returns {{ positions: Float32Array, normals: Float32Array, albedos: Float32Array, indices: Uint16Array }}
 */
export function buildMedallionGeometry({ segments = 192 } = {}) {
  const rings = MEDALLION_PROFILE;
  const positions = [];
  const normals = [];
  const albedos = [];
  const indices = [];

  const effectiveRadius = (ring, theta) => {
    if (!ring.modulate) return ring.r;
    return ring.r + ring.modulate.amplitude * Math.cos(ring.modulate.frequency * theta);
  };

  const pushVertex = (x, y, z, nx, ny, nz, albedo) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    albedos.push(albedo[0], albedo[1], albedo[2]);
    return positions.length / 3 - 1;
  };

  for (let index = 0; index < rings.length - 1; index += 1) {
    const inner = rings[index + 1];
    const outer = rings[index];

    const dRadius = inner.r - outer.r;
    const dZ = inner.z - outer.z;
    const length = Math.hypot(dRadius, dZ) || 1;
    // Outward normal in the (radius, z) plane, rotated from the profile tangent.
    const radialComponent = dZ / length;
    const axialComponent = -dRadius / length;

    if (inner.r === 0) {
      // Close the centre with a fan from the axis, using the same analytic
      // normal as the final band so the well floor stays flat-shaded.
      const centreIndex = pushVertex(0, 0, inner.z, 0, 0, 1, inner.albedo);
      const ringIndices = [];
      for (let step = 0; step < segments; step += 1) {
        const theta = (step / segments) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const radius = effectiveRadius(outer, theta);
        ringIndices.push(
          pushVertex(
            cos * radius,
            sin * radius,
            outer.z,
            cos * radialComponent,
            sin * radialComponent,
            axialComponent,
            outer.albedo,
          ),
        );
      }
      for (let step = 0; step < segments; step += 1) {
        const current = ringIndices[step];
        const next = ringIndices[(step + 1) % segments];
        indices.push(centreIndex, current, next);
      }
      continue;
    }

    const outerIndices = [];
    const innerIndices = [];
    // One duplicated seam vertex keeps the strip closed without sharing an
    // index across the wrap, which would twist the last quad.
    for (let step = 0; step <= segments; step += 1) {
      const theta = (step / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const outerRadius = effectiveRadius(outer, theta);
      outerIndices.push(
        pushVertex(
          cos * outerRadius,
          sin * outerRadius,
          outer.z,
          cos * radialComponent,
          sin * radialComponent,
          axialComponent,
          outer.albedo,
        ),
      );
    }
    for (let step = 0; step <= segments; step += 1) {
      const theta = (step / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const innerRadius = effectiveRadius(inner, theta);
      innerIndices.push(
        pushVertex(
          cos * innerRadius,
          sin * innerRadius,
          inner.z,
          cos * radialComponent,
          sin * radialComponent,
          axialComponent,
          inner.albedo,
        ),
      );
    }

    for (let step = 0; step < segments; step += 1) {
      const outerCurrent = outerIndices[step];
      const outerNext = outerIndices[step + 1];
      const innerCurrent = innerIndices[step];
      const innerNext = innerIndices[step + 1];
      indices.push(outerCurrent, innerCurrent, innerNext);
      indices.push(outerCurrent, innerNext, outerNext);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    albedos: new Float32Array(albedos),
    indices: new Uint16Array(indices),
  };
}

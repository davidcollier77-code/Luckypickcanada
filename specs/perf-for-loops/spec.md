# Feature Specification: Preserve Canvas Rendering During Loop Optimization

**Feature branch**: `⚡-bolt-optimize-draw-branch-1847433249078896432`  
**Task group**: troubleshooting  
**Status**: Repair implementation in review

## User Scenarios & Testing

### User Story 1 — Preserve Lucky Meter particle trails (Priority: P1)

As a visitor using the Lucky Meter experience, I need meteor, rocket, spark and lightning trails to render as before so the performance refactor does not remove or duplicate visual effects.

**Why this priority**: Visible trail rendering is core behavior of the animation. A loop optimization that builds paths without stroking them is a functional regression.

**Independent Test**: Exercise the affected canvas animation paths and verify that each non-empty path receives its original ordered drawing commands and a stroke.

**Acceptance Scenarios**:

1. **Given** a meteor with a non-empty trail, **when** its animation frame is drawn, **then** each trail point is processed once in order and the path is stroked before the meteor glow is drawn.
2. **Given** a spark with more than one trail point, **when** its animation frame is drawn, **then** the first point uses `moveTo`, remaining points use `lineTo`, and the path is stroked exactly once.
3. **Given** an empty or single-point spark trail, **when** its animation frame is drawn, **then** no invalid point access occurs and the animation continues.
4. **Given** rocket and lightning paths, **when** their frame is drawn, **then** their existing ordering and stroke operations remain intact.

## Edge Cases

- Empty meteor trails must not dereference a missing first element.
- Spark trails are drawn only when their length is greater than one.
- The meteor trail fade must remain gradient-based; do not retain per-point alpha metadata that is never read.
- A path must be stroked after its path commands and before later drawing operations begin a new path.

## Requirements

### Functional Requirements

- **FR-001**: The meteor trail loop MUST process every trail point once, in array order, without storing unused per-point alpha values.
- **FR-002**: The meteor trail MUST call `ctx.stroke()` after path construction.
- **FR-003**: The spark trail MUST retain its `length > 1` guard, process each point once, and call `ctx.stroke()` once.
- **FR-004**: Rocket and lightning rendering MUST preserve their existing drawing order and stroke calls.
- **FR-005**: The change MUST NOT alter canvas artwork, colors, timing, particle physics, layout, audio, or other Lucky Pick Canada behavior.
- **FR-006**: The loop refactor MUST NOT claim a real-device or PageSpeed improvement based solely on a synthetic micro-benchmark.

## Success Criteria

- **SC-001**: TypeScript compilation succeeds with no syntax errors.
- **SC-002**: The full unit-test suite passes.
- **SC-003**: Browser visual-regression tests covering the repository's committed baselines pass.
- **SC-004**: The production and OpenNext build checks pass, and the measured `.next + public` output remains below the 495 MiB hard cap.
- **SC-005**: All trail paths retain a single path-construction pass followed by the required stroke operation.

## Scope Boundaries

Only canvas path construction affected by the loop refactor is in scope. No new animation, visual redesign, performance instrumentation, dependencies, or unrelated cleanup is included.

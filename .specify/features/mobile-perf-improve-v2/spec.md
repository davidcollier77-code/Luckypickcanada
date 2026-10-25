# Feature Specification: Mobile Performance Improvements

**Feature Branch**: task-mobile-perf-improve-v3

**Created**: 2026-10-25

**Status**: Implementation candidate; current-head verification pending

**Input**: User reports need to safely improve LuckyPickCanada's mobile website performance without compromising desktop performance or visual fidelity.

## Requirements

### Functional Requirements

- **FR-001**: Replace the `1784889264858.png` image on the homepage with a `<picture>` element using AVIF and WebP sources.
- **FR-002**: Remove the unconfigured `quality={85}` prop from the `/map-logo-small.png` `Image` component.
- **FR-003**: Maintain identical visual layout and animations.
- **FR-004**: Preserve current build constraints (<495 MB).

## Success Criteria

- **SC-001**: The Playwright visual regression suite passes.
- **SC-002**: No hydration warnings or mismatches are present on the homepage.
- **SC-003**: The `pnpm run build` step produces no unconfigured quality warnings for the map logo.

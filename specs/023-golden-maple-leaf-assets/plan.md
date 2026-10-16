# Implementation Plan: Premium Golden Maple-Leaf Assets

**Branch**: `polish/crystal-ball-golden-leaf-assets` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/023-golden-maple-leaf-assets/spec.md`

## Summary

Replace the Crystal Ball's always-inline SVG leaf rendering with one polished, transparent leaf image delivered in AVIF → WebP → SVG fallback order. Keep the existing component API so the text cursor and falling animation reuse the same asset without changes to the reveal state machine.

## Technical Context

**Language/Version**: TypeScript / React, Node.js 22.x  
**Primary Dependencies**: Next.js 16.3.8, React (package.json declares `latest`), Playwright `^1.63.0`; no dependency changes  
**Storage**: Static files in `public/assets/`; no persistent data  
**Testing**: `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`, `./jules-verify.sh`, remote OpenNext/Cloudflare build checks  
**Target Platform**: Next.js App Router deployed with OpenNext on Cloudflare  
**Project Type**: Web application  
**Performance Goals**: Keep the two modern raster assets compact for a cursor-sized image; preserve alpha transparency  
**Constraints**: Preserve the existing visual page/background, animation behavior, reduced motion, keyboard behavior, and 495 MB build cap  
**Scale/Scope**: One shared leaf component, three static asset formats, and one interaction regression test

## Constitution Check

- **Single source of truth**: GoldenLeaf remains the shared component for both uses.
- **Verify before acting**: Inspected the component, CSS, interaction test, existing main artwork fallbacks, active feature pointer, and repo configuration before implementation.
- **Protect core systems**: No API, payment, security, database, deployment configuration, or environment changes.
- **Resource conservation**: No new dependencies; small static raster assets.
- **Approval**: Owner explicitly authorized implementation.

## Design

1. Add transparent `golden-maple-leaf.avif` and `golden-maple-leaf.webp`, plus a styled `golden-maple-leaf.svg` fallback.
2. Make `GoldenLeaf.tsx` render a semantic-hidden `picture` element with AVIF, WebP, then SVG fallback, retaining the existing className/style interface.
3. Keep the CSS animation classes and adjust only the display mode needed for a picture-based cursor.
4. Extend the existing Playwright interaction test to validate flight and cursor source order, fallback, and actual image loading.
5. Complete Spec Kit artifacts, run all available repository/CI checks, inspect the final diff, and report any checks that cannot run from the API-only environment.

## Validation Plan

- Check each static asset's format, dimensions, transparency, and byte size locally.
- Run the Crystal Ball interaction Playwright test.
- Run `./jules-verify.sh` and the project build in the repository CI environment.
- Inspect the pull request's OpenNext/Cloudflare validation and build-size evidence before merge.
- Verify no changes outside the explicitly listed paths.

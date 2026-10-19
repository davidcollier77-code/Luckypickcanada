# Implementation Plan: Restore Shared Sky Backgrounds

**Branch**: fix/restore-shared-sky-backgrounds-1534 | **Date**: 2026-10-19 | **Spec**: .specify/features/restore-shared-sky-backgrounds/spec.md

## Summary

The latest performance change moved the default theme import out of app/layout.js and placed it after Tailwind's import inside app/globals.css. The theme stylesheet contains the shared .homepage-sky-backdrop and route-transparency rules. Since the visual regression appeared after the import change, restore the exact prior import placement and add a route-level computed-style regression check. Do not alter the background image or any component visuals.

## Technical Context

- **Language/Version**: CSS, JavaScript, TypeScript-based Playwright test; Node.js 22.
- **Primary Dependencies**: Next.js 16.3.8, Tailwind CSS 4.2.4, Playwright / playwright-chromium 1.63.x.
- **Storage**: None.
- **Testing**: pnpm exec playwright test tests/visual/homepage.spec.ts; full pnpm run test; pnpm tsc --noEmit; ./jules-verify.sh; production/OpenNext build with measured .next + public size.
- **Target Platform**: Next.js App Router on Cloudflare Workers using OpenNext.
- **Project Type**: Web application / shared global CSS.
- **Performance Goals**: Restore known-good style ordering without changing image delivery, artwork, or runtime interaction behavior.
- **Constraints**: 495 MiB hard build-size maximum; use pnpm; no application redesign or asset changes.
- **Scale/Scope**: app/layout.js, app/globals.css, one Playwright spec, Spec Kit/Memory Bank/PR-summary records.

## Constitution Check

- Verify before acting: inspected the merged performance change, current CSS imports, shared backdrop rules, homepage and route markup, and existing Playwright workflow.
- Protected visuals: the user reported this regression and authorized repair by reporting the issue; preserve existing artwork and intended night-sky background.
- Smallest scoped change: revert only the import-consolidation source edits that changed theme load ordering, and add a regression test.
- Evidence discipline: the local shell cannot resolve GitHub; local tests and governance scripts are not claimed. The PR's normal current-head CI must provide evidence.
- Build-size safety: no dependencies/assets added; CI must still prove the explicit 495 MiB gate.

## Design Decisions

1. Restore import '../themes/default/index.css' in app/layout.js before import './globals.css', matching the known-good ordering before PR #1532.
2. Remove @import "../themes/default/index.css"; from app/globals.css rather than importing the theme twice.
3. Add a Playwright test that visits /, /crystal-ball, and /map and checks the shared sky image, stacking, transparency, and fallback-foundation visibility.
4. Keep the actual CSS artwork/backdrop rules, image assets, section components, page copy, Lucky Meter, and Card Reveal untouched.

## Project Structure

- app/layout.js: restore theme-first global stylesheet import.
- app/globals.css: remove the duplicate theme import.
- tests/visual/homepage.spec.ts: cover shared backdrop computed styles across affected routes.
- .specify/features/restore-shared-sky-backgrounds/: task specification and verification guide.

## Verification Gate

Do not describe this fix as verified until current-head Playwright, the required governance gate, full tests/TypeScript, OpenNext validation, and measured build-size gate complete. If any visual assertion fails, inspect the trace/screenshot and correct the cause without changing unrelated section artwork.

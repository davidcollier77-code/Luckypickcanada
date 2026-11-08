# Implementation Plan: Community Stories Map Population and Statistics Cleanup

**Branch**: fix/community-stories-map-21-20261108 | **Date**: 2026-11-08 | **Spec**: spec.md

## Summary
Publish the prepared 21 approved community stories from Neon development to production, preserving the original eight records and applying the prepared timestamps. Remove the two redundant statistic cards and retain the all-time total. Keep province grouping, marker interaction, recent filter, and homepage unchanged.

## Technical Context
**Language/Version**: JavaScript / TypeScript, Node.js 22
**Primary Dependencies**: Next.js 16, React 19, @neondatabase/serverless
**Storage**: Neon PostgreSQL, public.lucky_stories
**Testing**: Vitest and Playwright
**Target Platform**: Cloudflare Pages / OpenNext
**Project Type**: Next.js web application
**Performance Goals**: No measurable regression in map loading or interaction
**Constraints**: 495 MB build cap; no homepage changes; no schema changes; no duplicate story IDs/content; PR stays open and unmerged.

## Constitution Check
- Scope is limited to Community Stories map statistics and approved 21-row production population.
- Existing validation, approval state, province parsing, cache behavior and story interactions remain intact.
- Production data write uses a transaction after comparing exact source and target rows.
- Homepage files are explicitly out of scope.

## Research and Decisions
1. Production and development both use public.lucky_stories.
2. Production contains IDs 1–8; development contains IDs 1–21.
3. IDs 1–8 match in display name, location and story text. Only their production timestamps need updating.
4. IDs 9–21 are absent from production and are the 13 rows to insert.
5. Intended recent records: ID 20 (DevLee, Northwest Territories, 2026-11-07 14:30 UTC) and ID 21 (DevMorgan, Nunavut, 2026-11-08 08:15 UTC).
6. Existing province resolver recognizes all 13 Canadian provinces and territories; map aggregates stories under the matching province marker.
7. The current component renders three statistic cards; remove only the two unwanted entries.

## Data Model
No schema change. Existing fields: id, display_name, location, story, approved, created_at. Preserve approved=true. Keep IDs 1–8; add IDs 9–21. Synchronize the serial sequence after explicit-ID inserts.

## Project Structure
- app/lucky-map-of-canada/lucky-map-of-canada.js
- tests/visual/map-marker-interaction.spec.ts
- __tests__/community-stories-statistics.test.js
- specs/116-community-stories-map-population/

## Verification
- Vitest guard: only the all-time statistic remains.
- Playwright: populated fixture verifies the all-time total, absence of redundant cards, all 13 markers and province selection.
- Neon read-back: 21 approved rows, IDs 1–21, expected locations and prepared timestamps; exactly two within rolling 24 hours at verification.
- Run ./freebuff-verify.sh, TypeScript, production build and build-size check.
- Browser QA on the map page at mobile and desktop; homepage untouched.

## Risks and Mitigations
- Duplicate/conflicting production rows: compare existing IDs/content before transaction; use guarded updates and conflict-safe inserts.
- Stale map cache: invalidate story-map KV cache after successful publication if supported; otherwise verify after cache TTL and report.
- Timestamp boundary: record verification time and query NOW() - INTERVAL '24 hours'.

## Complexity Tracking
No constitution violations or additional architectural complexity.

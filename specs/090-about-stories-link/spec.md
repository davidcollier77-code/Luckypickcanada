# Feature Specification: About Section Lucky Stories Link Repair

**Feature Branch**: `090-about-stories-link`

**Created**: 2026-11-04

**Status**: Implemented

**Input**: User description: "Fix the About section link that points to the missing /stories route."

## Baseline findings (verified before changing anything)

- `components/AboutSection.tsx` links the words "Community Lucky Stories section" to `/stories`.
- There is no `/stories` page: `app/` has no `stories` directory, and `app/sitemap.js` does not list one.
- `/stories` is **not** a 404. `next.config.mjs` contains a permanent redirect `source: '/stories'` → `destination: '/map'`,
  so the link currently lands on the Lucky Map — the same destination as the "Canadian Lucky Map" link in the very same sentence.
- The site's actual Lucky Stories content lives on the homepage: `app/homepage/HomePage.js:445` carries `id="community-stories"`
  on the Lucky Stories card, and the homepage hero's own "Lucky Stories" link targets `#community-stories`.
- `components/AboutSection.tsx` is not imported by any route or component in the repository (only its unit test renders it),
  so the repair corrects the link for whenever the section is mounted rather than changing a live page today.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stories link reaches the stories (Priority: P1)

A reader of the About section clicks "Community Lucky Stories section" expecting community stories, and arrives at the
homepage Lucky Stories section instead of the map.

**Why this priority**: The current destination contradicts the link's own wording and duplicates the neighbouring map link,
so the sentence cannot deliver either of the two things it promises.

**Independent Test**: Render `AboutSection` and assert the stories link's `href` is `/#community-stories`; request
`/#community-stories` and confirm the homepage contains `id="community-stories"`.

**Acceptance Scenarios**:

1. **Given** the About section is rendered, **When** the stories link is inspected, **Then** its `href` is `/#community-stories`.
2. **Given** a visitor follows that link from an inner page, **When** the homepage loads, **Then** the Lucky Stories section
   (`id="community-stories"`) exists as the anchor target.
3. **Given** the About section is rendered, **When** every link is inspected, **Then** none points at the redirect-only `/stories` path.

---

### User Story 2 - Everything else in the section is untouched (Priority: P2)

The section's other link ("Canadian Lucky Map" → `/map`), its heading, its wording and its styling stay exactly as they were,
and the existing `/stories` → `/map` redirect keeps serving inbound links from elsewhere.

**Why this priority**: The repair is a single destination correction; unrelated navigation, copy and redirects must not drift.

**Independent Test**: The existing About section tests for the heading, the Lucky Meter link and the map link still pass
unchanged, and `/stories` still answers with a permanent redirect to `/map`.

**Acceptance Scenarios**:

1. **Given** the About section is rendered, **When** the map link is inspected, **Then** its `href` is still `/map`.
2. **Given** a request for `/stories`, **When** the server responds, **Then** it still permanently redirects to `/map`.

### Edge Cases

- The component is currently unmounted, so no live page changes today; the destination is still corrected for future use.
- The `/stories` redirect is intentionally retained: bookmarked or external `/stories` URLs must keep working, and removing
  a configured redirect is outside this request's scope.
- The anchor target sits on `/`, so the link must be absolute-page plus fragment (`/#community-stories`) to work from `/about`.
- No copy, layout, colour, accessibility or responsive behaviour may change.

## Requirements *(mandatory)*

- **FR-001**: The About section's stories link MUST target the homepage Lucky Stories section, i.e. `/#community-stories`.
- **FR-002**: No link rendered by the About section MAY point at `/stories`.
- **FR-003**: The "Canadian Lucky Map" link MUST keep targeting `/map`, and the Lucky Meter link MUST keep targeting `/lucky-meter`.
- **FR-004**: The existing permanent `/stories` → `/map` redirect MUST remain unchanged for inbound URLs.
- **FR-005**: Visible wording, heading, class names and layout MUST be unchanged.
- **FR-006**: The About section unit test MUST assert the corrected destination and the absence of the `/stories` path.

### Key Entities

- Not applicable: no data model, storage or API surface is involved.

## Success Criteria *(mandatory)*

- **SC-001**: `pnpm exec vitest run __tests__/components/AboutSection.test.tsx` passes with an assertion on `/#community-stories`.
- **SC-002**: `./freebuff-verify.sh` passes (Spec Kit gate, typecheck, production build, refresh-docs), with the build under 495 MB.
- **SC-003**: The final diff touches only the component, its test and this feature's artifacts.
- **SC-004**: A served request for `/stories` still redirects permanently to `/map`.

## Assumptions

- "The missing /stories route" is the redirect-only path, and the intended destination for "Community Lucky Stories section"
  is the homepage section headed Lucky Stories (`#community-stories`) — the same destination the hero's Lucky Stories link uses.
- The redirect is configuration-level behaviour already relied on elsewhere, so it is preserved rather than deleted.
- Mounting `AboutSection` on a route is not part of this request.

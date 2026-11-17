# Feature Specification: Remove the Retired Public Theme CSS Mirror

**Feature Branch**: `chore/178-public-theme-css-cleanup`

**Created**: 2026-11-17

**Status**: Implementation complete; verification handoff pending PR checks

**Input**: User-authorized cleanup of the obsolete duplicate stylesheet bundle under `public/themes/default/`, performed without changing the active theme CSS or rendered experience.

## User Scenarios & Testing

### User Story 1 — Keep one authoritative theme stylesheet source (Priority: P1)

As a site maintainer, I need the application and its maintenance guides to point to the active theme CSS source so obsolete public copies cannot be mistaken for the styles currently used by the site.

**Why this priority**: The duplicate public bundle contains stale CSS and a public index stylesheet that imports its sibling files. Keeping an unused mirror creates conflicting sources of truth and makes future maintenance error-prone.

**Independent Test**: Inspect all current application stylesheet imports and rendered production-page stylesheet links. Confirm the application continues to import files from `themes/default/`, while the rendered routes load Next.js-generated CSS bundles and contain no direct links to the retired public theme paths.

**Acceptance Scenarios**:

1. **Given** the application imports its active styles from `themes/default/`, **When** the retired public mirror is removed, **Then** every active stylesheet import target remains present and unchanged.
2. **Given** the homepage, Crystal Ball and map routes render with the existing theme, **When** their production HTML is inspected, **Then** their stylesheets are loaded from Next.js-generated `/_next/static/css/` assets rather than `/themes/default/`.
3. **Given** the maintenance guides describe CSS troubleshooting and deployment, **When** those guides are updated, **Then** they document the current source imports and do not instruct maintainers to recreate or link the retired public mirror.

### Edge Cases

- Removing only `public/themes/default/homepage.css` would leave `public/themes/default/index.css` importing a missing file; remove the entire eight-file public CSS bundle as one unit.
- The repository can establish that no first-party application import or direct link consumes these public paths, but it cannot identify unknown external clients that may have bookmarked or linked the public URLs.
- The active source CSS files must remain unchanged even where the public copies have identical content.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST retain its active stylesheet imports from `themes/default/`.
- **FR-002**: The complete retired `public/themes/default/` CSS bundle MUST be removed together, including its index file and every imported sibling.
- **FR-003**: The current CSS troubleshooting and deployment guides MUST describe the active source imports and generated Next.js CSS bundle paths.
- **FR-004**: No application component, active stylesheet declaration, artwork, interaction, page copy, asset or runtime configuration may be changed by this cleanup.
- **FR-005**: The resulting application MUST remain within the repository's 495 MiB build-output hard limit; no application dependencies or runtime code are added.
- **FR-006**: Verification and CI results MUST be reported only when supported by observed evidence.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All active application stylesheet imports resolve to unchanged files under `themes/default/`.
- **SC-002**: All eight files in `public/themes/default/` are removed, leaving no broken public index import chain.
- **SC-003**: The three current maintenance guides no longer recommend copying, linking or checking the retired public stylesheet directory.
- **SC-004**: Browser inspection of the homepage, Crystal Ball and map confirms the pages reference Next.js-generated CSS assets and no `/themes/default/` stylesheet URL.
- **SC-005**: No app source, active CSS declaration, asset, dependency, Cloudflare configuration or database integration is changed.

## Assumptions

- `themes/default/` is the authoritative source because current application modules import it directly and the root layout imports its `index.css`.
- The public mirror is a legacy static copy; no current first-party page loads its URLs.
- External consumers that directly request the old public URLs cannot be ruled out through repository inspection. This cleanup removes those obsolete public endpoints, as authorized by the repository owner.
- Full application build and automated visual verification are delegated to the normal PR checks because the available local environment does not meet the repository's Node.js and pnpm requirements.

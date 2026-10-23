# Feature Specification: Turnstile Early Script Preload

**Feature Branch**: `fix/turnstile-early-script-preload-20261022`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User reports that the homepage Suggestion Box's Cloudflare Turnstile security check can take about 45 seconds or longer to finish, recalls that loading order previously contributed to the delay, and authorizes a focused repair.

## User Scenarios & Testing

### User Story 1 — Start Turnstile loading earlier (Priority: P1)

A visitor opens the homepage and later reaches the Suggestion Box. The Turnstile API should already have begun loading from the browser's initial homepage response, rather than waiting for client-side widget initialization to request the script.

**Why this priority**: The long wait blocks the Suggestion Box submission and hurts the site's user experience.

**Independent Test**: A Playwright browser test verifies that the homepage response places exactly one preload hint in the document head for the exact API URL used by the installed React Turnstile wrapper. The same hint must not be added globally to unrelated routes.

**Acceptance Scenarios**:

1. **Given** a visitor requests the homepage, **When** the initial document is parsed, **Then** the document head contains one script preload for `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit`.
2. **Given** the widget initializes on the homepage, **When** the React wrapper inserts its API script, **Then** its URL matches the preloaded URL exactly so the browser can reuse the fetched resource.
3. **Given** a visitor opens an unrelated route, **When** its initial document is parsed, **Then** this homepage-specific preload is absent.

### Edge Cases

- The preload URL must retain the wrapper's default onload callback name and explicit-render query parameters; a different query string risks a second request.
- If Cloudflare's managed challenge remains slow after the API script is fetched, this change must not claim to fix that external challenge behavior.
- Turnstile failure, timeout, retry, token expiry, and the disabled-until-verified submit behavior must remain unchanged.

## Requirements

### Functional Requirements

- **FR-001**: The homepage MUST preload the exact Turnstile API URL injected by the repository's pinned `@marsidev/react-turnstile` version.
- **FR-002**: The preload MUST be discoverable in the initial homepage document head.
- **FR-003**: The preload MUST be scoped to the homepage and MUST NOT globally preload Turnstile on unrelated routes.
- **FR-004**: The repair MUST preserve the existing widget callbacks, site-key lookup, hidden token field, server-side Siteverify checks, hostname/action validation, rate limiting, and spam protection.
- **FR-005**: A regression test MUST verify the correct preload URL and homepage-only placement.

## Success Criteria

- **SC-001**: The initial homepage document contains exactly one preload hint whose URL matches the wrapper's default Turnstile script URL byte-for-byte.
- **SC-002**: The corresponding Playwright regression test passes on the repository's configured desktop and mobile browser projects.
- **SC-003**: No Turnstile verification, public-form, API, environment, deployment, visual-design, or payment behavior changes.
- **SC-004**: The final verification report separates the confirmed script-fetch optimization from the still-unverified cause of the reported 45-second challenge wait.

## Assumptions

- The installed `@marsidev/react-turnstile` version is `1.6.1`, as pinned in `package.json`.
- The root page is the appropriate scope for this preload because the affected Suggestion Box is on the homepage.
- Early preloading can reduce script-fetch/startup delay but cannot guarantee a specific token-generation time; Cloudflare's managed challenge also depends on browser and network conditions.

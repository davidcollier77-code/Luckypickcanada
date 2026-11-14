# Feature Specification: Security Header Hardening

**Feature Branch**: `feat/security-headers-hardening`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Improve Lucky Pick Canada's remaining security headers without breaking existing website functionality: tighten Content-Security-Policy, improve Referrer-Policy, remove obsolete X-XSS-Protection, and preserve HSTS, X-Content-Type-Options, X-Frame-Options, Permissions-Policy and Cross-Origin-Opener-Policy. Check where live headers are applied, including Cloudflare's edge configuration. Run tests, security checks and the production build, verify response headers and check for CSP violations or broken functionality."

## User Scenarios & Testing

### User Story 1 - Load and use every experience under a tighter policy (Priority: P1)

A visitor opens any public page and uses the existing experiences while the browser enforces a Content-Security-Policy that no longer grants origins the site does not use, and that refuses inline event-handler attributes.

**Why this priority**: The policy is the main browser-side XSS control; tightening it must not break Next.js hydration, Cloudflare Turnstile, Google Analytics, Cloudflare Web Analytics or Stripe Checkout.

**Independent Test**: Serve a production build, read the response headers, visit the public pages in a browser and confirm there are no CSP violation reports and that interactive components still work.

**Acceptance Scenarios**:

1. **Given** a production response for a public page, **When** the visitor's browser applies it, **Then** the policy allows the site's own scripts and styles, Next.js inline bootstrap scripts, Turnstile, Google Analytics and Cloudflare Web Analytics, and no longer lists the unused Google Fonts, Pexels or other removed origins.
2. **Given** an element with an inline event-handler attribute (for example `onclick`), **When** it is inserted into a public page, **Then** the policy blocks the handler while ordinary React event handling continues to work.
3. **Given** the checkout form, **When** it posts to the site and the server redirects to Stripe Checkout, **Then** the policy still permits the existing Stripe destination and the payment flow is unchanged.
4. **Given** a page that uses the site's self-hosted fonts and inline React styles, **When** it renders, **Then** the fonts and styles load without a violation.

### User Story 2 - Safer referrer information and no obsolete header (Priority: P2)

A visitor follows links away from the site; the browser sends only the origin to other HTTPS sites and nothing to a less secure destination, and the obsolete X-XSS-Protection header is gone.

**Why this priority**: These are low-risk, browser-level privacy and hygiene improvements that do not alter page content or features.

**Independent Test**: Read the response headers and confirm the referrer policy value and the absence of X-XSS-Protection, then browse the site normally.

**Acceptance Scenarios**:

1. **Given** any public page response, **When** its headers are read, **Then** `Referrer-Policy` is `strict-origin-when-cross-origin`.
2. **Given** any public page response, **When** its headers are read, **Then** no `X-XSS-Protection` header is present.
3. **Given** the same-origin and cross-origin navigation paths the site already uses, **When** a visitor navigates, **Then** no feature or destination changes because of the referrer policy.

### User Story 3 - Preserve the protections that already work (Priority: P3)

The existing HSTS, MIME-sniffing, framing, permissions and opener protections continue to be delivered with their current intended values, and repository changes are not duplicated or silently overridden at the edge.

**Why this priority**: Hardening one header must not weaken or duplicate another, and the live edge must be understood before changing origin configuration.

**Independent Test**: Compare the production response headers with the repository configuration and with the live edge response, and confirm each preserved header appears once with an equally strong or stronger value.

**Acceptance Scenarios**:

1. **Given** a public page response, **When** its headers are inspected, **Then** `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` keep their existing intended protections.
2. **Given** the live production response, **When** it is compared with the repository configuration, **Then** any header that the edge rewrites or duplicates is identified and reported rather than changed blindly.

### Edge Cases

- A third-party script or framework feature relies on an inline event-handler attribute; the tightened policy must reveal it as a violation rather than silently allowing it.
- Next.js emits inline bootstrap and flight-data scripts; these must keep working without a nonce because a nonce-based rewrite is not proven safe in this stack.
- Google Analytics and Turnstile are only active when their public configuration is present; the policy must keep their origins whether or not a local environment supplies an identifier.
- A locally served production build may differ from the live edge; the verification must distinguish origin headers from edge-added or edge-rewritten headers.
- Cloudflare may already manage HSTS or inject its analytics beacon; repository changes must not duplicate those functions.

## Requirements

### Functional Requirements

- **FR-001**: The Content-Security-Policy MUST keep `script-src 'unsafe-inline'` because Next.js inline scripts require it and no fully tested nonce implementation exists.
- **FR-002**: The Content-Security-Policy MUST add `script-src-attr 'none'` so inline event-handler attributes are refused.
- **FR-003**: The Content-Security-Policy MUST remove the unused Google Fonts style and font origins.
- **FR-004**: The Content-Security-Policy MUST remove the unused Pexels image origin.
- **FR-005**: The Content-Security-Policy MUST continue to allow Cloudflare Turnstile, Google Analytics, Cloudflare Web Analytics and the existing Stripe Checkout form redirect.
- **FR-006**: The site MUST keep working without an inline event-handler attribute anywhere in its public pages; React event handling, forms, Turnstile and analytics MUST continue to function.
- **FR-007**: The Referrer-Policy header MUST be `strict-origin-when-cross-origin`.
- **FR-008**: The obsolete `X-XSS-Protection` header MUST be removed.
- **FR-009**: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` MUST keep their existing intended protections.
- **FR-010**: The change MUST NOT alter Stripe Checkout configuration, page appearance, content, features, dependencies, credentials or unrelated security settings.
- **FR-011**: The repository change MUST NOT duplicate a header already applied at the Cloudflare edge; any edge override that cannot be changed from the repository MUST be reported with the exact required setting.

### Key Entities

- **Response header set**: The ordered headers applied to public page responses by the application and, separately, by the Cloudflare edge.
- **Content-Security-Policy**: The directive list governing scripts, inline attributes, styles, fonts, images, connections, frames, media, forms and framing.
- **Preserved protections**: HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A production response for a public page contains exactly one Content-Security-Policy, with `script-src-attr 'none'`, no Google Fonts or Pexels origins, and every required third-party origin still present.
- **SC-002**: Visiting the homepage, Crystal Ball and Luck Generator in a real browser produces zero CSP violation messages and no page errors.
- **SC-003**: The production response contains `Referrer-Policy: strict-origin-when-cross-origin` and no `X-XSS-Protection` header.
- **SC-004**: The production response keeps the existing HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` protections.
- **SC-005**: The repository's automated tests, type check and production build pass, and the measured production build stays strictly below 495 MiB.
- **SC-006**: Any live-edge header difference is documented with the exact header, observed value and the setting that must be changed outside the repository.

## Assumptions

- The live production headers observed on 2026-11-13 are representative of the current deployment.
- The Google Fonts origins are unused because all four fonts are self-hosted by the application's font pipeline; no stylesheet or font request uses the Google hosts.
- The Pexels origin is unused because no current source, stylesheet or rendered page references it.
- No public page currently emits inline event-handler attributes, so `script-src-attr 'none'` is compatible.
- React event handling is attached through the framework's event system, not through inline handler attributes, so it is unaffected.
- Cloudflare edge configuration is outside this repository; where the edge rewrites a header, the exact dashboard setting is reported for owner action rather than guessed at or changed through unrelated means.

# Feature Specification: Visual, Usability, Functionality and Brand-Positioning Audit

**Feature Branch**: `113-visual-ux-audit`

**Created**: 2026-11-08

**Status**: Implemented (audit-only; no product change)

**Input**: Master Work Request #1 — "Perform a complete visual, usability, functionality, and brand-positioning audit of Lucky Pick Canada using Browserless … audit and recommendation task only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-time visitor understands the offer (Priority: P1)

A person who has never heard of Lucky Pick Canada opens the public homepage and, within the first screen, can tell what the site is, that it is free entertainment, and what they could do next.

**Why this priority**: Everything else depends on the visitor understanding the product. If the first screen does not communicate, no amount of working features is reached.

**Independent Test**: Load the homepage at a desktop viewport and at a phone viewport and record every visible text node in the first screen; confirm whether the brand name, a value proposition, and a next action are present without scrolling.

**Acceptance Scenarios**:

1. **Given** the public homepage at 1440×900, **When** the first screen is measured, **Then** the visible text, its vertical position, and the accessible name of the page's only H1 are recorded.
2. **Given** the same page at 390×844, **When** the first screen is measured, **Then** the same facts are recorded and compared with the desktop result.

---

### User Story 2 - Interactive experiences work end to end (Priority: P2)

A visitor can open the FAQ, the Lucky Meter, the Daily Lucky Card, the Crystal Ball, the Tip Jar dialog, the Suggestion Box and the Lucky Map and get a working response, or a clearly recorded failure.

**Why this priority**: These are the product. A visitor who meets a dead control leaves.

**Independent Test**: Each experience is exercised once in a real browser session, with the resulting text, ARIA state and console/network outcome recorded. No production data is created.

**Acceptance Scenarios**:

1. **Given** the FAQ, **When** an item is opened, **Then** `aria-expanded` becomes `true`, the answer panel is non-empty, not clipped, and only one item is open.
2. **Given** the Lucky Meter, **When** "Reveal My Resonance" is activated, **Then** a reading with a percentage, a quote and a reset countdown is rendered.
3. **Given** the daily card, **When** "Reveal Today's Luck" is activated, **Then** a named card and its series are rendered.
4. **Given** the Crystal Ball, **When** a question is submitted, **Then** a reading is rendered and the remaining-question allowance is observed before and after.
5. **Given** the Tip Jar, **When** it is opened, **Then** a modal with amounts and a checkout control appears and can be dismissed.
6. **Given** the Lucky Map, **When** a province marker is activated, **Then** the story count and pressed state change accordingly.

---

### User Story 3 - The site is usable on a phone (Priority: P3)

A visitor on a 390 px wide screen can read the text and tap the controls without zooming or missing.

**Why this priority**: Most first visits are mobile; unreadable copy and sub-24 px targets are unfixable by the visitor.

**Independent Test**: Each public page is loaded at 390×844 and measured for horizontal overflow, minimum/median body font size, control hit-box sizes, and fixed/sticky overlay bounds.

**Acceptance Scenarios**:

1. **Given** any public page at 390×844, **When** the document is measured, **Then** `scrollWidth` equals the viewport width (no horizontal scroll) and any overflowing element is listed.
2. **Given** any public page at 390×844, **When** interactive elements are measured, **Then** every control smaller than 24×24 px is listed with its accessible name.

---

### User Story 4 - Identity is consistent and non-gambling (Priority: P4)

A visitor reads the site as a warm, optimistic entertainment experience about luck, not as a betting, lottery or wagering product.

**Why this priority**: The brand direction is an explicit constraint of the request and a durable product principle.

**Independent Test**: All visitor-facing copy collected from the homepage, About, FAQ, Terms, Privacy, Map and the three experiences is reviewed against the stated identity, and any gambling-adjacent or transactional framing is quoted with its location.

**Acceptance Scenarios**:

1. **Given** the collected copy, **When** it is reviewed, **Then** each element that reinforces the intended identity and each element that works against it is quoted with its source page.
2. **Given** the review, **When** recommendations are made, **Then** none recommend gambling-oriented language, design or promotion.

---

### Edge Cases

- A page that is publicly reachable but not in the sitemap (`/privacy`, `/terms`, `/widget/daily-meter`, `/reveal/<id>`).
- Redirecting aliases (`/stories`, `/lucky-map-of-canada`, `/where-luck-has-been-found-in-canada`) and a genuine 404.
- Third-party widgets blocked in a hosted browser (Cloudflare Turnstile, Cloudflare Web Analytics) that would otherwise be reported as site defects.
- Social profile links that answer differently to bots than to people.
- An automated click that succeeds but produces no observable state change.
- A page whose network never reaches "idle" inside the navigation budget.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The audit MUST inspect every publicly reachable page and route: `/`, `/about`, `/lucky-meter`, `/crystal-ball`, `/reveal`, `/map`, `/privacy`, `/terms`, `/widget/daily-meter`, `/reveal/<id>`, the three map aliases and an unknown path.
- **FR-002**: The audit MUST record, per page, the HTTP status, document title, meta description, canonical, language, visible H1, heading order, word count, image alt/dimension state, link and control counts, and document height.
- **FR-003**: The audit MUST capture console errors and failed network requests per page.
- **FR-004**: The audit MUST measure each page at a desktop viewport (1440×900) and a phone viewport (390×844), including horizontal overflow.
- **FR-005**: The audit MUST exercise each interactive experience once and record the observable result, without creating production user content, submitting a suggestion, reacting to a story, or completing a payment.
- **FR-006**: The audit MUST measure readability signals (minimum, median and caption font sizes) and control hit-box sizes with accessible names.
- **FR-007**: The audit MUST record keyboard focus indication and `prefers-reduced-motion` behaviour.
- **FR-008**: The audit MUST attempt screenshots and record the exact limitation if image payloads cannot be retained.
- **FR-009**: The audit MUST evaluate all collected visitor-facing copy against the non-gambling, optimism-first identity and quote the evidence for every positioning judgement.
- **FR-010**: The audit MUST distinguish verified defects from improvement suggestions, and MUST NOT report an unverified observation as a defect.
- **FR-011**: The audit MUST assign every recommendation a priority (critical, important, optional) and a reason.
- **FR-012**: The audit MUST NOT change application code, copy, artwork, configuration, dependencies or deployment.

### Key Entities

- **Page record**: path, status, viewport, load timing, metadata, headings, counts, measurements, console/network findings.
- **Interaction record**: experience, action taken, observable result, ARIA state, blockers.
- **Finding**: identifier, severity class (defect or opportunity), priority, evidence, affected pages, recommendation, effort, confidence.
- **Limitation**: what could not be measured, why, and what would be required to measure it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 10 public routes plus 3 redirects and 1 unknown path are reported with an observed status, or with the exact reason they were not reached.
- **SC-002**: Every stated finding cites a measurement, a quoted rendered string, or a repository file, so a reviewer can re-run the same check.
- **SC-003**: Zero application, asset, configuration, dependency or deployment files are modified by the task.
- **SC-004**: The report contains a prioritised list in which each item states why it holds that priority.
- **SC-005**: Every unavailable measurement is listed explicitly and is never presented as a pass or as a defect.
- **SC-006**: At least one task group is named with a reason, and the four Spec Kit stages are recorded with artifact paths.

## Assumptions

- The audit target is the publicly reachable production site `https://luckypickcanada.ca`, which Browserless can load without authentication.
- Read-only exploration is authorised; writing community content, suggestions, reactions or payments is not.
- "Defect" means an observed behaviour or measured value that contradicts the site's own intent or an accessibility baseline; "opportunity" means a judgement-based improvement.
- Screenshot retention is desirable but not a reason to claim an unverified visual finding.
- The three map aliases intentionally redirect to `/map` and their 308 responses are correct.

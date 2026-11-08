# Tasks: First-screen clarity, approved naming, analytics CSP and mobile tap-target verification

**Feature**: `specs/115-first-screen-clarity-naming-csp` · **Spec**: `spec.md` · **Plan**: `plan.md`

## Phase 1 — Setup

- [X] T001 Read `AGENTS.md`, the selected `.freebuff` group instructions, the Memory Bank and `.docs/manifest.json`; confirm PR #1773 is audit-only and PR #1774 already delivered the tap-target and accessibility work.
- [X] T002 Confirm the baseline in this workspace: hidden `sr-only` homepage `H1`, `static.cloudflareinsights.com` absent from `script-src`, legacy names in the homepage/footer/FAQ/map copy, `::before` hit-area rules present in `themes/default/a11y.css` and `themes/default/map.css`.
- [X] T003 Create `specs/115-first-screen-clarity-naming-csp` (feature 114 is PR #1774's) and point `.specify/feature.json` at it.

## Phase 2 — Foundational

- [X] T004 Record the first-screen measurements and the legacy names as the pre-change baseline in `spec.md`.
- [X] T005 Identify the change surface: `app/homepage/Hero.js`, `themes/default/hero.css`, `themes/default/homepage.css`, `next.config.mjs`, the naming copy sources and the existing source/Playwright guards.
- [X] T006 Start the local dev server and confirm the pre-change first screen at 1440 × 900 and 390 × 844.

## Phase 3 — User story 1: first-screen clarity (P1)

- [X] T007 [US1] Add the visible `.hero-welcome` block to `app/homepage/Hero.js` with the brand `H1`, the fun/free/community sentence, the "more than fortune and fame" statement, a free gold CTA to `#play-explore`, and the "Free to enjoy · For fun and entertainment only" note.
- [X] T008 [US1] Style the block in `themes/default/hero.css` with the existing display face and gold palette; keep the 12 px mobile caption floor.
- [X] T009 [US1] Reduce the hero artwork container height responsively in `themes/default/homepage.css` so the copy and CTA fit inside `100svh` without clipping; artwork, sources, preload and shimmer layers unchanged.
- [X] T010 [US1] Measure at 1440 × 900 and 390 × 844 that the brand line, explanation, statement and CTA are inside the first viewport and that `scrollWidth === clientWidth`. Result recorded in `artifacts/first-screen-20261108/results.json`.

## Phase 4 — User story 2: Cloudflare Analytics CSP (P1)

- [X] T011 [US2] Append `https://static.cloudflareinsights.com` to `script-src` in `next.config.mjs` and leave every other directive unchanged.
- [X] T012 [US2] Assert the rendered production header contains the source in `script-src` with `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, the unchanged `connect-src`/`img-src`/`form-action` values and no wildcard.

## Phase 5 — User story 3: approved naming (P1)

- [X] T013 [US3] Homepage and hero navigation: Luck Generator, Crystal Ball, Lucky Community Stories, Lucky Reveals (Personal Reveal — CAD $1.00, Gift Reveal — CAD $1.99); remove "Lucky Meter", "Oracle", "Consult the Oracle", "Choose a Lucky Pick" and the singular shared-section "Lucky Reveal" label.
- [X] T014 [US3] Footer, FAQ content, `/lucky-meter` metadata and body copy, Crystal Ball navigation, About page/section: approved names; Tip Jar and FAQ names unchanged.
- [X] T015 [US3] Map page metadata, loading text, headings, aria-labels, empty state and error text: Lucky Community Stories.
- [X] T016 [US3] Confirm the diff changes no route, navigation destination, price, Stripe price ID, checkout type, email template or Stripe product name.

## Phase 6 — User story 4: phone tap targets (P2)

- [X] T017 [US4] Re-measure footer navigation links, footer social links, homepage header links and map province markers at 390 × 844 (border box plus generated hit area) without re-implementing the PR #1774 CSS.
- [X] T018 [US4] Fix only controls below 24 × 24 px, preserving visible artwork, or record that none remain. Result recorded in `artifacts/first-screen-20261108/results.json`.

## Phase 7 — Guard, verify and deliver

- [X] T019 Add `__tests__/first-screen-and-naming.test.js` guarding the first-screen copy and free CTA, the analytics CSP source with unchanged directives, the approved names and the absence of legacy labels.
- [X] T020 Update the existing source and Playwright guards that assert the superseded labels, without weakening their behavioural assertions.
- [X] T021 Run the focused guard, the full Vitest suite, `pnpm exec tsc --noEmit` and `./freebuff-verify.sh`; record the real results. PASS — full Vitest 52 files / 419 tests, focused guards 32/32 after the final spec edit, `tsc --noEmit` exit 0, `./freebuff-verify.sh` exit 0 (Spec Kit gate, type check, production build, refresh-docs 36/36).
- [X] T022 Measure `.next` + `public` against the 495 MB hard maximum and report the value. PASS — `.next` 362.8 MB + `public` 32.3 MB = 395.1 MB (< 495 MB). Production `Content-Security-Policy` verified through `pnpm start` + `curl -I`: `script-src` carries `https://static.cloudflareinsights.com`, `connect-src` unchanged.
- [X] T023 Browser QA: rendered desktop and mobile checks for the first screen, naming, no gambling identity and tap targets. PASS with one limitation — Cloud browser at 1440 × 900 and 390 × 844: first screen fully inside the viewport, no horizontal overflow, approved names only, footer nav 34 × 24, social 36 × 24, legal 64 × 24, header 64 × 24, no sub-24 px control. Local Playwright Chromium cannot launch (missing `libnspr4.so`) and Browserless cannot reach the owner-gated preview, so the Cloud browser was used; `/map` has no story data locally, so the province-marker hit area (22.5 px visible, 32 px effective) was measured from the component's own class inside the real map container. Evidence: `artifacts/first-screen-20261108/results.json` and the two screenshots beside it.
- [X] T024 Inspect the complete final diff for scope, then create/update the single PR with the canonical summary and leave it open and unmerged. PASS — the audit removed an auto-generated `next-env.d.ts` rewrite and corrected one Playwright label; the committed set is the four task groups' files, the Spec Kit artifacts, the evidence and the Memory Bank record only.

## Dependencies

- T007–T009 before T010, T017 and T023.
- T011 before T012.
- T013–T015 before T019–T020.
- T019–T020 before T021–T022.
- T021–T024 after every in-scope edit.

## Implementation strategy

Four independently verifiable increments in one branch and one PR: first-screen clarity (copy + hero
fit), the additive CSP source, approved naming consistency, and verification of the tap targets PR
#1774 already delivered. They share no runtime code beyond the homepage files, and all four come from
the same audit and master request.

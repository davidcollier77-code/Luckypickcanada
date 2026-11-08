# Tasks: Visual, Usability, Functionality and Brand-Positioning Audit

**Feature**: `specs/113-visual-ux-audit` | **Plan**: `plan.md` | **Spec**: `spec.md`

**Task groups**: `deep-dive` (evidence-driven, audit-only investigation with declared limitations) and `polishing` (visual consistency, readability, responsive presentation). `testing` was not selected: the task changes no behaviour and must add no test.

## Phase 1 — Setup

- [X] T001 Confirm branch, clean worktree and absence of an existing UX/visual audit PR in `specs/` and GitHub (`only PR #1760` SEO audit and `PR #1765` DevSkim open)
- [X] T002 Read governance, Memory Bank context, `.docs/manifest.json` and the `deep-dive`/`polishing` task-group instructions
- [X] T003 Enumerate the audited surface from `app/**/page.*`, `app/sitemap.js`, `next.config.mjs` and the live `/sitemap.xml` and `/robots.txt`

## Phase 2 — Foundational

- [X] T004 Establish Browserless access to `https://luckypickcanada.ca` and record the first successful homepage scrape (title, headings, rendered copy)
- [X] T005 Probe route status: `/privacy`, `/terms`, `/widget/daily-meter`, `/reveal/<zero-id>`, an unknown path, and the three map aliases

## Phase 3 — [US1] First-time visitor comprehension

- [X] T006 Measure the homepage at 1440×900: H1 size/visibility, above-the-fold text with vertical offsets, section boundaries (`findings.md` §2)
- [X] T007 Measure the same page at 390×844 and compare the first screen (`findings.md` §2, `measurements.json`)

## Phase 4 — [US2] Interaction integrity

- [X] T008 Exercise the FAQ accordion and record `aria-expanded`, panel height, character count and single-open behaviour
- [X] T009 Exercise the Lucky Meter reveal and record the reading, ritual counter and reset countdown
- [X] T010 Exercise the Daily Lucky Card reveal and record the card, series and share control
- [X] T011 Exercise the Crystal Ball: field contract, disabled/enabled submit, rendered reading, allowance display
- [X] T012 Exercise the Tip Jar dialog and its dismissal
- [X] T013 Inspect the Suggestion Box contract without submitting (fields, honeypot, limits, CAPTCHA gate)
- [X] T014 Exercise the Lucky Map province filter and record the pressed state and count change

## Phase 5 — [US3] Phone presentation and accessibility

- [X] T015 Measure all six public pages at 390×844: horizontal overflow, minimum/median font sizes, control hit boxes, fixed/sticky layers
- [X] T016 Measure keyboard focus indication and `prefers-reduced-motion` animation state
- [X] T017 Record console errors and failed requests per page, and separate site defects from hosted-browser restrictions

## Phase 6 — [US4] Identity review

- [X] T018 Collect and quote the rendered copy that reinforces the non-gambling, optimism-first identity
- [X] T019 Collect and quote the rendered copy that works against it, with page and vertical position

## Phase 7 — Delivery

- [X] T020 Write the prioritised report with defects separated from opportunities (`specs/113-visual-ux-audit/findings.md`)
- [X] T021 Write the machine-readable evidence (`artifacts/ui-audit-20261108/measurements.json`)
- [X] T022 Update `.specify/feature.json` and the Memory Bank record
- [ ] T023 Retain screenshot files. **Blocked**: every Browserless screenshot response was truncated by the integration transport (900×560 JPEG q35, 640×400 JPEG q22) and the small 480×300 JPEG arrived only as an inline payload that was lost with the runner restart. No image file is claimed; see `findings.md` §7.
- [X] T024 Run `./freebuff-verify.sh`, measure the build against the 495 MB cap, audit the final diff, and publish the canonical PR summary

## Phase 8 — Polish

- [ ] T025 Re-run the Crystal Ball allowance check. **Not completed**: the follow-up Browserless call failed when the runner restarted, so the allowance observation is reported as a single sample only.

## Dependencies

T001–T005 gate all measurement phases. T006–T007 gate the first-impression finding. T008–T014 inform T020. T015–T017 inform the accessibility and mobile findings. T018–T019 gate the positioning section. T020–T024 produce the deliverable.

## Independent test criteria

- **US1**: first-screen text and offsets are recorded for both viewports.
- **US2**: each experience has an observed result or an explicit blocker.
- **US3**: every public page has an overflow measurement and a control-size sample.
- **US4**: every positioning judgement quotes rendered copy with its location.

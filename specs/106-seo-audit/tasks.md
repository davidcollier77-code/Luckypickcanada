# Tasks: Sitewide SEO Audit

**Input**: Design documents from `specs/106-seo-audit/`
**Prerequisites**: `spec.md`, `plan.md`

## Phase 1: Governance and baseline

- [x] T001 Read `AGENTS.md`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, `.freebuff/deep-dive.md`, `.freebuff/seo.md`, `.docs/manifest.json`, `.specify/memory/constitution.md`, and the Spec Kit command definitions.
- [x] T002 Inspect the worktree, branch, recent history and open pull requests; confirm no existing SEO-audit feature directory, branch or PR to reuse (0 open PRs; no `specs/*seo*` directory).
- [x] T003 Locate existing SEO- and performance-related repository records for comparison: `specs/034-homepage-seo-section-background`, `specs/055-secure-jsonld`, `specs/homepage-perf`, `specs/perf-fixes`, `specs/041-turnstile-early-preload`, `specs/088-live-performance-readiness`, and the Memory Bank entries that reference them.

## Phase 2: Live site evidence (User Story 1)

- [x] T004 Fetch `robots.txt` and `sitemap.xml`; record bytes, content type, declared rules and URL list.
- [x] T005 Fetch every discovered public URL and record HTTP status, effective URL and byte size: `/`, `/lucky-meter`, `/crystal-ball`, `/reveal`, `/map`, `/about`, `/privacy`, `/terms`, `/lucky-map-of-canada`, `/where-luck-has-been-found-in-canada`, plus 404 probes and `/stories`, `/index.html`, `/Map`, trailing-slash variants.
- [x] T006 Record origin/protocol variants (`http`, `https`, `www`, `http+www`) and redirect chains.
- [x] T007 Parse every page for title, description, robots directive, canonical, Open Graph and Twitter tags, H1/H2/H3, images (src, alt, width, height, loading), JSON-LD types, internal and external anchors, and approximate text volume.
- [x] T008 Resolve every discovered internal link and record its status; record external social link statuses with an explicit automated-client caveat.
- [x] T009 Measure every referenced image's intrinsic dimensions and byte size; compare with the declared dimensions in markup and metadata.
- [x] T010 Measure the homepage's initial JS, CSS and preloaded font bytes, response TTFB samples, and cache/compression headers for HTML, CSS, images and the sitemap.
- [x] T011 Attempt PageSpeed Insights and CrUX APIs for field/lab Core Web Vitals; record the actual failure (429 quota; missing key) and list CWV as unverified.

## Phase 3: Source verification (User Story 1)

- [x] T012 Read `app/layout.js`, `app/page.js`, `app/sitemap.js`, `app/robots.js`, `public/robots.txt`, and every route's `metadata` export to confirm observed titles, canonicals, robots directives and structured data.
- [x] T013 Read `app/homepage/{Hero,HomePage,FAQSection}.js` to confirm the hero `<picture>`/preload relationship, heading hierarchy, hidden H1, internal CTAs and FAQ-to-schema correspondence.
- [x] T014 Read `next.config.mjs` and `wrangler.jsonc` to confirm redirect rules, cache-header declarations and deployment routing.

## Phase 4: Report (User Story 1 and User Story 3)

- [x] T015 Write the prioritized findings with all nine required fields per finding, distinguishing verified problems, possible improvements and unverified observations.
- [x] T016 Write the ten required sections, including the page-by-page table, the previous-audit comparison limited to accessible records, the implementation order and the shortlist.
- [x] T017 Publish the complete report once in `PR_SUMMARY.md` as the single canonical report for the pull request body; create no duplicate report file.

## Phase 5: Records and verification (User Story 2)

- [x] T018 Point `.specify/feature.json` at `specs/106-seo-audit`.
- [x] T019 Prepend the current task state to `memory-bank/activeContext.md` and record the durable outcome in `memory-bank/progress.md` without rewriting existing history.
- [x] T020 Run `./freebuff-verify.sh` and record the real result, including the measured production build size against the 495 MB maximum.
- [x] T021 Audit the complete final diff: confirm only documentation paths changed and no application, asset, configuration, dependency, workflow or `.docs/` path is present.
- [ ] T022 PR-head CI results (PENDING until the pushed branch reports).

## Completion Conditions

Implementation is complete when the Spec Kit artifacts, Memory Bank record and single canonical report exist and the diff contains no production change. Verified completion additionally requires `./freebuff-verify.sh`, the measured build size and the final diff audit to pass; PR-head CI remains PENDING until GitHub reports it.

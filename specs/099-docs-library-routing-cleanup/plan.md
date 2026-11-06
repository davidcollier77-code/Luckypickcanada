# Implementation Plan: Documentation Library and Specialist Routing Cleanup

**Branch**: `freebuff/cf8f9386a7381a2d31381dd8` | **Date**: 2026-11-06 | **Spec**: `specs/099-docs-library-routing-cleanup/spec.md`

**Input**: Feature specification from `specs/099-docs-library-routing-cleanup/spec.md`

## Summary

Edit only the documentation index and its routing metadata. Remove three library identifiers outright (Pillow, Android Developers, Gemini CLI) from every manifest section and delete their snapshots, including the Gemini CLI symlinks in three group directories. Replace the Offscreen-specific Chrome source with a general Chrome web-platform source while keeping the `/websites/developer_chrome` identifier and its seven group routes, and materialize that snapshot so the library has no gap. Move NumPy from Polishing to Audio in the manifest, the group routing file, and the snapshot tree. Audit every remaining identifier against actual project use, then update the single regression test that asserted the removed Gemini CLI snapshot. The updater script, its tests, and its workflow remain byte-identical.

## Technical Context

**Language/Version**: JSON manifest, Markdown routing and snapshots, TypeScript test assertion, Node.js 22.x for the audit script.

**Primary Dependencies**: None added or changed. The repository already pins pnpm 10.30.3 and the existing Next.js/React/Playwright/Vitest stack.

**Storage**: `.docs/` snapshot tree (one canonical file per library plus relative symlinks per additional group) and `.docs/manifest.json`.

**Testing**: `node scripts/test-refresh-docs.js` (updater contract, unchanged), focused `pnpm exec vitest run __tests__/reviewer-retirement.test.ts`, full `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, and a manifest/snapshot consistency audit executed with Node.

**Target Platform**: Repository tooling; no runtime deployment.

**Project Type**: Next.js application repository with an agent documentation library.

**Constraints**: 495 MB production build ceiling; `.docs/` edits are authorized only for this documentation-refresh task; the updater must not be modified.

**Scale/Scope**: 71 routed identifiers before, 68 after; 8 specialist groups.

## Constitution Check

- **Smallest correct change**: only manifest data, snapshots, five specialist routing files, one test assertion, Spec Kit artifacts, the PR report, and memory notes change. No application source.
- **Protected systems untouched**: no website code, dependencies, visuals, audio, payments, authentication, deployment, or updater automation.
- **Evidence first**: Pillow non-use and NumPy audio use are verified by search before editing; manifest consistency is verified programmatically after editing.
- **No-merge rule**: the PR stays open and unmerged.

## Project Structure

### Documentation (this feature)

```text
specs/099-docs-library-routing-cleanup/
├── spec.md
├── plan.md
└── tasks.md
```

### Repository files affected

```text
.docs/manifest.json                                  # routing, sources, inventory, SHA pins
.docs/audio/_numpy_numpy.md                          # moved from polishing
.docs/polishing/_numpy_numpy.md                      # removed
.docs/polishing/_python-pillow_Pillow.md             # removed
.docs/deep-dive/_android_developers.md               # removed
.docs/creation/_google-gemini_gemini-cli.md          # removed (canonical)
.docs/deep-dive/_google-gemini_gemini-cli.md         # removed (symlink)
.docs/troubleshooting/_google-gemini_gemini-cli.md   # removed (symlink)
.docs/*/_websites_developer_chrome.md                # Offscreen page replaced with general Chrome docs
.freebuff/creation.md                                # Gemini CLI section removed
.freebuff/deep-dive.md                               # Gemini CLI section and Android route removed
.freebuff/troubleshooting.md                         # Gemini CLI section removed
.freebuff/polishing.md                               # Pillow and NumPy routes removed
.freebuff/audio.md                                   # NumPy route added
__tests__/reviewer-retirement.test.ts                # asserts retained Gemini API snapshot instead
```

## Approach

1. **Verify before removing.** Search all non-`.docs`, non-`specs` source for `PIL`/`Image.open`/`import PIL` to confirm Pillow is unused, and confirm NumPy is imported by `scripts/inspect-media.py` and installed by `scripts/setup-media-tools.sh` for the audio stack.
2. **Edit the manifest once, programmatically.** Parse `.docs/manifest.json`, assert a byte-identical round trip first so formatting cannot drift, then filter the three retired identifiers from every group, delete their `sources`, `inventory`, and `githubShas` entries, move `/numpy/numpy` from `polishing` to `audio`, and repoint `/websites/developer_chrome` to `https://developer.chrome.com/docs/web-platform`. Leave `lastUpdated` to the updater's own bookkeeping.
3. **Delete and move snapshots.** Remove the canonical files and every symlink for the retired identifiers; `git mv` the NumPy snapshot into `.docs/audio/`; fetch the general Chrome page with the updater's own user agent into the first routed group (`troubleshooting`) and recreate the six relative symlinks, so the snapshot layout still matches the updater's model.
4. **Update specialist routing.** Delete the three "Conditional Gemini CLI Reference" sections, the Android Developers and Pillow routes, and move NumPy from the Polishing list to the Audio list.
5. **Update the one dependent test.** `__tests__/reviewer-retirement.test.ts` asserted the Gemini CLI snapshot path; point that assertion at the retained Gemini API skill snapshot and adjust its description. The historical reviewer specs and the manifest assertion stay.
6. **Audit.** Compare routing, sources, inventory, and SHA pins for exact agreement; scan each group directory for orphan files, missing snapshots, and broken symlinks; review each remaining identifier's group assignment against actual project use and record the result in the PR report.

## Phase Plan

- **Phase 1 — Specify/Plan/Tasks**: this document set.
- **Phase 2 — Removals**: manifest sections, snapshots, symlinks, routing sections for the four approved references.
- **Phase 3 — Retention and move**: NumPy to Audio, Gemini API/Debian/PostHog/Magic UI confirmed unchanged, Chrome repointed.
- **Phase 4 — Audit**: consistency script over the whole library, plus per-identifier usefulness review.
- **Phase 5 — Verification and report**: focused and full test runs, typecheck, `./freebuff-verify.sh`, measured build size, final diff audit, PR report.

## Risks and Mitigations

- **Stale refresh branch reintroducing removed docs**: the workflow force-pushes `auto/docs-refresh` from `main` each run, so once this lands on `main` the retired identifiers are no longer routed and cannot be fetched.
- **Dangling symlinks after canonical deletion**: every group directory is checked for broken links in the audit step.
- **Removing a document that a test requires**: the retirement regression test is updated in the same change, and its intent (historical Gemini records preserved) is kept.
- **Hand-fetching the Chrome snapshot could diverge from updater output**: the request uses the updater's user agent, redirect handling, and sanitization scope; the updater will treat any later difference as a normal content update.

## Complexity Tracking

No constitutional violations. The change is data and documentation only, with one test assertion update required by the approved removal.

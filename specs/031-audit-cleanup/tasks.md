# Tasks — Repository Cleanup Audit

## Audit and Scope Correction

- [x] Read AGENTS.md first and inspect the routed deep-dive governance and required Jules/Gemini documentation snapshots.
- [x] Inspect the existing PR #1518 diff, current base branch, and historical PR Summary records.
- [x] Preserve the CI workflow/model and Playwright corrections in the separate prerequisite PR #1519.
- [x] Restore the empty app/api/verify-session/route.js file by constructing the audit PR on top of the base branch where that empty historical file exists; do not ship a route deletion in the audit diff.
- [x] Trace the NGC4216 image source chain and correct the report: AVIF/WebP/JPEG are referenced by the active Lucky Card Reveal component.
- [x] Reclassify grep-only assets and package findings as candidates pending exhaustive local/bundler verification.
- [x] Preserve historical PR Summary content and append the audit report.
- [x] Prepare substantive active Spec Kit artifacts for feature 031-audit-cleanup.
- [x] Record the originating build-size statement as historical and not independently re-measured in this correction pass.

## Pending — Future Separate Authorization/Verification

- [ ] Run a local full-reference scan for assets including CSS URL references, runtime-generated paths, manifests, and dynamic file mappings.
- [ ] Reconcile the .orig/.rej artifacts against active files and Git history before considering any removal.
- [ ] Trace html2canvas, lucide-react, and @stripe/stripe-js imports and bundle consumers using a complete local checkout and the actual production bundler.
- [ ] Re-measure the actual production build size and confirm it remains below 495 MB.
- [ ] Obtain required current-head CI evidence for prerequisite PR #1519.
- [ ] Inspect the final PR #1518 changed-file list and patches to ensure this audit diff contains documentation/governance records only.

## Completion Boundary

This audit does not authorize deleting any file or asset, removing any dependency, modifying application behavior, or changing workflow/test code.

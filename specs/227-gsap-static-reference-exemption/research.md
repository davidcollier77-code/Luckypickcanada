# Research: Static GSAP AI Reference Exclusion

Date: 2026-11-27. Findings were checked against the live `main` branch.

## Manifest evidence

- The manifest has one GSAP identifier: `/llmstxt/gsap_llms_txt`.
- It is routed once in `groups.polishing`, appears in `inventory`, and retains one `sources` record pointing to `https://gsap.com/docs/v3/GSAP/Timeline`.
- It is not a second independently routed GSAP document.
- The current snapshot path is `.docs/polishing/_llmstxt_gsap_llms_txt.md`.

## Updater design evidence

- `collectRoutedLibraries` produces the routed ID/group map.
- `reconcileManifestIndexes` preserves IDs that remain routed; `removeStaleSnapshots` removes only unrouted snapshots.
- The final consistency audit checks routed snapshots after fetching completes.
- The refresh queue is built after manifest reconciliation and before source SHA/download processing.
- Therefore the smallest safe exclusion is at queue construction: record the allowlisted ID as static and do not enqueue it. Do not remove it from routing or from manifest indexes; doing so would trigger pruning and lose the reference from agent discovery.
- Reporting static references separately avoids misclassifying the exclusion as a successful unchanged upstream check.

## Snapshot state

The live checked-in GSAP snapshot currently contains only the two-line Cloudflare verification response, `Please wait while your request is being verified...`, rather than technical GSAP documentation. This task will not edit or replace the snapshot; recovery of usable GSAP content is separate.

## QA evidence and constraints

- `scripts/test-refresh-docs.js` already runs the full updater unit suite and launches `scripts/test-refresh-docs-e2e.js` as an isolated end-to-end test.
- The e2e fixture copies the real `.docs` tree to a temporary directory and uses a mocked HTTPS transport, making it suitable to assert the static URL is not requested and the snapshot hash remains unchanged.
- The script path `scripts/refresh-docs.js` is explicitly protected by `.github/workflows/protected-files.yml`; the PR must carry the required authorization declaration and the separate protected-file GitHub Environment approval remains a pre-merge gate.
- `scripts/` is not excluded by the current build and visual classifiers, so the existing build validation and Visual QA remain required. No checker or workflow is being changed.
- The repository requires Node.js 26.x and pnpm 10.30.3. ChatGPT startup reports Node.js 22.x; Node-based unit/e2e tests and build operations are not run under the incompatible runtime.

## Decision

Use one hard-coded, auditable static reference ID in the existing updater, add explicit report visibility and regression coverage, and leave all `.docs` files, manifest routing and workflows unchanged.

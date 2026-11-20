# Implementation Plan: Add the tested ChatGPT startup script and its README

**Spec**: `specs/196-chatgpt-startup-documentation/spec.md`
**Branch**: `docs/chatgpt-startup-v2.1.0`
**Base**: `main`

## Summary

Copy two already-verified files into a new `chatgpt/` directory. `ChatGPT.md` receives the v2.1.0 startup script bytes; `README.md` receives the standalone operating documentation bytes. No transformation, regeneration or application wiring is involved.

The directory is required because the repository already owns a root `README.md` for the website. Keeping the pair together satisfies the requested filenames without replacing that file.

## Technical Context

- **Artifacts**: Plain Markdown containing a Bash script and its documentation; not imported by the Next.js application.
- **Sources**: The previously verified copies under the ignored `dist/luckypick-node-v2.1.0/` directory.
- **Expected hashes**:
  - `chatgpt/ChatGPT.md` — `811a048470944199131a910a7eb67491709bc267c8ec0a09dc46b35bd5a8377f`
  - `chatgpt/README.md` — `f907a43c55ae93192567c0607426b041756fe86cbea8b74343db20d573441af3`
- **Dependencies**: None added or changed.
- **Runtime/build impact**: None; the files are not part of the application bundle.

## Constitution Check

- **Single Source of Truth**: `AGENTS.md` was read and governs this task; these artifacts remain subordinate to it.
- **Verify Before Acting**: Both copies are compared byte-for-byte and hashed before submission; the script is syntax-checked.
- **Implementation Sequence**: Inspect, plan, implement, verify, report and create the PR in that order.
- **Protect Core Systems**: No payment, authentication, database, hosting or secrets configuration is touched.
- **Resource Conservation**: No paid service, dependency or documentation-library change is introduced.

## Phase 0: Research

No material unknowns exist. The source bytes, hashes and destination are already established, so no `research.md` is needed.

## Phase 1: Design

No data model, external contract or quickstart is warranted. The change is two static documentation files plus the mandatory task records.

## Implementation Approach

1. Create `chatgpt/` at the repository root.
2. Copy the verified script bytes to `chatgpt/ChatGPT.md` and the verified README bytes to `chatgpt/README.md`.
3. Confirm byte equality with `cmp`, both SHA-256 checksums, line counts and `bash -n`.
4. Run the repository verification gate with the actual main commit as its base, then measure the production build size.
5. Commit, push the branch and open a non-draft PR against `main` without merging.

## Verification Plan

- `cmp` against both verified sources.
- `sha256sum` for both destination files.
- `wc -l` for both destination files.
- `bash -n chatgpt/ChatGPT.md`.
- `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh`.
- Production build size measurement against the 495 MiB cap.
- Diff review confirming no existing file changed.

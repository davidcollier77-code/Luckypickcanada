# Tasks — Tip Jar Glow Pulse Match

## Specify → Plan → Implement

- [x] T001 [US1] Specify the Tip Jar/Suggestion visual parity requirement in `spec.md`.
- [x] T002 [US1] Record the minimal shared-class and existing-keyframe approach in `plan.md`.
- [x] T003 [US1] Add the reusable `gold-btn-glow` class to both homepage buttons.
- [x] T004 [US1] Rename the suggestion-specific keyframe and selector to shared gold-button names without changing pulse values.
- [x] T005 [US2] Update the active-state and reduced-motion selectors to apply to both buttons.
- [x] T006 [US2] Confirm existing shimmer overlays, text, handlers, and destinations remain in place through source inspection.

## Verification

- [ ] T007 `pnpm exec tsc --noEmit` — PENDING; no repository shell/worktree is available in this session.
- [ ] T008 `pnpm test` — PENDING; no repository shell/worktree is available in this session.
- [ ] T009 `pnpm run build` and measure `.next` + `public` against the 495 MiB cap — PENDING; no repository shell/worktree is available in this session.
- [ ] T010 `./jules-verify.sh` — PENDING; no repository shell/worktree is available in this session.
- [x] T011 GitHub source verification — PASS: both button class names, the shared keyframe and animation declaration, the reduced-motion selector, and the pressed-state selector are present on the branch; old suggestion-only identifiers are absent from the implementation files.
- [ ] T012 CI and browser interaction/visual checks — PARTIAL: OpenNext validation (run 41136958573) is still in progress at the OpenNext Cloudflare build; Visual QA (run 41136958878) is still in progress at the Spec Kit verification step. Browser-level result remains pending.
- [x] T013 Diff scope check — PASS: the three implementation files contain only the requested button-class and pulse-selector/keyframe changes; no asset, dependency, route, or functionality change.
- [x] T014 Update `memory-bank/activeContext.md` with the branch, PR, implementation, and actual verification status.
- [x] T015 DevSkim PR workflow (run 41136958575) — PASS: the scan/security-upload job completed with success.

# Tasks: Preserve Canvas Rendering During Loop Optimization

**Input**: [spec.md](./spec.md) and [plan.md](./plan.md)  
**Task group**: troubleshooting

## Phase 1: Inspect and repair

- [x] T001 Inspect the PR head and base versions of `components/LuckyGenerator.tsx`, tracing trail array updates, path commands, and stroke order.
- [x] T002 Remove the orphaned meteor `forEach` callback opening and restore the indexed meteor trail loop in `components/LuckyGenerator.tsx`.
- [x] T003 Restore `ctx!.stroke()` after the meteor trail path is constructed and before the meteor core is drawn in `components/LuckyGenerator.tsx`.
- [x] T004 Verify the spark trail uses a single indexed pass, retains the `sp.trail.length > 1` guard, and strokes once in `components/LuckyGenerator.tsx`.
- [x] T005 Verify the rocket and lightning path loops retain their path order and stroke operations in `components/LuckyGenerator.tsx`.
- [x] T006 Move `drawBranch` outside the animation-frame callback so it is created once per canvas effect, and remove redundant meteor context setup, unused per-point trail alpha metadata, and the unused `lastAlpha` value in `components/LuckyGenerator.tsx`; also remove the unused `useMemo` import.
- [x] T007 Update and execute `benchmark.js` with both production passes (glow then fill), warmup, and alternating order. **PASS** — Node.js 22 syntax check and run; mock `forEach`: 46.10 ms average, indexed `for`: 22.76 ms average across five rounds (50.63% micro-benchmark reduction). This measures mock-context JavaScript path-building overhead only, not browser FPS or PageSpeed gains.
- [x] T008 Restore pre-existing historical guidance in `.jules/bolt.md` and remove empty or duplicate task scratch files (`generate_bolt.ts`, `patch.diff`, `patch_lucky.sh`, `test_canvas.js`, and `pr_description.txt`).

## Phase 2: Verification

- [x] T009 Run `pnpm run test` on the first repaired source head. Result: PASS; must be reconfirmed on the latest source head.
- [x] T010 Run `pnpm tsc --noEmit` on the first repaired source head. Result: PASS; must be reconfirmed on the latest source head.
- [ ] T011 Pass the Spec Kit governance gate and `./jules-verify.sh` on the latest source head.
- [ ] T012 Run Playwright visual-regression tests after the governance gate passes.
- [ ] T013 Complete Next.js/OpenNext build checks and confirm the `.next + public` output is below the 495 MiB hard cap.
- [ ] T014 Obtain fresh Amazon Q and Gemini reviews of the latest PR head and resolve any new actionable findings.

## Dependencies and execution order

- T001 precedes T002–T008.
- T009 and T010 passed on the earlier repair head; latest-head reconfirmation remains part of T011/T012 and the required CI workflow.
- T011 is a prerequisite for T012 in the Visual QA workflow.
- T013 and T014 can proceed independently once the source head is stable.

## Implementation strategy

Keep rendering behavior unchanged: no artwork, layout, color, audio, particle physics, reveal timing, or unrelated feature changes. Treat synthetic benchmark timings as mock-context JavaScript micro-benchmark data only; real browser performance remains unmeasured.

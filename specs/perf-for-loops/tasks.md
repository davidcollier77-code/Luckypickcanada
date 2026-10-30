# Tasks: Preserve Canvas Rendering During Loop Optimization

**Input**: [spec.md](./spec.md) and [plan.md](./plan.md)  
**Task group**: troubleshooting

## Phase 1: Inspect and repair

- [x] T001 Inspect the PR head and base versions of `components/LuckyGenerator.tsx`, tracing trail array updates, path commands, and stroke order.
- [x] T002 Remove the orphaned meteor `forEach` callback opening and restore the indexed meteor trail loop in `components/LuckyGenerator.tsx`.
- [x] T003 Restore `ctx!.stroke()` after the meteor trail path is constructed and before the meteor core is drawn in `components/LuckyGenerator.tsx`.
- [x] T004 Verify the spark trail uses a single indexed pass, retains the `sp.trail.length > 1` guard, and strokes once in `components/LuckyGenerator.tsx`.
- [x] T005 Verify the rocket and lightning path loops retain their path order and stroke operations in `components/LuckyGenerator.tsx`.

## Phase 2: Verification

- [x] T006 Run `pnpm run test` on the repaired PR head. Result: PASS.
- [x] T007 Run `pnpm tsc --noEmit` on the repaired PR head. Result: PASS.
- [ ] T008 Pass the Spec Kit governance gate and `./jules-verify.sh`; the first Visual QA attempt was blocked because these required Spec Kit documents were empty.
- [ ] T009 Run Playwright visual-regression tests after the governance gate passes.
- [ ] T010 Complete Next.js/OpenNext build checks and confirm the ` .next + public ` output is below the 495 MiB hard cap.
- [ ] T011 Obtain fresh Amazon Q and Gemini reviews of the final PR head.

## Dependencies and execution order

- T001 precedes T002–T005.
- T006 and T007 can run after the source repair.
- T008 is a prerequisite for T009 in the Visual QA workflow.
- T010 and T011 are independent of the Playwright visual-regression step once the PR head is stable.

## Implementation strategy

Keep the source repair confined to `components/LuckyGenerator.tsx`. Do not redesign animation effects or broaden the performance task. Treat synthetic benchmark timings as micro-benchmark data only; real browser performance is unmeasured.

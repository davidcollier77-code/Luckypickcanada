# Tasks: Gemini Reviewer Source Context

- [x] Read AGENTS.md first; inspect reviewer, workflow, rules, tests, and Amazon Q findings on merged PR #1610.
- [x] Specify the context-retrieval and regression requirements.
- [x] Plan implementation and test coverage.
- [x] Implement bounded source retrieval at immutable head/base SHAs and relevant relative-import context.
- [x] Strengthen prompt and deterministic task-group fallback; add focused regression tests.
- [ ] Run targeted/full Vitest and required repository verification in CI; resolve failures.
- [ ] Inspect exact final diff and all current-head checks.
- [ ] Verify live-model behavior against the AVIF/WebP regression when a suitable review can run; do not infer model accuracy from unit tests alone.

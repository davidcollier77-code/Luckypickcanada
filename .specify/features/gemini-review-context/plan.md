# Plan: Gemini Reviewer Source Context

1. Add bounded read-only retrieval for changed source at immutable head SHA and a small number of base versions.
2. Resolve relative imports using the trusted Git tree index; cache source and cap files, characters, and fallback API probes when the tree is unavailable.
3. Include only batch-relevant source context and strengthen end-to-end reasoning for async scheduling/call paths and image format selection, including the risk that typed AVIF and WebP preloads can both fetch.
4. Improve deterministic task-group fallback to avoid over-selecting groups due to generic title words.
5. Add focused Vitest tests for control-flow evidence and non-mutually-exclusive typed image preloads while preserving trusted base-branch execution and opt-in-only suggestions.
6. Verify syntax/tests through CI and inspect a live review against the PR #1610 preload mismatch and the possible double-preload consequence; live-model correctness remains unproven until actually exercised.

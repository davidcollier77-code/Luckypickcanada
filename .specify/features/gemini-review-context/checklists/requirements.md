# Requirements checklist

- [x] Immutable PR head/base commit references.
- [x] Read-only source and import retrieval; PR code is never executed.
- [x] Bounded file/character budget, fallback import-API probe count, and explicit context limitations.
- [x] End-to-end reasoning and image preload/source/srcSet/sizes prompt checks.
- [x] Async ordering checks trace callback scheduling, reads/writes, and reachable direct/synchronous paths; uncertain paths are not described as proven defects.
- [x] Typed AVIF/WebP preload guidance accounts for browsers supporting both formats and avoids recommending duplicate downloads by default.
- [x] Review summaries distinguish red actionable issues, green evidence-backed positives, and yellow incomplete coverage.
- [x] Suggested fixes use a collapsible dropdown with a copy-friendly text block and separate code block when available.
- [x] Green Gemini verdict is not presented as merge approval; required GitHub checks/reviews are still called out.
- [x] Reviewer JavaScript syntax regression corrected; current-head CI must still verify parsing and test execution.
- [x] Existing model fallback chain and trusted workflow unchanged.
- [x] Unit regression tests added.
- [ ] CI tests pass on exact PR head.
- [ ] Live-model review demonstrates the intended regression catch.
- [x] Automatic initial review invokes bounded source context instead of pre-declaring itself patch-only.
- [x] Changed-source file and character budgets produce explicit coverage limitations; all text patches remain in review batches.
- [x] Gemini CLI and Gemini Deep Research references are optional and blocked unless task relevance is directly supported.
- [x] Regression assertions cover source-context limits, all-patch batching, ordinary tasks, CLI tasks, Deep Research tasks, and document-routing meta tasks.
- [ ] Focused reviewer tests and full repository CI pass on the exact PR head.
- [ ] A completed live review confirms the intended default source context and selective document behavior.


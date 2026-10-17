# Plan — Crystal Ball Text Reveal Polish

1. Keep the existing Crystal Ball component and audio behavior intact; reconcile the PR with the latest `main` tree without reverting unrelated changes.
2. Ensure the file contains exactly one `CrystalBall` default component export. Rebuild from the first PR implementation and reapply the intended follow-up changes rather than retaining an appended duplicate.
3. Use `Array.from(currentFortune)` for code-point iteration, and keep reveal counts aligned with that same representation.
4. Group characters into word wrappers with `white-space: nowrap`; render newline tokens as standalone `<br>` elements.
5. Keep the 20 ms base typing cadence, 125 ms punctuation pause, and `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
6. Include `prefersReducedMotion` in the relevant effect/callback dependency arrays so a mid-session preference change is not read through a stale closure.
7. Run focused Crystal Ball interaction coverage, repository tests/type/governance checks, production/OpenNext validation, and the hard build-size gate. Do not claim verification until actual results are available.

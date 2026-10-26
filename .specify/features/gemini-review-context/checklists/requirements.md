# Requirements checklist

- [x] Immutable PR head/base commit references.
- [x] Read-only source and import retrieval; PR code is never executed.
- [x] Bounded file/character budget and explicit context limitations.
- [x] End-to-end reasoning and image preload/source/srcSet/sizes prompt checks.
- [x] Existing model fallback chain and trusted workflow unchanged.
- [x] Unit regression tests added.
- [ ] CI tests pass on exact PR head.
- [ ] Live-model review demonstrates the intended regression catch.

# Requirements Quality Checklist: Restore Shared Sky Backgrounds

- [x] Scope is limited to reverting the theme stylesheet import arrangement and protecting it with a route-level regression test.
- [x] Acceptance scenarios cover the homepage, Crystal Ball, and Lucky Map shared backdrop.
- [x] The fix explicitly preserves Lucky Meter and Lucky Card Reveal components, artwork, wording, and interactions.
- [x] CSS and image assets are not redesigned or regenerated.
- [x] Regression test checks the computed image source and stacking/transparency rules.
- [ ] Targeted and full browser checks pass on the repaired commit.
- [ ] ./jules-verify.sh, full tests, TypeScript, production/OpenNext build and 495 MiB size gate pass on current head.

# Requirements Checklist — Spec 227

## Completeness

- [x] Every owner requirement maps to an FR (banner, cups, spout, bowl, two destinations, copy, countdown, colours, audio, background, performance, build limit).
- [x] Each of the six user stories is independently testable.
- [x] Edge cases cover no-WebGL, context loss, reduced motion, refresh mid-flight and landscape phones.

## Clarity

- [x] Result destinations are named by role: bowl = colour, plaque = number.
- [x] "Independent transfer" is defined as clearing the bowl and spout with measurable distances.
- [x] Copy changes are stated verbatim.

## Consistency

- [x] No requirement changes a storyboard timing value.
- [x] No requirement adds a dependency, audio file or renderer.
- [x] Background preservation is explicit and testable by diff.

## Testability

- [x] Layout requirements are expressed as viewport-bound assertions.
- [x] Audio requirements are expressed as cue offsets against storyboard constants.
- [x] Colour requirements are expressed per season, twelve ids each.
- [x] Build requirement is a measured byte total against a hard limit.

## Governance

- [x] Protected-file change (`app/globals.css`) recorded and justified.
- [x] No QA check weakened; outdated layout assertions rewritten at equal strictness.

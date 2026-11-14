# Research: Lucky Meter Daily Experience

**Date**: 2026-11-14 | **Feature**: `specs/158-lucky-meter-daily-experience/`

## Existing implementation (inspected, not assumed)

- `components/DailyResonance.tsx` (1,234 lines) owned the reveal, Local Storage
  (`lucky_lastDate`, `lucky_lastPct`, `lucky_lastQuote`), a GSAP timeline, a 2D
  canvas effects loop and Howler cues. It generated `Math.floor(Math.random()*101)`,
  so 0% was possible, and it reused the event name as the "tier".
- `components/daily-reset-countdown.js` is the single countdown store used by
  Card Reveal, Crystal Ball and the Lucky Meter; `app/lib/daily-reset.js` builds
  the next local midnight with the local `Date` constructor, so DST days are
  23/25 hours rather than assumed 24.
- `/lucky-meter` renders `DailyResonance` on the Milky Way artwork
  (`/images/lucky-meter-night-sky.*`), an Aurora canvas and a translucent dim
  layer. `/widget/daily-meter` renders the same component with `isCompact`.
- `tests/visual/crystal-ball-daily-limit.spec.ts` seeded the legacy keys to show
  the meter countdown, so the schema change required that seed to be updated.
- The Medallion Gold palette is a measured warm metallic ramp (`gold-3d-btn`,
  `--lp-gold`) rather than saturated yellow; the result UI uses amber/cream
  accents to stay inside it.

## Decisions

### Storage and daily result

Decision: One versioned key, `lucky-pick-canada-lucky-meter-v1`, holding
`{ version, dateKey, result, history }`, with strict validation on read.

Rationale: A complete stored result makes refresh deterministic and removes the
three fragile string keys. Validation rejects corrupt data, wrong schema
versions, impossible percentages, unknown events/colours/Sparks and dates that
do not match the record. Storage access is wrapped so disabled/private/full
storage cannot break the reveal. The shared countdown date key drives rollover,
which also covers open tabs and DST.

### Selection

Decision: Inject `Math.random` into every selector. Percentages draw from
5–100 and retry around the last three values. Event selection uses the full
42/38/20 weight table; when the last two events are identical, the repeated
event is removed and a fresh weighted draw runs over the remaining events.
Colours use a uniform index over twelve definitions. Sparks avoid the recent ids
and fall back to the full list if all 30 are recent.

Rationale: Keeps selection pure and testable, proves the distributions, and
implements "weighted re-selection, not rotation" literally.

### Reveal

Decision: Pure keyframe + sampler module (`reveal.js`) with anchors chosen to
climb to ~90, drop to ~12, jump to ~97, then oscillate. Every sampled value is
clamped to 5–100 and nudged away from the final percentage. The component drives
the visible number with rAF and drives phase changes with `setTimeout`, so the
4.5 s / 0.8 s / 0.6 s beats are deterministic and testable with fake timers.

Rationale: The previous GSAP timeline hid the result but was not testable and
allowed the final value to appear mid-roll. A pure sampler makes the hide
guarantee explicit.

### Visual engine

Decision: WebGL 1, additive blending, one point shader and one procedural haze
shader. Meteors, lightning branch points, firework particles and embers share the
point pipeline; the haze shader supplies clouds and strike light for lightning.
Depth is expressed through size, speed, trail length and alpha; mobile budgets
cut particle counts and DPR.

Rationale: This is GPU-accelerated with low CPU overhead, keeps the Milky Way
untouched because the canvas is transparent and additive, and provides soft
glow/bloom without a costly post-process pass. WebGL failure returns null and the
stage falls back to a static glow while its safety timer completes the sequence.

### Sharing

Decision: `navigator.share` first. `AbortError`/code 20 is a cancellation and
stops immediately without copying. Any other share error may use
`navigator.clipboard.writeText`. No clipboard means a "Sharing unavailable"
status rather than an error.

## References consulted

| Document | Used | Contribution |
|---|---|---|
| `.docs/polishing/_vercel-labs_agent-skills_react-best-practices.md` | Useful | Reinforced narrow effect dependencies, deduplicated global listeners and stable callbacks in the rewritten component/stage. |
| `.docs/polishing/_websites_developer_chrome.md` | Not useful | The snapshot's relevant hit was WebGPU navigation; it did not change the WebGL 1 decision or timing approach. |
| `.specify/memory/constitution.md` | Useful | Confirmed the core sequence, protected systems and the 495 MiB constraint for the plan gates. |

## Freebuff integrations and skills

- `frontend-design` skill: used for restraint, one memorable moment, readable
  hierarchy and a single orchestrated reveal rather than scattered motion.
- GitHub integration: used for authenticated branch push and PR creation.
- Playwright: the repository's browser tool; visual/browser QA is attempted where
  the environment permits and reported honestly when blocked.

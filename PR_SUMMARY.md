# Site-wide metallic gold primary CTA matched to the maple-leaf emblem

## Task and task group
One consistent, realistic golden-yellow colour and reusable raised 3D appearance
for every primary gold CTA, with the assigned leading emoji.

Task group: **`polishing`** — a visual/tactile consistency pass on existing
buttons. No new functionality, route, asset, dependency, API, payment, backend or
deployment change is introduced, so `creation`, `troubleshooting`, `security` and
`audio` do not apply.

## Colour derivation (measured, not assumed)
The button-design reference image supplied with the request is not present in
this worktree (the only root-level image, `copilot_image_1785515250260.jpeg`, is
an unrelated crystal-ball render). The request names the emblem ring as the
primary colour reference, so it was sampled directly with Pillow:

- `public/assets/golden-maple-leaf.webp` (112 × 122 rendered emblem), saturated
  gold pixels (hue 25–55°, saturation ≥ 0.45): specular `#fff2a8` (p99),
  highlight `#fbe59a` (p95), light `#e8c970` (p65), dominant band `#e0b860` /
  `#d8b058`, main `#d7b96c` (p50), dark `#c08f27` (p05).
- `public/assets/golden-maple-leaf.svg` authored gradient stops: face
  `#e9a92f` / `#d28a18` / `#fff0a0`, deep metal `#b86f12` / `#89500a`,
  darkest edge `#714006`.
- `public/flagship-card-golden-maple-clover.png` cross-check: saturated ring gold
  p10 `#daa257`, p50 `#f8dea1`, dominant `#f8e8b8`.

Final ramp (interpolation between the measured stops only — the previous vivid
yellow `#facc15` / `#fbbf24` / `#f59e0b` is no longer used by these CTAs):

| Role | HEX | Source |
| --- | --- | --- |
| specular top | `#fff2a8` | emblem p99 |
| highlight | `#fbe59a` | emblem p95 |
| light | `#e8c970` | emblem p65 |
| main gold | `#dcae4e` | dominant `#e0b860` / `#d8b058` |
| deep | `#b8801f` | p05 `#c08f27` + SVG `#b86f12` |
| raised edge | `#8a550c` | SVG `#89500a` |
| edge shadow | `#5f3705` | SVG `#714006` |
| label | `#1c1200` | warm near-black |

## Implementation result
- `app/globals.css` — one global `.gold-3d-btn` treatment: measured metallic
  gradient, 1px specular border, inset top highlight, inset bottom shade, solid
  `0 3px 0 #8a550c` raised edge plus layered shadows, `-2px` hover/`:focus-visible`
  lift with a 5px edge, `+2px` press with a collapsed 1px edge and 60ms response
  (release returns over 180ms), shared `::after` sheen and `::before` gentle pulse
  for standard CTAs, `.gold-cta-emoji` alignment, and a `prefers-reduced-motion`
  block that removes movement, sheen and pulse while keeping the static edge.
  The sheen/pulse are scoped with `:not(.gold-btn-glow)` so the Tip Jar and
  Suggestion buttons keep their existing effects untouched.
- `themes/default/homepage.css` — the now-duplicated homepage-scoped 3D block is
  removed (single source of truth) and the legacy grouped gold gradient, its
  hover state and the `rounded-full`/`cta-glow` fallback are recoloured.
- `app/homepage/HomePage.js` — nine leading decorative emoji; wording unchanged.
- `app/lucky-map-of-canada/lucky-map-of-canada.js` — five gold CTAs adopt
  `gold-3d-btn`; their bespoke inline gold background/border/shadow is removed so
  the shared depth, hover and press states apply; emoji added.
- `app/lucky-card-reveal.js` — reveal CTA adopts the shared class and ♠; the
  duplicated Tailwind-only shimmer layer is replaced by the shared sheen.
- `components/ResonanceButton.tsx` — Daily Resonance / Lucky Meter CTA adopts the
  shared gold treatment with ✨.
- `app/components/CrystalBall/CrystalBall.tsx` + `.module.css` — both Crystal Ball
  primary states adopt the shared class, ramp and 🔮.
- `app/checkout-modal.js` — secure-checkout submit adopts the shared class and 🔒.
- `app/share-lucky-pick-button.js`, `app/lucky-reveal-popup.js` — inline gold
  gradients, borders and shadows recoloured to the measured ramp with the raised
  edge (📍 added to the map CTA); wording, handlers and existing hover/active
  behaviour preserved.
- `tests/visual/gold-cta.spec.ts` — edge-colour constant follows the measured
  edge (`rgb(138, 85, 12)`); every structural assertion is unchanged.
  `tests/visual/sitewide-gold-cta.spec.ts` — new rendered checks for the
  site-wide ramp, edge, emoji, hover/press/release, the excluded Explore Your
  Luck control and the unchanged secondary About CTA.

## Emoji inventory (wording unchanged)
| Button | Emoji |
| --- | --- |
| Check Lucky Meter | ✨ |
| Reveal Today's Card | ♠ (standalone spade, not an ace card) |
| CONSULT THE ORACLE | 🔮 |
| EXPLORE LUCKY STORIES | 🍀 |
| Choose a Lucky Pick | 🎁 |
| Gift a Lucky Pick | 🎁 |
| Open the tip jar | ❤️ |
| Send suggestion | 💡 |
| Read Our Story (About / More Info) | ℹ️ |
| View Lucky Stories (Lucky Map) | 🍀 |
| Share your lucky story (Lucky Map, both states) | ✍️ |
| Share This Story (Lucky Map) | 🍀 |
| Submit Story (Lucky Map form) | 📜 |
| Reveal Today's Luck (Lucky Card Reveal) | ♠ |
| Seek Fortune / Ask Another Question (Crystal Ball) | 🔮 |
| Reveal My Resonance (Daily Resonance / Lucky Meter) | ✨ |
| Continue to secure checkout (checkout modal) | 🔒 |
| Add me to the Little Luck Map (reveal popup) | 📍 |
| Share Your Luck (already carried 🍀) | 🍀 (existing, no duplicate added) |

Every added emoji sits in `<span class="gold-cta-emoji" aria-hidden="true">`, so
screen readers announce the unchanged button label exactly once.

## Spec Kit stages
| Stage | Artifact |
| --- | --- |
| specify | `specs/064-sitewide-gold-cta/spec.md` |
| plan | `specs/064-sitewide-gold-cta/plan.md` |
| tasks | `specs/064-sitewide-gold-cta/tasks.md` |
| implement | Source changes listed above |

Routed documents consulted: `AGENTS.md`, `.jules/jules.md`, `.jules/polishing.md`,
`.docs/manifest.json`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`.
`.docs/polishing/_websites_mdn_image_types.md` was **not** consulted: USED: NO —
no raster asset is selected, converted or served by this change and the AVIF-first
with WebP fallback delivery is untouched.

## Verification actually run
| Check | Status | Evidence |
| --- | --- | --- |
| `pnpm exec tsc --noEmit` | PASS | exit 0 |
| `pnpm test` | PASS | 22 files / 152 tests |
| `./jules-verify.sh` | PASS | exit 0 — Spec Kit governance gate, typecheck, build, refresh-docs 17/17 |
| Build size gate | PASS | `.next` + `public` = 330,131,271 bytes / 314.84 MiB, below the 495 MiB maximum |
| Served homepage markup | PASS | 9 `gold-3d-btn`, 9 `gold-cta-emoji` in the assigned order with `aria-hidden="true"`, 2 `gold-shimmer`, 2 `gold-btn-glow` |
| Compiled CSS | PASS | shared ramp, `0 3px 0 var(--gold-cta-edge)`, hover 5px edge, `:active` 1px edge, reduced-motion block, sheen/pulse keyframes |
| Rendered `/map` (desktop) Chromium | PASS | 2 gold CTAs, 🍀/✍️ `aria-hidden=true`, `linear-gradient(rgb(255,242,168) … rgb(220,174,78))`, `rgb(138,85,12) 0px 3px 0px` |
| Rendered `/lucky-meter` (desktop, mobile-390, mobile-412) | PASS | ✨, same gradient and edge, heights 50/47/47px |
| Rendered `/about` (all three viewports) | PASS | secondary "Return to Home" still `background-image: none`, not a gold CTA |
| Homepage / Crystal Ball rendered checks | BLOCKED | Container Chromium renderer crashes on `/` and `/crystal-ball`; the identical crash reproduces with this branch stashed (unmodified baseline), so it is environmental. Homepage is covered by served-markup and compiled-CSS evidence instead |
| Hover / press / release at browser level | BLOCKED | Requires the homepage render above; covered by `gold-cta.spec.ts` and `sitewide-gold-cta.spec.ts` in CI |
| Desktop/mobile screenshots | NOT RUN (inconclusive) | Captures in this container stopped at loading/hydration states because of the same renderer instability, so no visual claim is made |

## Behaviour preserved
Button wording, routes and destinations, click/submit handlers, the Suggestion
disabled state, checkout/gift/tip flows, validation and payment behaviour are
unchanged (the diff adds only classes and aria-hidden emoji spans; the Lucky Map
buttons lose only their horizontal inline gold presentation). Tip Jar and
Suggestion keep both existing shimmer overlays and the 3-second `goldBtnGlow`
pulse with its press pause. Explore Your Luck keeps its artwork, clickable area,
confetti and scrolling with no gold class or emoji. Secondary buttons, navigation,
filters, close/back controls, artwork, the emblem, backgrounds, AVIF/WebP delivery,
dependencies and configuration are untouched.

## Remaining issues / risks
- Homepage and Crystal Ball browser rendering cannot be verified in this container
  (environmental renderer crash, reproduced on the baseline); CI Playwright is the
  confirmation path.
- The reference swatch image was unavailable, so the emblem ring was sampled
  directly as instructed; the resulting ramp is measurably warmer and less yellow
  than the previous `#facc15` family.
- The Playwright visual suite must run on a working Chromium to confirm hover,
  press, release and reduced-motion behaviour end to end.

## Final diff / error check
Thirteen modified files plus three new/changed Spec Kit artifacts and one new
visual spec; no unrelated file changed, no merge, no deployment, no force-push.
`next-env.d.ts` was regenerated by the dev server and restored to its committed
content.

USEFUL RESULT: YES — the unified emblem-matched gold CTA, the raised 3D treatment
and the assigned emoji are implemented site-wide, and the colour/depth are
verified by typecheck, unit tests, the governance gate, the build-size gate,
served markup, compiled CSS and rendered computed styles on `/map`, `/lucky-meter`
and `/about`. Homepage and Crystal Ball browser-level rendering remains BLOCKED by
this container's Chromium and is not claimed as verified.

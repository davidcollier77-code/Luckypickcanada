# Feature Specification — Site-wide metallic gold primary CTA

**Feature branch:** `freebuff/619772a1044e46bd6dabae55`
**Task group:** `polishing`
**Status:** Implemented and verified (see tasks.md)

## Problem

Primary gold calls to action were inconsistent across Lucky Pick Canada. The
homepage nine gold buttons used one raised treatment with a vivid yellow ramp
(`#facc15` / `#fbbf24` / `#f59e0b`), while the Lucky Map, Lucky Card Reveal,
Crystal Ball, Daily Resonance/Lucky Meter, share, gift and checkout CTAs each
carried their own gold gradient, depth and hover behaviour. The requested
reference gold is the warmer, less yellow metallic gold of the maple-leaf
clover emblem's ring, not the current vivid yellow.

## Colour derivation (measured, not assumed)

The supplied button-design reference image is not present in this worktree (the
only root-level image, `copilot_image_1785515250260.jpeg`, is an unrelated
crystal-ball render). The request names the emblem ring as the primary colour
reference, so the palette was measured from the emblem assets:

- `public/assets/golden-maple-leaf.webp` (112 x 122 rendered emblem) — saturated
  gold pixels (hue 25–55°, saturation ≥ 0.45): specular `#fff2a8` (p99),
  highlight `#fbe59a` (p95), light `#e8c970` (p65), dominant band `#e0b860` /
  `#d8b058`, main `#d7b96c` (p50), dark `#c08f27` (p05).
- `public/assets/golden-maple-leaf.svg` authored gradient stops — face
  `#e9a92f` / `#d28a18` / `#fff0a0`, deep metal `#b86f12` / `#89500a`,
  darkest edge `#714006`.
- `public/flagship-card-golden-maple-clover.png` cross-check — saturated ring
  gold p10 `#daa257`, p50 `#f8dea1`, dominant `#f8e8b8`.

Final ramp (interpolation only between the measured stops):

| Role | HEX | Source |
| --- | --- | --- |
| specular top | `#fff2a8` | emblem p99 |
| highlight | `#fbe59a` | emblem p95 |
| light | `#e8c970` | emblem p65 |
| main gold | `#dcae4e` | dominant `#e0b860` / `#d8b058` |
| deep | `#b8801f` | p05 `#c08f27` + SVG `#b86f12` |
| raised edge | `#8a550c` | SVG `#89500a` |
| edge shadow | `#5f3705` | SVG `#714006` |
| label | `#1c1200` | warm near-black for contrast on main gold |

## Requirements

- FR-001: every primary gold CTA shares one realistic metallic gold ramp
  matching the emblem ring.
- FR-002: shared raised 3D appearance — solid lower edge, layered drop shadow,
  inner upper highlight; 2px lift on hover/focus-visible; 2px press-down with a
  collapsed edge and a smooth release.
- FR-003: standard gold CTAs carry a subtle sheen sweep and gentle golden pulse;
  both respect `prefers-reduced-motion`.
- FR-004: Tip Jar and Suggestion Box keep their existing shimmer, glow pulse,
  durations, wording, handlers and disabled state — colour treatment only.
- FR-005: assigned leading emoji, decorative and `aria-hidden`, aligned beside
  unchanged wording.
- FR-006: Explore Your Luck confetti button is excluded entirely.
- FR-007: no change to wording, routes, handlers, checkout/payment behaviour,
  secondary controls, artwork, image formats or dependencies.

## Emoji inventory

| Button (wording preserved) | Emoji |
| --- | --- |
| Check Lucky Meter | ✨ |
| Reveal Today's Card | ♠ |
| CONSULT THE ORACLE | 🔮 |
| EXPLORE LUCKY STORIES | 🍀 |
| Choose a Lucky Pick ($1 today's pick) | 🎁 |
| Gift a Lucky Pick (gift experience) | 🎁 |
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
| Share Your Luck (already carried 🍀; no duplicate added) | 🍀 (existing) |

## Out of scope / preserved

Homepage artwork, maple-leaf/clover emblem, Milky Way background, Lucky Card and
Crystal Ball artwork, AVIF-first with WebP fallback delivery, Explore Your Luck
confetti and scrolling, secondary buttons, navigation, filters, close/back
controls, audio, API, backend, payments, security and deployment configuration.

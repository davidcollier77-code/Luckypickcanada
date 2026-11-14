# Data Model: Lucky Meter Daily Experience

**Feature**: `specs/158-lucky-meter-daily-experience/`

## Storage record

Key: `lucky-pick-canada-lucky-meter-v1` (Local Storage only, no server copy)

```json
{
  "version": 1,
  "dateKey": "2026-11-14",
  "result": {
    "dateKey": "2026-11-14",
    "percentage": 53,
    "tier": { "id": "medium", "label": "Medium Resonance", "message": "Your luck is in the mid-range today." },
    "event": { "id": "lightning", "name": "Cosmic Lightning", "numbers": [11, 22, 33] },
    "colour": { "id": "cream", "name": "Cream", "hex": "#F1E8D5" },
    "spark": { "id": "spark-16", "message": "Your attention is a gift; spend a little of it on something you love." },
    "createdAt": 1763136000000
  },
  "history": {
    "percentages": [53, 12, 88],
    "events": ["lightning", "meteor", "fireworks"],
    "sparks": ["spark-16", "spark-04", "spark-22"]
  }
}
```

### Rules

- `dateKey` is the visitor's local `YYYY-MM-DD` (`getLocalDateKey`).
- `percentage` is an integer 5–100. A stored 0, a decimal, or an out-of-range
  value invalidates the result.
- `tier` is always recomputed from the percentage and the canonical definition,
  so a tampered tier label cannot render.
- `event`, `colour` and `spark` are canonicalised from their ids; numbers are
  always the event's fixed list.
- `history.percentages` holds at most the last 3 valid percentages, newest first.
- `history.events` holds at most 6 recent event ids; `history.sparks` at most 8.
- A result whose `dateKey` differs from today is kept for history but never shown
  as today's reading.
- Any parse, schema-version or validation failure yields `{ result: null,
  history: empty }`; the page still generates and displays a result for the
  current visit.

## Canonical definitions

### Tiers

| id | Range | Message |
|---|---|---|
| low | 5–39 | You're riding a little low today, but you're still okay! |
| medium | 40–79 | Your luck is in the mid-range today. |
| high | 80–100 | Your luck is running high today! |

### Events

| id | Name | Weight | Numbers | Duration |
|---|---|---|---|---|
| meteor | Meteor Shower | 42% | 3, 9, 21 | 8.5–9.5 s |
| lightning | Cosmic Lightning | 38% | 11, 22, 33 | 9.5–10.5 s |
| fireworks | Fireworks | 20% | 7, 8, 77 | 11–12 s |

### Colours

Maple Red `#B52B32`, Forest Green `#28543C`, Navy Blue `#23395B`, Burgundy
`#722F3E`, Royal Blue `#2855A6`, Charcoal `#45484D`, Cream `#F1E8D5`, Mustard Gold
`#C49A35`, Winter White `#F7F5EF`, Deep Teal `#28666B`, Pumpkin Orange `#C96A25`,
Warm Camel `#B68A5A` — uniform probability.

### Little Sparks

`app/lib/lucky-meter/little-sparks.js` exports `LITTLE_SPARKS`: 30 objects with
`{ id: 'spark-NN', message }`. Selection stores only the id; the message is read
from the canonical file so editing wording stays possible.

## Component state

| State | Meaning |
|---|---|
| `result` | Today's complete result or null |
| `isRevealing` | 4.5 s scramble is running |
| `isRevealed` | Landing has occurred; percentage/tier visible |
| `isFlashing` | The 2–3 landing flashes are running |
| `detailsVisible` | Colour, numbers, Spark and event are visible |
| `stageActive` | The cinematic stage is mounted |
| `stageDuration` | This run's duration inside the event window |
| `shareStatus` | idle / copied / failed |
| `reducedMotion` | Match-media preference |

## Lifecycle

1. Mount: read storage, load history, show today's result if valid.
2. Reveal: select → validate → persist with updated history → scramble.
3. Landing → flash → details → stage.
4. Stage completes or safety timer fires: unmount the stage; keep the result.
5. Countdown date change: clear timers, reset to unrevealed, keep history.
6. Unmount: cancel timers/rAF, unload owned sounds, destroy the GL engine.

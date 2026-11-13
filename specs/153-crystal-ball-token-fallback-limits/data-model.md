# Data Model: Crystal Ball Token Budgets and Fallback Resilience

## Daily usage record

Browser key: `luckyPickCanada:crystalBallDailyFortune:v1`

| Field | Type | Notes |
| --- | --- | --- |
| `date` | `YYYY-MM-DD` | Visitor's local calendar day; any other date is discarded |
| `fortuneUsed` | boolean | Counts only when a usable fortune is stored |
| `fortune` | string \| null | Daily fortune text, preserved across reloads |
| `followUpUsed` | boolean | Counts only when a usable fortune is stored |

Removed: `followUpQuestion`, `followUpAnswer`. Legacy values are ignored during normalisation and
are not written back.

## Fallback history record

Browser key: `luckyPickCanada:crystalBallFallbackFortune:v1`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable fallback identifier, for example `seasonal-winter-03` |
| `date` | `YYYY-MM-DD` | Local date on which the fallback was delivered |

Only these two fields are stored. A malformed record is discarded.

## Fallback fortune entry (in memory)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Pool namespace plus one-based index; unique across the 197 readings |
| `text` | string | Existing curated reading, unchanged |

## Selection contract

`getFallbackFortuneEntry(context, random, { excludeId })` builds the same weighted candidate list as
before, filters `excludeId` when present, and falls back to the unfiltered list if filtering would
empty the list. `getFallbackFortune()` keeps returning the reading string for existing callers.

## Follow-up outage result

The oracle returns HTTP 503 with `{ error: <exact message>, unavailable: true }` for a follow-up
provider failure. No `reading`, `fortune` or `prediction` field is present.

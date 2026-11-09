# Data Model: Crystal Ball Daily Fortune Experience

## DailyCrystalBallState

Stored under `luckyPickCanada:crystalBallDailyFortune:v1` in browser `localStorage`.

| Field | Type | Rules |
|---|---|---|
| `date` | string | Visitor-local `YYYY-MM-DD`; any other date starts a fresh state. |
| `fortuneUsed` | boolean | True only after a usable reading was received and saved. |
| `fortune` | string \| null | The delivered reading, trimmed, at most 2,000 characters. |
| `followUpUsed` | boolean | True only after a usable follow-up answer was received and saved. |
| `followUpQuestion` | string \| null | The submitted follow-up, sanitized, at most 120 characters. |
| `followUpAnswer` | string \| null | The delivered follow-up reading, trimmed, at most 2,000 characters. |

### Transitions

- **Load**: read the stored state; if the date is not today, return a fresh state with no fortune and both flags false.
- **Generate success**: set `fortuneUsed = true` and `fortune = reading`; a fallback reading counts, a failed or empty response does not.
- **Follow-up success**: require `fortune` and `fortuneUsed`; set `followUpUsed = true`, `followUpQuestion`, and `followUpAnswer`. A fallback answer counts, a failed or empty response does not.
- **Cross-tab**: a `storage` event re-reads the same key so every tab shows the same fortune and follow-up state.
- **Local midnight**: the shared clock's `dateKey` changes, causing the client to re-read and start a fresh state.
- **Storage unavailable**: keep the same shape in module memory for the page lifetime.

## DailyResetClock

| Field | Type | Meaning |
|---|---|---|
| `dateKey` | string | Visitor-local `YYYY-MM-DD` for the current instant. |
| `deadlineMs` | number | Epoch milliseconds of the next local midnight, built with the local calendar constructor. |
| `remainingMs` | number | `max(0, deadlineMs - now)`. |
| `formatted` | string | `HH:MM:SS`, hours may be `23`, `24` or `25` on daylight-saving boundaries. |

One module-level store owns the single one-second interval, focus/visibility/page-show listeners and the shared snapshot. Every countdown consumer reads the same snapshot; wording and styling remain local to each display.

## FortuneContext

Computed server-side from the validated local date sent by the browser:

| Field | Type | Meaning |
|---|---|---|
| `localDate` | string | Validated `YYYY-MM-DD`. |
| `weekday` | string | Determined from the calendar date, never guessed by the model. |
| `monthName`, `year` | string, number | Calendar context. |
| `season` | `winter` \| `spring` \| `summer` \| `autumn` | Canadian season for the date. |
| `holiday` | object \| null | Today's Canadian holiday and its name. |
| `upcoming` | array | Holidays in the next 45 days with their dates and days remaining. |

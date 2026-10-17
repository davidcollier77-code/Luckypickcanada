# Data Model: Visitor-Local Crystal Ball Usage

## Stored value

The versioned browser key `luckyPickCanada:crystalBallDailyQuestions:v1` stores:

- `date`: visitor-local calendar date in `YYYY-MM-DD` format.
- `used`: number of completed AI-backed answers for that local date, bounded from 0 to 3.

## Reset

On reading, values for a prior local date or malformed/out-of-range values are treated as a fresh allowance. The next reset instant is calculated using local midnight, not UTC midnight or a fixed 24-hour duration.

## Failure behavior

If localStorage is unavailable, an in-memory module value retains the count for the current page lifetime. Clearing browser storage can reset/bypass the count; this is an accepted product limitation. No persistent server-side daily quota entity is retained.

# Research: Crystal Ball Browser-Local Daily Allowance

## Confirmed existing behavior

- The prior Oracle route reserved three daily AI-answer slots using SHA-256-derived client-IP keys in Redis, Cloudflare KV, or process memory.
- The Crystal Ball client fetched `GET /api/oracle` on mount to obtain quota state; it also refreshed state from POST responses.
- The API route already applied a separate request limiter of 10 requests per 60 seconds for the `oracle` action.
- The UI already displayed the remaining question count and disabled the submission button when remaining usage was zero.
- The Lucky Meter uses browser-local calendar date keys and computes next local midnight with the local `Date` constructor.

## Design decisions

- Reuse the local-date pattern without sharing or changing Lucky Meter storage.
- Version the new localStorage key so the data has a clear namespace: `luckyPickCanada:crystalBallDailyQuestions:v1`.
- Store no IP address, hashed IP identifier, or daily quota state on the server. The remaining short-window rate limit can still use its current IP-based identifier.
- Keep the counter focused on completed AI-backed answers; fallback responses do not use an allowance slot.
- Client storage is intentionally bypassable by clearing or editing it, as explicitly accepted by the user. This trade-off should not be described as secure abuse prevention.
- Run CI for actual code execution because this connected session can commit/read through the GitHub API but has no local repository checkout.

# Oracle Quota API Contract

## GET /api/oracle

Purpose: retrieve the current visitor's daily allowance.

Successful response (200) contains a quota object:
- limit: number, configured as 3
- used: number of completed AI-backed answers
- remaining: number of questions remaining after completed and pending reservations
- resetAt: ISO-8601 timestamp for the next UTC midnight

The route returns Cache-Control: no-store and preserves the current CORS allowlist. If quota storage is unavailable, respond with 503 and a temporary-unavailable message rather than bypassing cost protection.

## POST /api/oracle

Preserve the existing question fields, input sanitization, maximum question length, prompt-injection filters, ten-requests-per-minute IP rate limit, and response aliases prediction, fortune, and reading.

- AI success: HTTP 200, existing answer fields, source=ai, and current quota.
- Daily limit exhausted: HTTP 429, a clear daily-limit message, and current quota.
- Short-term rate limit exhausted: HTTP 429 with the existing wait-a-moment message.
- Missing AI credentials, network error, timeout, upstream error, or empty AI content: return the existing fallback fortune and quota where available, without consuming the daily AI-answer allowance.
- Quota store failure: HTTP 503, no AI provider request is made.

## Audio

Audio is client-only and does not alter the Oracle API. It uses same-origin files and cannot delay or invalidate a response.

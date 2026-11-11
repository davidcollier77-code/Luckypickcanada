# Implementation Plan: Cloudflare Issue Remediation

**Branch**: `freebuff/a3ef72773064149acdf6c2ce` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

Treat the six open Workers Issues as two different classes of problem. The five
"Potential vulnerability scan" issues are external inbound probes; disposition
them with fresh occurrence-level and live-production evidence, without changing
application code. The Oracle issue is a real defect: `openai/gpt-oss-20b`
spends part of its completion budget on reasoning, so the old 250-token
`max_tokens` budget could be consumed before any visible content was emitted.
Fix it by using the supported `max_completion_tokens` field with headroom and
low reasoning effort, keep the existing fallback, and log enough to diagnose a
recurrence.

While verifying the Crystal Ball, add the visitor's local time to the calendar
facts (the route received only a date and a time-zone name) and complete the
federal holiday set with Labour Day and the National Day for Truth and
Reconciliation.

## Technical Context

- Next.js App Router 16.4.3 route handler `app/api/oracle/route.js`.
- Groq OpenAI-compatible chat completions; model `openai/gpt-oss-20b`.
- Client `app/crystal-ball-client/CrystalBallClient.js` sends `mode`,
  `localDate` and `timeZone`; add `localTime` (`HH:MM`, 24-hour).
- Vitest coverage in `__tests__/oracle-route-validation.test.js`.
- Cloudflare Workers Observability API retains issue occurrences; the
  `CLOUDFLARE_API_TOKEN` in this environment has read access.
- Deploy workflow resolves a Cloudflare issue only when the deployed fix names
  it with a `Cloudflare-Issue: <uuid>` trailer in the commit or pull request.

## Root-cause research

- Groq's API reference marks `max_tokens` deprecated in favour of
  `max_completion_tokens`, and documents `reasoning_effort` for gpt-oss models
  (<https://console.groq.com/docs/api-reference>).
- For reasoning models both the reasoning trace and the visible answer share the
  completion budget. If the budget runs out during reasoning the API returns
  HTTP 200 with empty `message.content` and `finish_reason: "length"`.
- The retained Cloudflare occurrence for `9d04f7f8…` is a `POST /api/oracle`
  from the production origin returning 200, which is the route's fallback path
  after logging the empty-content error.

## Decisions

1. **Do not change the fallback contract.** It still returns HTTP 200 with a
   usable Canadian reading, so a provider failure never breaks the experience
   or consumes the visitor's allowance with nothing.
2. **Use `max_completion_tokens: 1024` and `reasoning_effort: "low"`.** Enough
   budget for reasoning plus a two-to-four-sentence fortune, and lower latency
   than the default medium effort.
3. **Log a structured reason** (mode, finish reason, completion and reasoning
   tokens) when content is missing, without prompts, readings or credentials.
4. **Validate local time on the server.** Accept only `HH:MM`; the local date
   remains the sole source of date, weekday, season and holiday facts.
5. **Add Labour Day and the National Day for Truth and Reconciliation** to the
   holiday calendar and give each a small holiday fallback pool.
6. **Do not change Cloudflare edge configuration.** Suppressing the scan
   detections requires owner authorisation for a WAF/security rule.

## Verification Plan

- Targeted Vitest runs for the Oracle route and the Crystal Ball daily
  allowance/greetings.
- Live Cloudflare occurrence review for all six issue IDs.
- Live production probes of representative scanner paths.
- `./freebuff-verify.sh`, type check, production build and build-size
  measurement.
- Browser QA of `/crystal-ball` for the daily fortune and follow-up.

## Preserved behaviour

Rate limiting, validation, sanitization, prompt-injection checks, CORS,
Turnstile, gifts/payments, the daily allowance, audio and artwork are unchanged.

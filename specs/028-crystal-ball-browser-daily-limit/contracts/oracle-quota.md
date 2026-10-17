# Oracle POST Contract After Daily-Quota Removal

## POST /api/oracle

The API no longer exposes daily usage through GET and does not reserve a persistent daily IP-based quota. The visitor-facing daily allowance is held in localStorage by the Crystal Ball client.

- Keep existing CORS allowlist and no-store response header.
- Preserve the existing short-window request limit: 10 requests per minute for action `oracle`.
- Accept the existing `message`, `prompt`, or `question` string fields, sanitize input, enforce the 120-character maximum, and reject configured prompt-injection patterns.
- Missing, non-string, empty, malformed, oversized, and filtered questions return HTTP 400 before the AI provider fetch.
- Successful AI response keeps the `prediction`, `fortune`, `reading`, and `source: 'ai'` fields.
- Missing API credentials, upstream errors, timeout, or empty provider content return the existing generic fallback fortune with `source: 'fallback'`; these do not consume a client AI-answer slot.
- Rate-limit responses remain HTTP 429.

The browser counter is a convenience and usage cap for ordinary visitors, not a security boundary: users can clear or edit localStorage.

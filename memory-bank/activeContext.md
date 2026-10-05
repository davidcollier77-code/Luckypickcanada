# Active Context

## Current Goals
- Investigate the security/DNS scan discrepancy between the root domain (`luckypickcanada.ca`) and the `www` hostname (`www.luckypickcanada.ca`).

## Recent Work
- Investigated HTTP redirect behavior, verifying that `www.luckypickcanada.ca` correctly issues a 301 Permanent Redirect to `https://luckypickcanada.ca` via `next.config.mjs` and Cloudflare.
- Investigated application code (`app/api/send-gift/route.ts`, `app/gift-email.js`, `app/suggestions.js`) and confirmed emails are strictly sent from the root domain (`@luckypickcanada.ca`), utilizing Resend.
- Confirmed that the `www` hostname does not, and should not, send emails.
- Concluded that the low scanner score (74/100 - F) for `www.luckypickcanada.ca` due to missing SPF, DMARC, and DKIM records is a scanner limitation (applying email-auth checks to a redirect hostname).
- Documented findings in `PR_SUMMARY.md`. No code or DNS changes are required or recommended.

## Open Questions
- None. The investigation is complete.

## Pending Verification
- Final review of the investigative PR Summary.

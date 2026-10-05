# Sentinel Specialist

## Mandatory Standing Resources
For all tasks, you MUST actually consult the following resources:
- Jules Documentation "jules.google/docs"
- Jules API "developers.google.com/jules/api"
- Gemini CLI "/google-gemini/gemini-cli"
- Gemini API "/websites/ai_google_dev_gemini-api"

## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- TypeScript "/microsoft/typescript"
- Zod "/colinhacks/zod"
- DOMPurify "/cure53/dompurify"
- Sentry Docs "/getsentry/sentry-docs"
- Stripe.js "/stripe/stripe-js"
- Resend "/resend/resend-node"
- Neon "/neondatabase/neon"
- Upstash Docs "/upstash/docs"
- GitHub Docs "/github/docs"
- Chrome Developer "/websites/developer_chrome"
- Apple WebKit Developer "/websites/developer_apple_webkit"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

## 2026-10-03 - DMARC & DKIM DNS Authentication
**Learning:** Security scanner reports regarding missing DNS authentication records (DMARC/DKIM/SPF) often require verifying external DNS configurations rather than application codebase logic. Missing root domain records (e.g. DMARC `v=DMARC1; p=none`) must be added externally at the provider (Cloudflare), while existing DKIM records on provider-specific subdomains (e.g., `resend._domainkey`) may trigger false positives in generic scanners if the scanner looks for a default selector.
**Action:** Investigated missing DMARC and DKIM reports. Verified external DNS configuration via `dig TXT _dmarc.luckypickcanada.ca` and `dig TXT resend._domainkey.luckypickcanada.ca`. Blocked any unsupported changes to external infrastructure from the application codebase context, and provided explicit remediation instructions to the domain owner to be implemented in Cloudflare.

## 2026-10-03 - Root SPF & DMARC Verification
**Learning:** When addressing missing SPF records for root domains, it is critical to verify the actual email sending architecture in the codebase (e.g., verifying `Resend` is the exclusive sender via `grep` analysis) to formulate the correct SPF record (`v=spf1 include:amazonses.com ~all`), rather than blindly guessing or assuming existing subdomain records (`send.luckypickcanada.ca`) apply to the root.
**Action:** Analyzed codebase sending patterns. Verified missing root DNS records. Blocked unauthorized external DNS modifications and provided precise remediation instructions for Cloudflare.

## 2026-10-04 - Distributed Rate Limiting & Webhook Idempotency
**Learning:** In serverless/edge environments like Cloudflare Workers (via OpenNext), in-memory data structures (like `Map`) used for rate limiting or deduplication are ephemeral per-isolate and do not provide effective global protection. Also, asynchronous payment webhooks combined with GET-based redirect flows can create race conditions if the GET route relies solely on its own invocation to finalize a transaction.
**Action:** Migrated rate-limiting and deduplication logic in `app/spam-protection.js` to utilize Upstash Redis for distributed state, falling back to in-memory maps only if Redis is unavailable. Hardened `app/api/gift-delivery/route.js` to act strictly as a fallback mechanism, relying primarily on Stripe webhooks for delivery while ensuring idempotency by checking `metadata.giftDeliveredAt`.
## 2024-11-20 - [Payment Security] Idempotency in Gift Fulfillment
**Learning:** Checking a flag on a remote record (Stripe Metadata) and then acting before writing the update creates a significant race condition gap, especially when fallback GET routes and asynchronous POST webhooks converge simultaneously.
**Action:** Implemented a short-lived atomic Redis lock (`SET NX` with a unique owner token) keyed to the Stripe `session.id` to prevent overlapping gift-email deliveries across distributed worker instances. Remaining window: the lock only holds for its TTL, so a redelivery remains possible after expiry if the email succeeded but the later Stripe metadata update failed. A longer-lived `gift_sent` marker (7 day TTL) is written once the email is out and is checked before every delivery attempt, which closes that window for the duration of the marker.

## 2024-11-20 - [Payment Security] Server-Side Verification for Client Reveals
**Learning:** Client-side URL parameters (`?payment=success&session_id=...`) can easily be spoofed to trigger high-value experiences if the client doesn't call back to a trusted server environment to verify the session state.
**Action:** Refactored the `HomePage` to pause on `payment=success`, ping a new secure `/api/verify-session` endpoint, and only proceed to the `LuckyReveal` once the backend affirmatively verifies the Stripe session `payment_status === 'paid'`.

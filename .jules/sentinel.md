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

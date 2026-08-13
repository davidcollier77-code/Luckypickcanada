## 2024-08-12 - [Security Enhancement] Rate Limiting Bypass via IP Spoofing
**Vulnerability:** The `getClientIp` function in `app/spam-protection.js` prioritized the `x-forwarded-for` header over `cf-connecting-ip`.
**Learning:** This could allow a malicious user to bypass rate limits or spam block by spoofing the `x-forwarded-for` header. Since the app is hosted behind Cloudflare, `cf-connecting-ip` is the authoritative source for the client IP.
**Prevention:** Always prioritize trusted headers provided by the CDN/WAF over easily spoofed headers like `x-forwarded-for`.
## 2024-08-12 - [Security Enhancement] Error Message Information Leakage Prevention
**Vulnerability:** The Stripe checkout error handling in `app/api/checkout/route.js` could expose raw exception messages to the client.
**Learning:** Returning `error.message` directly in URL parameters during a catch block could leak sensitive internal application structure, third-party API details, or environment configurations to users if an unhandled exception occurred.
**Prevention:** Always replace unhandled internal exceptions with a static, generic error message (e.g. "Unable to start checkout. Please try again.") when communicating failures to the client. Keep the detailed errors isolated in secure server logs (e.g., `console.error()`).

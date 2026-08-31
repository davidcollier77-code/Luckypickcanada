## 2024-08-12 - [Security Enhancement] Rate Limiting Bypass via IP Spoofing
**Vulnerability:** The `getClientIp` function in `app/spam-protection.js` prioritized the `x-forwarded-for` header over `cf-connecting-ip`.
**Learning:** This could allow a malicious user to bypass rate limits or spam block by spoofing the `x-forwarded-for` header. Since the app is hosted behind Cloudflare, `cf-connecting-ip` is the authoritative source for the client IP.
**Prevention:** Always prioritize trusted headers provided by the CDN/WAF over easily spoofed headers like `x-forwarded-for`.
## 2024-08-12 - [Security Enhancement] Error Message Information Leakage Prevention
**Vulnerability:** The Stripe checkout error handling in `app/api/checkout/route.js` could expose raw exception messages to the client.
**Learning:** Returning `error.message` directly in URL parameters during a catch block could leak sensitive internal application structure, third-party API details, or environment configurations to users if an unhandled exception occurred.
**Prevention:** Always replace unhandled internal exceptions with a static, generic error message (e.g. "Unable to start checkout. Please try again.") when communicating failures to the client. Keep the detailed errors isolated in secure server logs (e.g., `console.error()`).
## 2024-08-17 - [Security Enhancement] Overly Permissive CORS Configuration
**Vulnerability:** The `functions/api/oracle.js` Cloudflare function used `Access-Control-Allow-Origin: "*"` which allowed any domain to make cross-origin requests to this endpoint. This could potentially allow malicious sites to interact with the API on behalf of a user.
**Learning:** Cloudflare Pages functions and other edge functions often have a permissive default or copy-pasted configuration for CORS. It is critical to restrict CORS origins to only trusted domains.
**Prevention:** Always set `Access-Control-Allow-Origin` to specific, trusted domains rather than using a wildcard (`*`).
## 2024-08-18 - [Security Fix] Length-Based Timing Leak in Secret Verification
**Vulnerability:** The test gift email endpoint (`/api/admin/test-gift-email/route.js`) implemented a length equality check (`configured.length === provided.length`) before performing a constant-time comparison (`crypto.timingSafeEqual`). This allows an attacker to deduce the exact length of the `GIFT_TEST_SECRET` via a timing attack.
**Learning:** Checking lengths before  defeats the purpose of the constant-time check, as it short-circuits and returns early for mismatched lengths, creating measurable timing discrepancies.
**Prevention:** When comparing secrets of potentially variable lengths, securely hash both the expected and provided secrets to a fixed length (e.g., using SHA-256) before passing them to the constant-time comparison function.
## 2026-08-31 - [MEDIUM] Length-Based Timing Leak in Secret Verification
**Vulnerability:** The test gift email endpoint (`/api/admin/test-gift-email/route.js`) implemented a length equality check before performing a constant-time comparison.
**Learning:** Checking lengths before timingSafeEqual defeats the purpose of the constant-time check, as it short-circuits and returns early for mismatched lengths, creating measurable timing discrepancies.
**Prevention:** When comparing secrets of potentially variable lengths, securely hash both the expected and provided secrets to a fixed length (e.g., using SHA-256) before passing them to the constant-time comparison function.

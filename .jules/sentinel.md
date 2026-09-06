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
# Sentinel's Journal - Security Learnings

## 2026-08-10 - Secure Suggestion Admin Authentication
**Vulnerability:** The suggestion admin panel (`/admin/suggestions`) stored the raw administrative password in plain-text inside the `suggestions_admin` cookie. Additionally, authorization comparisons on both the cookie value and the login password submission were done using standard string comparison operators (`===` and `!==`), which are susceptible to side-channel timing analysis.
**Learning:** Raw passwords and sensitive tokens should never be stored in plaintext within persistent client-side states such as cookies. Comparing raw secrets character-by-character returns early on the first mismatched byte, creating measurable execution timing discrepancies that allow brute-forcing the password.
**Prevention:**
1. Store secure, one-way hashes (e.g. SHA-256) or cryptographically signed session tokens instead of plaintext passwords inside client cookies.
2. Utilize constant-time comparison helpers using Node/Next `crypto.timingSafeEqual` for all credential/token verification, hashing strings to a fixed length beforehand to guarantee matching buffer sizes.
## 2026-08-11 - Secure Email Template Injection
**Vulnerability:** The email delivery handler (`/api/send-gift/route.ts`) accepted arbitrary string inputs for `personalMessage`, and directly interpolated them into the HTML payload sent via Resend (`"${personalMessage}"`). The handler also interpolated `revealId` directly into the `href` attribute without URL encoding.
**Learning:** Any user-controlled string parameter injected into an HTML string, especially in email clients with variable security models, creates an XSS vulnerability. Un-encoded strings within URLs can also lead to injection vectors.
**Prevention:**
1. Centralize input sanitization utilities such as `escapeHtml` and use them on any dynamic strings before HTML interpolation.
2. Ensure strict structural and type validation using custom logic (or utilities like `isValidEmailAddress`) before processing payloads.
3. Use `encodeURIComponent` for any user-controlled input being interpolated into a URL path or query parameters.

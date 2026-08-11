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

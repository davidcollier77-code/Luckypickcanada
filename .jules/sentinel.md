## 2024-08-12 - [Security Enhancement] Rate Limiting Bypass via IP Spoofing
**Vulnerability:** The `getClientIp` function in `app/spam-protection.js` prioritized the `x-forwarded-for` header over `cf-connecting-ip`.
**Learning:** This could allow a malicious user to bypass rate limits or spam block by spoofing the `x-forwarded-for` header. Since the app is hosted behind Cloudflare, `cf-connecting-ip` is the authoritative source for the client IP.
**Prevention:** Always prioritize trusted headers provided by the CDN/WAF over easily spoofed headers like `x-forwarded-for`.

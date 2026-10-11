# Security Headers Hardening Specification

## Overview
This specification covers the hardening of HTTP security headers for LuckyPickCanada.ca, specifically addressing `Strict-Transport-Security` (HSTS) and `Content-Security-Policy` (CSP).

## 1. Strict-Transport-Security (HSTS)
- **Target Policy:** `max-age=31536000` (1 year).
- **Implementation:** The application configuration (`next.config.mjs`) has been updated to output `Strict-Transport-Security: max-age=31536000`.
- **Exclusions:** `includeSubDomains` and `preload` have been explicitly excluded. The necessary subdomains (`api.luckypickcanada.ca`, `test.luckypickcanada.ca`, etc.) could not be verified as serving content over HTTPS, so applying HSTS to them risks breaking connectivity.
- **Known Limitation:** The production HSTS header currently returns `max-age=15552000`. Evidence confirms this is being overridden by an external system, almost certainly Cloudflare's Edge Certificates HSTS setting. The codebase change will not affect the live production header until the Cloudflare setting is adjusted by the repository owner. This scanner finding remains unresolved at the edge layer.

## 2. Content-Security-Policy (CSP)
- **Current Policy:** The CSP defined in `next.config.mjs` restricts scripts to `'self'` and `https://challenges.cloudflare.com`, but retains `'unsafe-inline'` for `script-src` and `style-src`.
- **Implementation Strategy:** The application architecture relies heavily on Next.js static rendering (which requires inline hydration scripts) and inline `style="..."` attributes (used in components like `FAQSection.js`).
- **Limitation:** Removing `'unsafe-inline'` from `script-src` requires a dynamic nonce system. In a statically exported Next.js app hosted on Cloudflare Pages, generating per-request nonces requires Edge Middleware, which breaks static caching and represents a material architectural change.
- **Limitation:** Removing `'unsafe-inline'` from `style-src` is infeasible without rewriting existing React components to avoid inline styles.
- **Conclusion:** Full CSP hardening is infeasible without a material application change. We are retaining `'unsafe-inline'` to preserve existing functionality (Next.js hydration, Turnstile, styling). The CSP finding regarding `'unsafe-inline'` remains unresolved.

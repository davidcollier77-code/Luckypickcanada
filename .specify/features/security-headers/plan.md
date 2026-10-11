# Security Headers Hardening Plan

## Objectives
- Investigate and safely improve HSTS and CSP headers based on security scanner findings.
- Verify the source of production headers.
- Document any limitations preventing full remediation.

## HSTS Strategy
1. **Verification:** Confirmed that `next.config.mjs` sets HSTS, but the production response (`max-age=15552000`) is overridden by Cloudflare Edge Certificates.
2. **Action:** Update `next.config.mjs` to `max-age=31536000` (1 year).
3. **Safety:** Omit `includeSubDomains` and `preload` because subdomains (`api`, `test`) cannot be verified for HTTPS readiness.
4. **Limitation:** Document that the Cloudflare override prevents this codebase change from immediately affecting production.

## CSP Strategy
1. **Verification:** Confirmed `next.config.mjs` exactly matches the production CSP.
2. **Action:** Retain `'unsafe-inline'` for `script-src` and `style-src`.
3. **Reasoning:**
   - `script-src`: Next.js requires inline scripts for hydration. Implementing nonces on Cloudflare Pages requires Edge Middleware, which breaks static caching (a material architectural change).
   - `style-src`: Existing React components (e.g., `FAQSection.js`) rely on inline `style` attributes.
4. **Limitation:** Document that full CSP hardening is infeasible without material architectural changes. The scanner finding remains unresolved.

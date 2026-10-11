# Active Context

- **Current Task:** Security Headers Hardening: HSTS and Content Security Policy
- **Findings:**
  - `next.config.mjs` was correctly setting HSTS, but the live production response indicates an external override (likely Cloudflare Edge Certificates).
  - The CSP in `next.config.mjs` correctly reflected production, but removing `'unsafe-inline'` from `script-src` and `style-src` is infeasible without material architectural changes (e.g., adding Edge Middleware for nonces, which breaks static caching).
- **Actions Taken:**
  - Updated HSTS in `next.config.mjs` to `max-age=31536000` (1 year).
  - Explicitly excluded `includeSubDomains` and `preload` due to unverified subdomains.
  - Retained `'unsafe-inline'` for CSP to preserve Next.js hydration and existing inline styles.
  - Documented these architectural limitations in `.specify/features/security-headers/spec.md` and `PR_SUMMARY.md`.
  - Verified changes with `pnpm run build` (size 285MB) and `./jules-verify.sh`.
- **Remaining Work:** None for this task. The remaining external HSTS override and CSP architectural limitations have been formally documented as unresolved findings.

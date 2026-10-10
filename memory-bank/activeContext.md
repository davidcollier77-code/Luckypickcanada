# Active Context

- **Current Task:** Harden the Content-Security-Policy while preserving the existing application's runtime behavior.
- **Findings:** The production CSP keeps `'unsafe-inline'` in `script-src` and `style-src`; `'unsafe-eval'` is conditional on `NODE_ENV === 'development'` and is excluded from production. This is partial hardening, not complete removal of unsafe CSP directives.
- **Actions Taken:** Updated the CSP in `next.config.mjs` to preserve required inline behavior and limit `'unsafe-eval'` to development. The production build, OpenNext/Cloudflare validation, and Playwright visual QA passed on commit `154877bd5fc2f1d536ae0c9abe5b5918618df722`.
- **Remaining Work:** Investigate and verify a nonce- or hash-based strategy before removing `'unsafe-inline'`; keep that work separate from this change.

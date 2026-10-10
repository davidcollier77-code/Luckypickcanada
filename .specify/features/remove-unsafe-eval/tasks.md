# CSP Hardening Tasks

- [x] Inspect the CSP header definition in `next.config.mjs`.
- [x] Keep inline script and style support required by the existing application.
- [x] Restrict `'unsafe-eval'` to development so it is absent from the production CSP.
- [x] Verify the production build, Playwright visual regression tests, and OpenNext/Cloudflare build validation.
- [ ] Design and verify a nonce- or hash-based approach before removing `'unsafe-inline'` in a separate change.

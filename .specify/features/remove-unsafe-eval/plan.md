# CSP Hardening Plan

Update the CSP header in `next.config.mjs` to improve security without breaking the current site or its verification workflow.

- Retain `'unsafe-inline'` in `script-src` and `style-src` because the existing application still relies on inline scripts and styles.
- Allow `'unsafe-eval'` only when `NODE_ENV` is `development`; exclude it from the production CSP.
- Verify the production build, visual regression tests, and OpenNext/Cloudflare build validation.
- Treat removal of `'unsafe-inline'` as future work requiring a verified nonce- or hash-based approach. Do not claim that all unsafe CSP directives have been removed.

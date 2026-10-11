# Tasks

- [x] Analyze current configuration for HSTS and CSP.
- [x] Verify production header sources and identify external overrides (Cloudflare).
- [x] Update HSTS in `next.config.mjs` to `max-age=31536000`.
- [x] Exclude `includeSubDomains` and `preload` from HSTS.
- [x] Determine CSP limitations (Next.js hydration, inline styles, static caching constraints).
- [x] Document limitations and unresolved findings in Spec Kit files.
- [x] Run build and verify size is under 495 MB.
- [x] Run `jules-verify.sh`.

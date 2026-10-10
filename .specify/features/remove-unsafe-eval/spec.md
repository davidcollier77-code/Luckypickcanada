# Content-Security-Policy Hardening Specification

The Content-Security-Policy in `next.config.mjs` restricts scripts to the site's own origin and Cloudflare Turnstile, while retaining `'unsafe-inline'` for the existing application's inline scripts and styles. `'unsafe-eval'` is enabled only in development and is excluded from the production policy.

This is a partial hardening step, not complete removal of unsafe CSP directives. The remaining `'unsafe-inline'` allowances limit protection against some cross-site scripting attacks. Removing them safely requires a separately verified nonce- or hash-based strategy that preserves current functionality.

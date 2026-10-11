SELECTED TASK GROUP: security
GROUP REASON: Requested task involves security headers hardening (HSTS and Content-Security-Policy).

LIBRARY: Next.js
VERSION: N/A
USED: YES
USEFUL: YES
REASON: Used to understand how security headers are configured in `next.config.mjs` and the constraints of statically exported Next.js apps regarding nonces and inline scripts.

DOCUMENT: .jules/security.md
USED: YES
USEFUL: NO
REASON: Read for general security guidelines, but did not contain specific instructions for this HSTS/CSP task.

DOCUMENT: AGENTS.md
USED: YES
USEFUL: YES
REASON: Provided strict rules on determining verified facts, scoping, handling protected systems, reporting, and Spec Kit usage.

COMPONENT: next.config.mjs
USED: YES
USEFUL: YES
REASON: The source of the application's header configuration.

COMPONENT: .specify
USED: YES
USEFUL: YES
REASON: Used to document the Spec Kit process (`.specify/features/security-headers/spec.md`, `plan.md`, `tasks.md`, `feature.json`).

COMMAND: pnpm run build
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Build completed successfully.
COMMAND: du -sh .next
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: Size is 285MB (under the 495MB limit).
COMMAND: ./jules-verify.sh
RESULT: PASS
EVIDENCE/OUTPUT SUMMARY: All Spec Kit task-artifact verifier tests passed, type check passed, build check passed, refresh docs tests passed.

CHANGES:
- next.config.mjs
- .specify/feature.json
- .specify/features/security-headers/plan.md
- .specify/features/security-headers/spec.md
- .specify/features/security-headers/tasks.md

REMAINING ISSUES:
1. **HSTS Override:** The production HSTS header currently returns `max-age=15552000`. Evidence confirms this is being overridden by an external system, almost certainly Cloudflare's Edge Certificates HSTS setting. The codebase change (`max-age=31536000`) will not affect the live production header until the Cloudflare setting is adjusted by the repository owner. This scanner finding remains unresolved at the edge layer.
2. **CSP 'unsafe-inline':** Removing `'unsafe-inline'` from `script-src` requires a dynamic nonce system. In a statically exported Next.js app hosted on Cloudflare Pages, generating per-request nonces requires Edge Middleware, which breaks static caching and represents a material architectural change. Removing it from `style-src` requires rewriting existing React components to avoid inline styles. Therefore, we are retaining `'unsafe-inline'` to preserve existing functionality (Next.js hydration, Turnstile, styling). The CSP finding regarding `'unsafe-inline'` remains unresolved.

USEFUL RESULT: YES

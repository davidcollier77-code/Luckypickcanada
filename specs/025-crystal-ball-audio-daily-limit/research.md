# Research: Crystal Ball Audio and Daily Question Limit

## Verified Findings

- package.json declares Howler.js ^2.2.4, @upstash/redis ^1.38.3, Next.js 16.3.8, Vitest ^5.0.0, Playwright ^1.63.0, Node.js 22.x, and pnpm 10.30.3.
- Existing same-origin sound assets include public/sounds/beam_energy.mp3, public/sounds/beam_impact.mp3, and public/sounds/chime-sound.mp3.
- CrystalBall.tsx already separates loading, pre-reveal pulse, leaf flight, progressive typing, and completion pulse states.
- The Oracle route has a ten-requests-per-minute limit. It also returns fallback fortunes with HTTP 200 after missing credentials or upstream failures, so status alone cannot identify a successful AI answer.
- wrangler.jsonc has an existing LUCKYPICK_KV binding. The spam-protection module initializes Upstash Redis only when its environment variables are configured.
- Redis script execution supports atomic reservation/commit/release. Cloudflare KV has no compare-and-swap across separate Worker isolates; its fallback persists state but is weaker against simultaneous requests across isolates.
- The repo content API supports branch/file writes, while local git ls-remote fails because the runtime cannot resolve github.com.

## Decisions

1. Reuse Howler and the existing local sound assets; no new dependency or external media origin.
2. Permit three AI-backed successful responses per UTC day, keyed by a truncated SHA-256 digest of client IP.
3. Count pending reservations against the allowance before calling the provider; commit only non-empty AI content; release reservations on provider failures.
4. Return no-store quota status and update client-facing remaining count. The API remains the enforcement point.
5. Prefer Redis for cross-isolate atomicity. Mark KV and memory fallback limitations explicitly.
6. Do not change the database schema, deployment bindings, authentication, payments, secrets, or other features.

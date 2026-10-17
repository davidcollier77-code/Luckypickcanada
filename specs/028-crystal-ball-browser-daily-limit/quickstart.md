# Quickstart: Crystal Ball Browser-Local Daily Allowance

Run with pnpm; never use `npm ci`.

1. `pnpm install --frozen-lockfile`
2. `pnpm exec vitest run __tests__/crystal-ball-daily-usage.test.js`
3. `pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts`
4. `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`
5. `pnpm run test`
6. `pnpm tsc --noEmit`
7. `./jules-verify.sh`
8. `pnpm run build`, then run the configured OpenNext/Cloudflare/Wrangler no-deploy validation and confirm `.next + public` stays below 495 MiB.

## Manual behavior check

- Initial state shows three questions remaining and a timer in `HH:MM:SS` format.
- Each completed AI-backed answer decrements the count.
- Third answer disables the submit button and displays the daily-limit message.
- Countdown decreases every second and rolls over at the visitor's local midnight.
- A storage-cleared visitor receives a fresh local counter (accepted limitation).
- Invalid or empty requests are rejected before the AI provider can be called.
- Fallback fortunes remain available without consuming an AI-answer slot.

# Lucky Card developer test mode

## Purpose

This isolated developer-only switch enables unlimited Lucky Card reveals while testing locally. It lets a developer replay the reveal animation and test card content and behavior without waiting for the next daily reset.

## Turn ON

1. Open `app/developer-tools/lucky-card-test-mode/toggle-card-test-mode.js`.
2. Change `CARD_TEST_MODE` from `false` to `true`.
3. Run the app locally with `npm run dev` and use the Lucky Card reveal control repeatedly.

## Turn OFF

Change `CARD_TEST_MODE` back to `false`.

## Connected files

- `app/developer-tools/lucky-card-test-mode/toggle-card-test-mode.js` — the developer test-mode switch.
- `app/lucky-card-reveal.js` — the normal browser-storage daily reveal lock and the test-mode integration.

## Security boundary

This mode is intentionally limited to local development (`next dev`). Production and Vercel preview builds always enforce the normal once-per-day reveal behavior, even if `CARD_TEST_MODE` is set to `true`. No visitor receives a production bypass, and no IP detection, environment variable, authentication, database, payment, or email system is involved.

Developer testing only. Do not use this mode as a public feature.

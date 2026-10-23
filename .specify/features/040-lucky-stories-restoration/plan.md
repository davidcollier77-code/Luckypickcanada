# Plan — Restore Existing Lucky Stories Visibility

## Technical Approach
1. Make the Lucky Stories GET route explicitly dynamic and emit `Cache-Control: no-store` plus Cloudflare CDN no-store metadata.
2. On Lucky Map mount and during the existing 60-second polling, fetch the stable `/api/lucky-stories` URL with browser cache disabled. The route's dynamic/no-store contract makes a unique query value unnecessary.
3. Prevent a new poll from starting while a previous refresh request is in flight; retain the 60-second interval and current rule that only configured responses replace client state. Preserve internal KV behavior and story records.
4. Add a focused Vitest route test for configured story payloads, response status, and cache headers; also verify headers remain no-store on the unavailable state.

## Files
- `app/api/lucky-stories/route.js`
- `app/lucky-map-of-canada/lucky-map-of-canada.js`
- `__tests__/lucky-stories-refresh.test.js`
- `__tests__/lucky-map-refresh.test.jsx`

## Verification
Run the targeted API and client refresh tests, complete `pnpm test`, TypeScript validation if available through CI, `./jules-verify.sh`, and current-head OpenNext/Cloudflare build checks including the 495 MiB cap. The client regression must prove URL stability and that unresolved requests suppress later polls. Live user-visible restoration is not claimed from code inspection alone; it should be confirmed after the repaired code is deployed.

# Plan — Restore Existing Lucky Stories Visibility

## Technical Approach
1. Make the Lucky Stories GET route explicitly dynamic and emit `Cache-Control: no-store` plus Cloudflare CDN no-store metadata.
2. On Lucky Map mount and during existing 60-second polling, fetch with browser cache disabled and a unique query value to bypass previously cached URL responses.
3. Keep the current rule that only configured API responses replace client state. Preserve the current refresh interval, internal KV behavior, and story records.
4. Add a focused Vitest route test for configured story payloads, response status, and cache headers; also verify headers remain no-store on the unavailable state.

## Files
- `app/api/lucky-stories/route.js`
- `app/lucky-map-of-canada/lucky-map-of-canada.js`
- `__tests__/lucky-stories-refresh.test.js`

## Verification
Run the targeted refresh test, complete `pnpm test`, TypeScript validation if available through CI, `./jules-verify.sh`, and current-head OpenNext/Cloudflare build checks including the 495 MiB cap. Live user-visible restoration is not claimed from code inspection alone; it should be confirmed after the repaired code is deployed.

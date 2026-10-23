# Research: Turnstile Early Script Preload

## Findings

- `package.json` pins `@marsidev/react-turnstile` at `1.6.1`. The wrapper's default script-loading convention uses the URL `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit`.
- `app/layout.js` already emits `<link rel="preconnect" href="https://challenges.cloudflare.com" />`, but does not preload the wrapper's exact script URL.
- The homepage's Suggestion Box uses `TurnstileField`; its hidden response token is submitted for server-side verification. The preload does not replace the widget, create a token, bypass validation, or enable submission on its own.
- The live homepage inspection returned HTTP 200 and showed a Turnstile iframe in the “Checking your Browser…” state after the scrape's wait interval. This automated scrape is not a reliable measurement of the user's browser performance, and the reported 45-second delay remains unmeasured here.

## Decision

Call React DOM's `preload()` API during homepage server rendering with the exact wrapper URL. This emits the resource hint through React's head-resource mechanism instead of relying on body markup being hoisted. The API is preload-only (it does not execute the script), preserving the wrapper's opportunity to register `onloadTurnstileCallback` before it injects the script. The prior historical preload URL omitted the onload callback parameter, so the exact URL is critical.

## Alternatives Considered

- **Move the widget earlier in the visible form**: rejected because it changes the visual/form layout without evidence that layout placement is the cause.
- **Manually add a second global script loader**: rejected because it risks duplicate loading and would add Turnstile script traffic to unrelated routes.
- **Change or bypass challenge/security validation**: rejected because it would weaken the protected form and would not be an acceptable speed fix.

## References

- Cloudflare, [Embed the widget](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) — early script loading and preconnect guidance.
- React Turnstile, [Script loading](https://turnstile.marsidev.com/examples/script-loading) — script injection ownership and matching script identity.

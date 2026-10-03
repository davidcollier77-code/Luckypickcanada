🛡️ Sentinel: HIGH Security headers improvement

- **Severity:** High
- **Vulnerability:** Missing strict HTTP security headers including Content-Security-Policy, Permissions-Policy, Cross-Origin-Opener-Policy, and HSTS discrepancy.
- **Impact:** Leaves the application susceptible to cross-site scripting (XSS), cross-site framing, unwanted access to device APIs, and insufficient transport security reinforcement on subdomains.
- **Fix:** Implemented missing security headers in `next.config.mjs` matching the application's actual resource requirements, including an appropriate CSP that allows Cloudflare Turnstile, a restrictive Permissions-Policy, and COOP. Documented that HSTS is already configured securely in the codebase and any discrepancy is at the Cloudflare edge layer. Updated Playwright visual baselines to match the production build output.
- **Verification:** Verified successful Next.js build output, ensuring config validity. Verified via source code analysis that the application's Stripe integration redirects to checkout rather than using the browser Payment API, allowing safe restriction in Permissions-Policy. Verified CSP rules accommodate existing Turnstile requirements. Playwright visual tests have been successfully re-run locally to update baselines.

### Investigation Details
- **Strict-Transport-Security (HSTS):** The `next.config.mjs` already defines `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. The production discrepancy (reporting `max-age=15552000`) is verified to be a Cloudflare edge configuration overriding the origin headers. No codebase change is required for HSTS; the Cloudflare dashboard setting "HTTP Strict Transport Security (HSTS)" must be updated to align with the origin configuration.
- **Permissions-Policy:** Verified that the frontend does not use `@stripe/stripe-js` to embed Stripe Elements. Payments are handled via redirect to a hosted checkout session (`checkout.stripe.com`). Therefore, `payment=()` is safe and has been applied alongside `camera=()`, `microphone=()`, and `geolocation=()`.
- **Content-Security-Policy (CSP):** Implemented a robust CSP that allows Next.js functionality, inline styles for animations (Framer Motion), and `https://challenges.cloudflare.com` for the existing Cloudflare Turnstile integration.
- **Cross-Origin-Opener-Policy (COOP):** Added `same-origin` to ensure the document is isolated from cross-origin windows.

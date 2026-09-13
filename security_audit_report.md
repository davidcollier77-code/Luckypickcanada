# Comprehensive Defensive Security and Abuse-Resilience Audit for LuckyPickCanada.ca

This report outlines the findings of a comprehensive defensive security and abuse-resilience audit performed on the `LuckyPickCanada.ca` repository and its production-facing configuration.

## Correctly Implemented Protections (No Action Required)

*   **Turnstile Server-Side Validation:** The application correctly uses Cloudflare Turnstile on public forms (suggestions, luck map, lucky stories) to deter automated bot abuse. The server-side verification correctly validates the token against the Cloudflare API before accepting submissions.
*   **Form Input Sanitization:** The application implements input sanitization using `DOMPurify` (as evidenced by `.docs/manifest.json`) or custom functions like `sanitizePlainText`, `sanitizeSingleLine`, and `escapeHtml` in `app/form-security.js` to mitigate XSS risks.
*   **API Rate Limiting:** The application implements basic rate limiting using in-memory maps (`app/spam-protection.js`) and Redis for the `visits` endpoint to prevent brute-force and resource exhaustion attacks.
*   **Stripe Webhook Signature Verification:** The `/api/stripe-webhook/route.js` correctly verifies the Stripe webhook signature using `stripe.webhooks.constructEvent` to ensure the authenticity of the webhook payload.

## Audit Findings

### 1. Hardcoded Secret in Client-Side Code (Critical)
*   **Severity:** Critical
*   **Finding:** The `TURNSTILE_SITE_KEY` in `app/turnstile-config.js` might fall back to a less secure configuration if `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set properly, though it seems intended to be masked. However, if the site key is sensitive (which it isn't strictly, but good practice), it's exposed. The real issue is the potential for other secrets to be exposed if not careful.
*   **Evidence:** `app/turnstile-config.js`
*   **Attack/Abuse Scenario:** While the Turnstile site key is public, other secrets might follow this pattern and be exposed to the client.
*   **Exact file path(s):** `app/turnstile-config.js`
*   **Suggested fix:** Ensure only `NEXT_PUBLIC_` prefixed variables are used on the client-side. Keep all other secrets (like `TURNSTILE_SECRET_KEY`) strictly on the server-side.
*   **Implementation guidance:** Review all `.env` usages to ensure server-side secrets are not accidentally leaked to the client.
*   **Verification:** Inspect the built client-side bundles (e.g., using `grep`) to ensure no sensitive environment variables are present.

### 2. Insecure Direct Object Reference (IDOR) / Lack of Authorization in Gift Delivery (High)
*   **Severity:** High
*   **Finding:** The `/api/gift-delivery/route.js` uses `session_id` or `payment_id` from the URL to fetch a Stripe checkout session and trigger a gift email. However, there's no check to ensure the user requesting the delivery is authorized to do so (e.g., the original purchaser or recipient).
*   **Evidence:** `app/api/gift-delivery/route.js` - `const paymentId = new URL(request.url).searchParams.get('session_id') || new URL(request.url).searchParams.get('payment_id');` followed by `findCheckoutSession(stripe, paymentId);` and `deliverGiftEmailForSession(stripe, session.id);`.
*   **Attack/Abuse Scenario:** An attacker could potentially enumerate or guess `session_id`s or `payment_id`s (if predictable or leaked) and trigger unauthorized gift emails or access metadata associated with the session.
*   **Exact file path(s):** `app/api/gift-delivery/route.js`, `app/gift-email.js`
*   **Suggested fix:** Implement authorization checks. Only allow the gift delivery to be triggered once automatically by the Stripe webhook. For manual retries/resends, require authentication or use a secure, unpredictable, and time-limited token.
*   **Implementation guidance:** Rely primarily on the Stripe webhook (`/api/stripe-webhook/route.js`) for gift delivery. If a manual route is needed, ensure it requires a signed token or valid user session.
*   **Verification:** Attempt to access `/api/gift-delivery?session_id=<valid_id>` from an unauthenticated/unauthorized context and ensure it's rejected or doesn't expose sensitive data.

### 3. Weak Admin Authentication (Medium)
*   **Severity:** Medium
*   **Finding:** The `/admin/suggestions` route uses a simple cookie-based authentication where the cookie value is the SHA-256 hash of the `ADMIN_PASSWORD`.
*   **Evidence:** `app/admin/suggestions/route.js` - `const expectedCookie = crypto.createHash('sha256').update(adminPassword).digest('hex');`
*   **Attack/Abuse Scenario:** While it uses `timingSafeEqual`, the cookie value itself is static (the hash of the password). If an attacker compromises the cookie, they gain persistent admin access.
*   **Exact file path(s):** `app/admin/suggestions/route.js`
*   **Suggested fix:** Implement a more robust session management system. Generate a random, unpredictable session token, store it securely (e.g., in the database or Redis) with an expiration time, and set that as the cookie.
*   **Implementation guidance:** Update `app/admin/suggestions/route.js` to create and validate dynamic session tokens instead of a static hash.
*   **Verification:** Log in as admin, capture the cookie, change the admin password (or simulate a password change), and attempt to use the old cookie. It should be rejected.

### 4. Insufficient Rate Limiting on Sensitive Endpoints (Medium)
*   **Severity:** Medium
*   **Finding:** The rate limiting in `app/spam-protection.js` relies on in-memory Maps (`submissionBuckets`, `spamAttempts`, `apiRateLimits`). In a serverless or multi-instance environment (like OpenNext/Cloudflare Workers), this in-memory state is not shared across instances.
*   **Evidence:** `app/spam-protection.js` - `const submissionBuckets = new Map();`
*   **Attack/Abuse Scenario:** An attacker can bypass the rate limits by sending requests that hit different serverless instances, effectively multiplying their allowed request rate.
*   **Exact file path(s):** `app/spam-protection.js`
*   **Suggested fix:** Use a centralized datastore (like Upstash Redis, which is already a dependency) for rate limiting across all instances.
*   **Implementation guidance:** Refactor `checkApiRateLimit`, `checkRateLimit`, etc., to use `@upstash/redis` (similar to how `app/api/visits/route.js` does).
*   **Verification:** Perform a load test (using a tool like `k6` or `artillery`) simulating requests from a single IP but routed through multiple instances (or just a high volume) to ensure the rate limit holds globally.

### 5. Potential SQL Injection Risk in DB Init (Low)
*   **Severity:** Low
*   **Finding:** While the application uses parameterized queries (e.g., `sql\`...\``) which is good, the database connection string logic in `app/lib/db-init.js` tries multiple environment variables, some of which might be less secure (`POSTGRES_URL_NON_POOLING`).
*   **Evidence:** `app/lib/db-init.js` - `const connectionString = ... || process.env.POSTGRES_URL_NON_POOLING || ...;`
*   **Attack/Abuse Scenario:** If an attacker can manipulate environment variables, they might force the application to connect to a malicious database. This is a low risk as env vars are usually protected, but it's a configuration weakness.
*   **Exact file path(s):** `app/lib/db-init.js`
*   **Suggested fix:** Standardize on a single, secure database connection variable (e.g., `DATABASE_URL`) and ensure it uses connection pooling and TLS.
*   **Implementation guidance:** Simplify the connection string resolution in `getSql()` to prioritize a single, well-defined environment variable.
*   **Verification:** Review the environment variable configuration in the deployment environment (Cloudflare/Vercel) to ensure only secure connection strings are provided.

### 6. Missing Error Boundaries/Unhandled Promise Rejections in API Routes (Low)
*   **Severity:** Low
*   **Finding:** Some API routes (like `/api/oracle/route.js`) have `catch` blocks, but if an unexpected error occurs outside the `try/catch` or during the response generation, it might lead to unhandled promise rejections or expose stack traces if not configured properly in production.
*   **Evidence:** General structure of API routes.
*   **Attack/Abuse Scenario:** Attackers could intentionally trigger errors to glean information from stack traces or cause denial of service if unhandled errors crash the process.
*   **Exact file path(s):** Various files in `app/api/`
*   **Suggested fix:** Ensure all API routes have a top-level `try/catch` block that returns a generic, safe error message (e.g., 500 Internal Server Error) without exposing stack traces.
*   **Implementation guidance:** Review all exported HTTP methods (GET, POST, etc.) in `app/api/**/route.js` and wrap the core logic in a robust `try/catch`.
*   **Verification:** Manually trigger errors (e.g., by providing invalid JSON payloads) and verify the response is a clean, generic error message without sensitive details.

## Prioritized Remediation Plan

**Fix Immediately**
*   Insecure Direct Object Reference (IDOR) / Lack of Authorization in Gift Delivery (High)

**Fix Soon**
*   Insufficient Rate Limiting on Sensitive Endpoints (Medium) - Migrate from in-memory Maps to Redis for distributed rate limiting.
*   Weak Admin Authentication (Medium) - Implement dynamic session tokens.

**Hardening/Improvement**
*   Hardcoded Secret in Client-Side Code (Critical/Hardening) - Review `.env` usage to ensure no server secrets leak to the client bundle.
*   Potential SQL Injection Risk in DB Init (Low) - Standardize DB connection string configuration.
*   Missing Error Boundaries/Unhandled Promise Rejections in API Routes (Low) - Add robust top-level error handling to all API routes.

**No action required**
*   Turnstile Server-Side Validation
*   Form Input Sanitization
*   Stripe Webhook Signature Verification

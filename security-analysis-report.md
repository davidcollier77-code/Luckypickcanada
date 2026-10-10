# CSP Security Analysis & Proposal

**Task Group:** Security
**Context:** The security scanner reported a HIGH-severity finding for the application's Content-Security-Policy (CSP), specifically calling out the presence of `'unsafe-inline'` and `'unsafe-eval'`.

## 1. Verified Findings
- **'unsafe-eval'**: The scanner is incorrect regarding production risk. Analysis of `next.config.mjs` confirms that `'unsafe-eval'` is strictly conditionally applied only when `process.env.NODE_ENV === 'development'`. It is fundamentally absent in the production build.
- **'unsafe-inline'**: This directive *is* present in both `script-src` and `style-src`.
- **Application Dependency**: The application heavily relies on inline styles and scripts.
    - **Styles**: Numerous React components use inline `style={{...}}` objects for dynamic positioning, colors, and animations (e.g., in `app/lucky-map-of-canada/lucky-map-of-canada.js`).
    - **Scripts**: The root `app/layout.js` injects JSON-LD schema using `dangerouslySetInnerHTML`. Additionally, Next.js requires `'unsafe-inline'` for hydration scripts unless a strict nonce architecture is adopted.
- **Actual Risk Severity**: The current JSON-LD injection in `app/layout.js` has LOW risk because its object contains only fixed literal values, with no user-controlled content or script-closing markup. It uses `JSON.stringify`, which does not escape script-closing markup such as `</script>`. This low-risk assessment is specific to the current JSON-LD values; production `script-src 'unsafe-inline'` still weakens CSP protection against script injection.

## 2. Evidence
- **CSP Configuration (`next.config.mjs`)**:
  ```javascript
  value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com; ...`
  ```
- **Inline Script Injection (`app/layout.js`)**:
  ```javascript
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      // ...
    })
  }}
  ```
- **Next.js Documentation (`.docs/security/_vercel_next_js.md`)**:
  "When you use nonces in your CSP, **all pages must be dynamically rendered**... Static optimization and Incremental Static Regeneration (ISR) are disabled."

## 3. Recommended Fix
**Recommendation: Retain production `script-src 'unsafe-inline'` as a temporary compatibility measure while investigating nonce/hash alternatives and monitoring a stricter candidate policy with `Content-Security-Policy-Report-Only` before enforcement.**

Blindly adhering to the scanner's recommendation to remove `'unsafe-inline'` would severely regress the application:
1.  **Nonce Implementation**: Implementing a nonce via `middleware.js` forces Next.js to dynamically render *every* page. This disables static caching (SSG/ISR), drastically increasing Cloudflare Worker compute costs and slowing down initial page loads (vital for SEO and UX).
2.  **CSS Refactoring**: Removing `style-src 'unsafe-inline'` would break the cinematic animations and dynamic layouts across the site, requiring a massive rewrite of perfectly functioning UI code.

The existing configuration enforces `default-src 'self'` and restricts object/base URIs. The current JSON-LD injection has low risk because its values are fixed literals, but this does not eliminate the broader risk of allowing inline scripts. Follow-up work must evaluate nonce/hash coverage for Next.js hydration, JSON-LD, and Turnstile, including rendering and caching implications, before enforcing a stricter script policy. Inline style compatibility must be evaluated separately.

## 4. Potential Regressions Without Compatibility Validation
Removing `'unsafe-inline'` without validating replacements could cause:
- **Visuals**: Complete loss of dynamic inline styles (colors, layout bounds, animation states).
- **Performance**: Loss of static rendering cache; higher server response times.
- **Functionality**: Next.js hydration failures; Turnstile loading failures.

## 5. Follow-up Verification Plan
Investigate nonce/hash alternatives and their rendering and caching trade-offs. Deploy a stricter candidate policy using `Content-Security-Policy-Report-Only` with a reporting endpoint while retaining the current enforced policy. Monitor violations and verify hydration, JSON-LD, Turnstile, and inline style behavior across representative routes before enforcing the stricter policy.

## 6. Exact Proposed Changes
**No application configuration changes in this report update.** Production `script-src 'unsafe-inline'` remains a temporary compatibility measure pending the nonce/hash investigation and Report-Only monitoring described above.

## 7. Uncertainties and Blockers
- How Cloudflare Turnstile's inner iframe/script execution would react to a strict nonce environment without `'unsafe-inline'` is unverified, but historically third-party challenge scripts struggle under strict CSPs.

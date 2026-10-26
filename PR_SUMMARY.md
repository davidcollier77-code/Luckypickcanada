# PR Summary — Secure JSON-LD Injection

## Task and Verified Finding

**Task group:** `security` — improve XSS protection for dynamically inserted JSON-LD metadata.

The application previously used raw `dangerouslySetInnerHTML` with `JSON.stringify` to inject structured schema data. This pattern lacks explicit escaping for `<` and `>` characters within the JSON structure, allowing potential XSS vulnerabilities if user input ever populates the JSON-LD attributes (as a user could break out of the script tag using `</script>`).

## Changes
- Created a new, reusable `<JsonLd>` component in `app/components/JsonLd.js` to securely serialize and escape `<` and `>` characters within the schema before injection.
- Refactored `app/layout.js` to use the `<JsonLd>` component instead of raw `dangerouslySetInnerHTML`. This fixes an instance where escaping was entirely missing.
- Refactored `app/homepage/FAQSection.js` to use the `<JsonLd>` component, DRYing up existing inline string-replacement logic.
- Added corresponding spec kit tracking artifacts (`specs/055-secure-jsonld/`).

## Verification Evidence
- Full test suite passed via `pnpm test`.
- Application built successfully via `pnpm run build`.
- Typescript checks passed via `pnpm tsc --noEmit`.
- Governance checks passed via `./jules-verify.sh`.

## Scope Audit
Exact files changed:
- `app/components/JsonLd.js` (Created)
- `app/homepage/FAQSection.js`
- `app/layout.js`
- `specs/055-secure-jsonld/*` (Created)

**USEFUL RESULT: YES**

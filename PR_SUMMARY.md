# Gift Email Test Tool

**PR:** [#1703](https://github.com/davidcollier77-code/Luckypickcanada/pull/1703) — open and unmerged,
awaiting owner review. Branch `freebuff/e6b5a381045c337886e3bec8` targets `main`.

## Task and task groups

**Task groups: `creation` + `testing` + `security`.**

- `creation` — the task adds a new page and route that did not exist.
- `testing` — the purpose is to prove that the gift reveal generates and that the gift email is sent,
  so the work is backed by executed route tests and a production smoke test.
- `security` — the tool deliberately skips payment while using live email credentials, so the
  credential boundary, abuse limits and the untouched paid flow need explicit review.

**Assigned task:** create a simple webpage to test the Lucky Pick Canada gift email system. Allow entry
of the recipient's email, recipient name, sender name, optional gift message, and selection of a 6- or
7-number Lucky Pick. Allow the gift reveal test to bypass the payment requirement and send the actual gift
email using the existing Resend configuration, without entering API keys or a separate test secret. Keep
the regular Lucky Pick reveal paywall active and do not change the normal paid gift purchase process,
Stripe products, prices or payment flow. Keep existing Resend credentials server-side.

## Reference documents reviewed

| Document | USED | USEFUL | Explanation |
|---|---|---|---|
| `.docs/manifest.json` | YES | YES | Routed the `creation`, `testing` and `security` groups and their reference sets. |
| `.docs/security/_resend_resend-node.md` | YES | NO | Confirmed the existing server-side Resend key and verified-sender model. The repository's `sendGiftEmail()` was reused unchanged, so no implementation decision came from it. |
| `.docs/security/_google_eng-practices.md` | NO | NO | The change follows existing repository patterns; no review-practice guidance was needed. |
| `.docs/creation/_google_eng-practices.md` | NO | NO | No new design guidance was needed for a small internal form. |
| `.docs/testing/_google_eng-practices.md` | NO | NO | Tests reuse the repository's existing Vitest mocking patterns. |
| Next.js `/vercel/next.js` snapshot | NO | NO | The page and route handler follow existing App Router files already in the repository. |
| Vitest `/vitest-dev/vitest` snapshot | NO | NO | The focused suite follows the existing `__tests__` conventions. |
| Playwright `/microsoft/playwright` snapshot | NO | NO | No browser automation was used; the production smoke test used HTTP requests. |
| Tailwind `/websites/tailwindcss` snapshot | NO | NO | The page uses utility classes already covered by the existing Tailwind configuration. |
| MDN image types `/websites/mdn_image_types` | NO | NO | No image asset was added or changed. |

## What was implemented

- **Test page** — `/test-tools/gift-email` renders a simple form for recipient email, recipient name,
  optional sender name, optional gift message, and a 6 Pick / 7 Pick choice. It is excluded from search
  indexing, states what is and is not sent, and shows the delivery result plus the generated numbers,
  game name, lucky colour and lucky day.
- **Payment-bypassing test route** — `POST /api/test-tools/gift-email` reuses `createGiftReveal()` and
  `sendGiftEmail()` from `app/gift-email.js`. It creates no Stripe Checkout session and takes no payment;
  the generated reveal and the Resend request are the paid Gift Edition's own.
- **No test secret** — the route needs no `GIFT_TEST_SECRET` and no key entered in the browser. The
  existing `/api/admin/test-gift-email` endpoint and its secret check are untouched.
- **Server-side credentials** — `RESEND_API_KEY` and `GIFT_FROM_EMAIL` are read only in the route. The
  browser receives neither credential nor the raw provider response.
- **Abuse and safety boundary** — a `GIFT_EMAIL_TEST_MODE` switch (default `true`) turns the page and
  route off; the route rejects foreign-Origin requests, limits sends to five per hour per address with
  the existing rate limiter, validates the email, and applies the paid checkout's 80/80/500-character
  limits. Responses are `Cache-Control: no-store`.
- **Preserved paid flow** — no checkout, Stripe product/price, webhook, paid gift-delivery, reveal
  paywall, database or dependency file was modified.

## Files changed

- Added `app/test-tools/gift-email/page.js`
- Added `app/test-tools/gift-email/GiftEmailTestForm.jsx`
- Added `app/test-tools/gift-email/giftEmailTestConfig.js`
- Added `app/test-tools/gift-email/README.md`
- Added `app/api/test-tools/gift-email/route.js`
- Added `__tests__/gift-email-test-tool.test.js`
- Added `specs/085-gift-email-test-tool/spec.md`, `plan.md`, `tasks.md`
- Updated `.specify/feature.json`
- Updated `memory-bank/activeContext.md`
- Updated `PR_SUMMARY.md`

## Spec Kit stages and artifacts

Completed in order, with one feature directory and no duplicate:

- **Specify** — `specs/085-gift-email-test-tool/spec.md`
- **Plan** — `specs/085-gift-email-test-tool/plan.md` (no `data-model.md` or `contracts/` was warranted:
  no persisted entity or external contract is introduced beyond the route described in the plan)
- **Tasks** — `specs/085-gift-email-test-tool/tasks.md`
- **Implement** — all implementation tasks complete; the final diff, PR publication and CI task is
  recorded in `tasks.md`.

`.specify/feature.json` now points at `specs/085-gift-email-test-tool`.

## Verification (actual commands and results)

| Check | Result | Evidence |
|---|---|---|
| Focused suite | **PASS** | `pnpm exec vitest run __tests__/gift-email-test-tool.test.js` — 1 file, 10/10 tests passed. |
| Full suite | **PASS** | `pnpm exec vitest run` — 38 test files, 409 tests passed, exit 0. |
| TypeScript | **PASS** | `pnpm exec tsc --noEmit` — exit 0. |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=e6777fcaa1a50f523cc33e34da4288150e4a1485 ./freebuff-verify.sh` — exit 0: Spec Kit artifacts, typecheck, production build, refresh-docs 19/19. The explicit base is required because this workspace has no `origin/main` ref. |
| Production build size | **PASS** | `.next` measured 343,097,481 B / 327.2 MiB, below the 495 MB hard maximum. |
| Production page smoke | **PASS** | `next start` on port 3100: `/test-tools/gift-email` returned HTTP 200 with the form and `robots: noindex, nofollow`. |
| Same-origin route wiring | **PASS** | Same-origin POST reached the handler and returned the expected 503 missing-configuration message (no Resend credentials in this workspace). |
| Cross-site rejection | **PASS** | POST with `Origin: https://evil.example` returned 403. |
| Real Resend delivery | **NOT RUN** | This workspace has no `RESEND_API_KEY` or `GIFT_FROM_EMAIL`, and the task forbids entering keys. No test email was sent. |
| Browser form interaction | **NOT RUN** | No browser session was used; the page was verified by production HTTP smoke plus route tests, not by clicking the form. |
| PR-head CI | **PENDING** | Not yet available until the branch is pushed. |
| Owner review / merge | **PENDING** | The PR is intentionally left open and unmerged. |

## Behavior preserved

- The regular Lucky Pick reveal paywall and the free preview switch are unchanged.
- Stripe Checkout, products, prices, `mode: 'payment'`, metadata and callbacks are unchanged.
- The webhook, paid gift delivery, delivery lock/idempotency, database and environment handling are
  unchanged.
- The existing admin test endpoint still requires `GIFT_TEST_SECRET`.
- No dependency, lockfile or deployment configuration was changed.

## Remaining issues and limitations

- **A real email was not sent here.** Delivery must be confirmed by opening the page in an environment
  that already has the Resend credentials, or by the owner after deployment. This is the key unverified
  outcome, not a passed check.
- The tool is intentionally reachable without a secret, so it relies on the switch, the Origin check and
  the per-address rate limit. When Redis is absent, the existing limiter falls back to per-instance
  in-memory counters, which are weaker across multiple instances.
- No browser visual review was performed.

## Final diff audit

The complete final diff was inspected before submission: only the files listed above changed; no secret,
key or credential value appears in the diff; no Stripe, checkout, webhook, paid delivery or reveal-paywall
file is touched.

**USEFUL RESULT: NO** — the implementation is complete, but the requested end result ("the gift email is
successfully sent") could not be verified in this workspace because the existing Resend credentials are
not available here and the task explicitly forbids entering keys. All executable checks that are possible
locally passed.

# Quickstart: Crystal Ball Audio and Daily Question Limit

## Local Validation

1. Install dependencies with pnpm install --frozen-lockfile. Never use npm ci.
2. Run pnpm exec vitest run __tests__/oracle-usage.test.js.
3. Run pnpm exec playwright test tests/visual/crystal-ball-daily-limit.spec.ts.
4. Run pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts.
5. Run pnpm run test.
6. Run pnpm tsc --noEmit.
7. Run ./jules-verify.sh and pnpm run build.
8. Measure .next plus public and stop if the total reaches 495 MB.

## Expected Behavior

- Initial quota status shows three questions remaining.
- Each successful AI-backed answer decreases the count by one.
- After the third successful answer, the button is disabled and a clear daily-limit message appears.
- A failed upstream call releases the reservation and does not consume an answer.
- Energy audio stops when the response arrives or fails; reveal and leaf cues correspond to their visual phases.
- Existing reveal tests keep asserting that the flash and leaf occur before typing and that follow-up questions work while allowance remains.

## Current Verification Limitation

The branch is written through GitHub's content API. This session's local shell cannot resolve github.com, so pnpm, Playwright, governance, build, and build-size commands are still unrun locally and must be verified through CI or a working checkout.

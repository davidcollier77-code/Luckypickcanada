# Verification Quickstart

## Expected Behavior

- PR open/reopen/ready/synchronize: Robin primary review is attempted when at least five free requests remain; if primary is skipped or does not yield a verified review, a second pinned Robin action uses an alternate OpenRouter free model when free quota is not confirmed zero.
- Authorized `/review` or `/robin` comment: same primary/fallback behavior.
- `/summary` and `/help`: preserve command handling; they are not code-review fallback triggers.
- Amazon Q: stays an independent reviewer. Robin's workflow must never post `/q review` or accept Q output as its result.
- Confirmed free quota of zero: skip the inference fallback, and fail unless an in-scope current-head Robin review is verified.
- Successful action without a review for the exact current head: fail closed.

## Commands

```bash
pnpm test -- tests/workflows/robin-openrouter-fallback.test.ts
pnpm test
pnpm exec tsc --noEmit
./jules-verify.sh
```

Run `./jules-verify.sh` and the full test suite in the repository's standard runner/PR CI. The connected session's local shell could not resolve github.com and therefore cannot establish local pass results.

## Review Evidence

Check that the primary and fallback step both use the same secret reference, the fallback model output ends in `:free`, the quota-zero condition skips inference, Q-specific step/output names are absent, and the final current-head guard checks commit SHA and run start time. Do not report verification as passed until actual CI outputs are available.

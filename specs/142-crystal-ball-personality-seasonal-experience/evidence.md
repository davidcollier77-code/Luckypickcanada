# Evidence — Crystal Ball Personality, Local Time and Canadian Seasons

**Date:** 2026-11-12
**Branch:** `freebuff/3625a98e3b6b0eab9e6a60b2`
**Base:** `main`

## Local checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Focused Crystal Ball suites | `pnpm exec vitest run __tests__/crystal-ball-local-time.test.js __tests__/crystal-ball-calendar.test.js __tests__/crystal-ball-fortunes.test.js __tests__/crystal-ball-greetings.test.js __tests__/oracle-route-validation.test.js` | PASS — 103 tests, 5 files |
| Full unit suite | `pnpm run test` | PASS — 60 files, 579 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Production build | `pnpm run build` | PASS — `Build completed successfully` |
| Cloudflare/OpenNext bundle | `pnpm exec opennextjs-cloudflare build` | PASS — `Worker saved in .open-next/worker.js`, `OpenNext build complete`, exit 0 |
| Repository gate | `./freebuff-verify.sh` | PASS — exit 0; Spec Kit gate, AGENTS.md classifier, verification-integrity tests, type check, production build and 36/36 docs tests |
| Diff hygiene | `git diff --check` | PASS — no whitespace errors |

## Live production-build verification

A `next start` server was run on the reserved preview port and driven through the Cloud browser.

- **Hydration and local time:** the page hydrated correctly. The VM's browser reported
  `America/New_York`, `Wed Nov 11 2026 20:15 EST`, and the shared countdown showed a live
  `Daily reset in 03:44:42`.
- **Solemn-day greeting:** because the local date was November 11, the greeting rendered
  `Today the glass is quiet. Take a moment to remember.` instead of the playful personality.
- **Solemn-day fortune:** the generated reading was
  `There is strength in remembering without turning the day into a performance. Keep it sincere,
  keep it warm and be kind to the people carrying older stories.`
  It contained no exclamation mark and no `eh?`, and was saved to the daily allowance.
- **Follow-up:** the optional follow-up flow opened, accepted
  `What should I carry into the rest of the day?`, displayed the question and returned
  `The glass offers a simple reading: listen, remember and let your next small action be a
  thoughtful one.` with no humour. `fortuneUsed` and `followUpUsed` were both true.
- **Refresh persistence:** after reload, the fortune and follow-up answer were restored and no
  second follow-up input was offered.
- **Provider fallback:** the live server had no `GROQ_API_KEY`; the oracle logged the expected
  missing-key diagnostic twice (fortune and follow-up) and returned tone-correct fallbacks.
- **Live greeting boundary:** with the page kept open and the local clock advanced from
  16:59:57 to 17:00:01, the greeting changed from
  `Good afternoon. Come in, come in — …` to
  `Good evening. Come in, come in — …`, and the countdown moved to the new local day
  (`07:00:04` → `07:00:00`).

## Playwright status

`pnpm exec playwright screenshot --browser chromium about:blank` fails before navigation with:

```text
error while loading shared libraries: libnspr4.so: cannot open shared object file
```

That is a sandbox host-library limitation. The visual greeting spec was updated for the new
salutation, but the Playwright projects were **not executed** in this environment.

## Build size

Measured with `du -sb .next public` after the final production build:

```text
447,555,256 bytes = 426.82 MiB
```

The repository hard cap is strictly below 495 MiB. **PASS.**

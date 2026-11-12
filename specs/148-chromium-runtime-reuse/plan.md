# Implementation Plan: Reuse an Environment-Provided Chromium Runtime

**Feature**: `specs/148-chromium-runtime-reuse/`
**Branch**: `freebuff/0fe51d9fb70d7d5eedbd7455-image-aware`
**Base**: `main` at `d4dc6952`

## Context

`scripts/setup-chromium-libs.sh` was written when the private prefix was the only way to get a working Chromium
runtime. It now runs in three different environments: today's Cloud image (nothing installed), a developer machine or
CI runner (everything installed system-wide), and a possible future image that ships the libraries and a Playwright
browser. Only the first needs provisioning, but the script did the work unconditionally and always exported paths.

## Decisions

1. **Two runtimes, no mixed mode.** A workspace uses either the complete system runtime or the complete private
   prefix. Mixing (system libraries with private fonts, or the reverse) would still require both `LD_LIBRARY_PATH`
   and `FONTCONFIG_*`, so it saves nothing over the prefix alone while doubling the states to reason about.
2. **Completeness is checked, not assumed.** Every object in `REQUIRED_LIBS` must resolve, either in the standard
   directories or through `ldconfig -p`. `ldconfig` is read once per process: without that cache, a missing runtime
   would spawn it once per library.
3. **System mode removes exports instead of adding them.** `--env` prints nothing for libraries, `--check` passes an
   empty `LD_LIBRARY_PATH` so `ldd` proves the loader resolves the objects, and `--persist` writes an env file without
   any library keys. This is what makes an image that ships the packages free.
4. **Prebaked browser safety rule: writable or pinned.** Playwright fails on a revision mismatch instead of falling
   back, and an image directory is usually read-only, so a read-only root must match `playwright-core/browsers.json`
   exactly (`chromium-1248` for Playwright 1.64.1). A writable root may hold any revision because
   `playwright install` can repair it there. Without the pin resolvable (no `node_modules`), read-only roots are not
   trusted, which keeps a fresh checkout from pointing at an unverified browser.
5. **The pin governs the install skip and the strict check, not only the selection.** Review of the first revision
   showed the rule stopping at root selection: `--browser-root` accepted any `chrome` binary, so a stale
   `~/.cache/ms-playwright` (or a writable prebaked root) suppressed the install that would have repaired it, and the
   probe then failed on the missing pinned revision. `--browser-root` now succeeds only for the pinned revision, which
   covers the default cache and every writable root, and `--check` lists only the pinned binaries. The writable-any
   rule survives solely for _selecting and exporting_ a root, where the following install repairs it. The install is
   confirmed rather than assumed: `--install-browser` re-runs `--browser-root` afterwards and fails with the pinned
   revision if the download did not produce it, because otherwise the probe reports a host-library error for what is
   really a missing browser. Both paths log the resolved revision, so a log answers "which browser did this pick?"
   without a second command.
6. **CI prerequisite, not an application change.** The OpenNext validator failed before running any validation step
   because `actions/setup-node` with `cache: pnpm` ran before `pnpm/action-setup`. It now matches the order already
   used by Visual QA and the updater scheduler, and a new guard checks every workflow so the same mistake cannot
   return silently.
7. **`PLAYWRIGHT_BROWSERS_PATH` is the delivery mechanism.** It is Playwright's documented override, read by the CLI,
   the probe and the test runner, so `playwright.config.ts` does not change. Its existing prefix injection already
   no-ops when the prefix is absent, which is exactly the system-runtime case.
8. **Symlinked roots are supported.** `find -L` with `-maxdepth 4` lets an image mount its browser install through a
   symlink; the depth bound keeps the traversal finite.
9. **Config keys are owned, not accumulated.** `--persist` deletes the library, font and browser-root keys this
   workspace no longer needs, so a workspace that moved to a system runtime cannot keep launching with a stale
   `LD_LIBRARY_PATH`. Unrelated keys and `launchOptions` entries are preserved.
10. **Testability by directory override, not by mocking.** `CHROMIUM_SYSTEM_LIB_DIRS`, `CHROMIUM_SYSTEM_FONTS`,
    `CHROMIUM_SYSTEM_FONT_DIRS` and `CHROMIUM_BROWSER_DIRS` follow the existing `CHROMIUM_LIBS_PREFIX` /
    `CHROMIUM_APT_STATE` convention, so tests point detection at fixtures and never consult this machine's real
    libraries or reach the apt path.

## Rejected alternatives

- **Detecting by launching Chromium.** A launch proves everything at once but needs a browser, so it cannot gate the
  library step that runs before any browser exists.
- **`playwright install --dry-run` for the revision.** It prints the install location but needs a working pnpm
  install, is slower than reading `browsers.json`, and prints human-formatted text.
- **Rewriting `playwright.config.ts`.** It would duplicate the detection rules in a second language for no behavior
  the environment variable does not already provide.
- **Accepting any prebaked root.** It would turn a stale image into a startup failure instead of a download.
- **Making the prefix a symlink to the system directories.** It needs write access to a shared location the workspace
  does not have.

## Files

| File                                                            | Change                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `scripts/setup-chromium-libs.sh`                                | System-runtime detection, prebaked browser roots, mode-aware `--env`/`--check`/`--persist`, `--browser-root`. |
| `scripts/setup-playwright-agent.sh`                             | Skip the browser download when `--browser-root` finds one.                                                    |
| `__tests__/setup-chromium-runtime-detect.test.js`               | Eight detection tests, including read-only pinned and wrong-revision rejection.                               |
| `__tests__/workflow-pnpm-setup-order.test.js`                   | Guards pnpm-before-`setup-node` in every workflow.                                                            |
| `.github/workflows/validate-open-next-repair.yml`               | Installs pnpm before Node.js so the pnpm cache resolves.                                                      |
| `README.md`                                                     | Steps 5 and 8, plus where the browser comes from.                                                             |
| `.agents/skills/playwright-cli/references/lucky-pick-canada.md` | Note that both scripts defer to the environment.                                                              |
| `memory-bank/activeContext.md`, `.specify/feature.json`         | Record this feature.                                                                                          |
| `specs/148-chromium-runtime-reuse/*`                            | Spec Kit artifacts.                                                                                           |

## Risks

- **Silent system-runtime false positive.** A directory that contains the file names but not working libraries would
  skip provisioning and then fail the probe. Mitigation: detection requires the full set plus fontconfig, and the
  startup command still ends with a real launch, which is the authority.
- **Baked revision drift.** A future image pinned to an older Playwright falls back to the download rather than
  failing. That is the intended trade-off and is stated in the README.
- **Behavior change in this workspace.** Covered by re-running the real checks and the documented startup command.

## Verification plan

Detection tests, `bash -n`, the real workspace checks (`--check-libs`, `--check`, `--browser-root`, `--env`,
`--persist`), a read-only pinned root exercised through `pnpm exec playwright cli` with no exports and no flags, a
read-only wrong-revision root that must be ignored, `setup-playwright-agent.sh --install-browser` reusing the
browser, `tsc --noEmit`, `./freebuff-verify.sh`, and the production build size against the 495 MiB cap.

# Research: Major-Scoped Undici Security Overrides

**Feature**: `specs/224-undici-major-scoped-security-fix/spec.md`
**Date**: 2026-11-26

## Decision

Replace the single `pnpm.overrides.undici = "8.12.2"` entry with three version-range selectors:

```json
"undici@6": "6.29.1",
"undici@7": "7.30.2",
"undici@8": "8.13.1"
```

The selectors let pnpm patch each consumer in the major it already declares. They avoid forcing Wrangler, Miniflare and `@cloudflare/workers-utils` from 7.x to 8.x, and `@dotenvx/dotenvx` from 6.x to 8.x.

## Evidence

### Current dependency graph

The pre-change lockfile has one `undici@8.12.2` snapshot and five consumers, all forced to 8.12.2 by the bare override:

| Consumer | Declared Undici request | Intended major |
| --- | --- | --- |
| `@dotenvx/dotenvx@2.38.2` | `^6.28.1` | 6 |
| `wrangler@4.166.0` | `7.30.2` | 7 |
| `miniflare@5.20261119.0-beta` | `7.30.2` | 7 |
| `@cloudflare/workers-utils@0.56.0` | `7.30.2` | 7 |
| `jsdom@31.0.1` | `^8.12.3` | 8 |

The OpenNext adapter and its AWS dependencies do not consume Undici directly. PR #2047 separately updates OpenNext and Wrangler; this fix does not depend on that branch.

### Upstream security release

Undici published security releases on 2026-11-05. The 8.12.4 and 7.30.2 release notes list six advisories fixed after 8.12.2/8.12.3, including CVE-2026-116592 / GHSA-mqg3-3v4r-cm32 (high severity, redirect-chain cache poisoning and cross-user response disclosure). The 8.12.2 pin was added on 2026-10-24, before those releases, so it is below the patched floor.

At audit time the published dist-tags were:

- 8.x: 8.13.1 (latest)
- 7.x: 7.30.2 (latest)
- 6.x: 6.29.1 (latest)

The task's requested versions match those patched releases. The 6.x line is still consumed by dotenvx and must not be forced to 8.x.

### pnpm 10 selector support

The repository already uses major-scoped override keys (`glob@10`, `minimatch@10`, `brace-expansion@1` and `brace-expansion@2`), so pnpm 10.30.3 supports this selector form. The lockfile's top-level `overrides:` block is the authoritative record of the applied selectors; pnpm may quote keys containing `@`, and the dependency-management guard already parses quoted YAML scalars.

## Alternatives Considered

1. **Keep 8.12.2 and add a second global patch**: Rejected. A bare `undici` override still forces every consumer across major boundaries and remains below the patched floor.
2. **Set the bare override to 8.13.1**: Rejected. It would force dotenvx from 6.x and Wrangler/Miniflare/workers-utils from 7.x into 8.x. Those consumers declare 6.x or an exact 7.30.2 request; a cross-major force is unsupported and was the reason the original global pin was unsafe.
3. **Set the bare override to 8.12.4**: Rejected. It is patched but still forces 6.x and 7.x consumers onto 8.x, and it is not the latest 8.x release.
4. **Use parent-specific selectors such as `wrangler>undici`**: Rejected. Version-range selectors are simpler, cover every current and future consumer in the same major, and match the repository's existing override style.
5. **Remove all Undici overrides**: Rejected. It would leave dotenvx on 6.28.x and jsdom on 8.12.3, both below the patched floor.

## Verification Implications

- `pnpm install --lockfile-only` must regenerate the graph. The resulting lockfile must contain one snapshot per patched release and no 8.12.2.
- `pnpm why undici` must show dotenvx on 6.29.1, the Workers tools on 7.30.2 and jsdom on 8.13.1.
- The dedicated guard must assert the exact overrides and versions, not merely that some Undici release is present.
- Wrangler and Miniflare are the highest-risk consumers because they request an exact 7.30.2. Running `wrangler build` and the updater-scheduler dry-run directly exercises that graph; the OpenNext build exercises the adapter path.

## Limitations

- `pnpm audit --json` reports zero vulnerabilities because the GitHub global advisory API does not yet include these 2026-11-05 Undici advisories. It is not proof of safety and is not used as the acceptance signal.
- The upstream release notes are the authoritative source for the patched floors; the local `.docs/` library has no Undici document.
- No production deployment, live traffic check or physical-device test is part of this task.

# Implementation Plan: Reliable Spec Kit Updater with One Retry

**Branch**: `fix/spec-kit-updater-single-retry` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

## Summary

Restore the managed Spec Kit specify command to its last known-good content and reduce scheduled execution to a primary run plus a single retry. Keep the upgrade safe: do not add `--force`; instead restore the exact content recorded in the current integration manifest.

## Technical Context

- **Language/Version**: GitHub Actions YAML and Bash; runner was Ubuntu 24.04.5 in the observed run.
- **Primary Dependencies**: GitHub Actions; Spec Kit CLI launched with `uvx --from specify-cli`; generic integration configured under `.specify/integration.json`.
- **Storage**: Git repository files, Spec Kit's integration manifest, and GitHub Actions run/step metadata; no new storage service.
- **Testing**: Workflow schedule/config inspection, manifest checksum comparison, `./jules-verify.sh`, `pnpm tsc --noEmit`, `pnpm run build`, build-size measurement, and post-change workflow execution.
- **Target Platform**: GitHub Actions on `ubuntu-latest`, scheduled in `America/Halifax`.
- **Project Type**: Repository maintenance / CI workflow.
- **Performance Goals**: At most two scheduled updater runs per Tuesday or Friday.
- **Constraints**: Do not overwrite genuinely modified managed files by force; don't change application source or dependencies; 495 MB remains the hard maximum build size.
- **Observed versions**: The failing log reports Specify CLI 1.2.0; the repository's generic integration manifest records 1.1.3 before upgrade. The workflow pins checkout v4.4.0, setup-node v6.5.0, setup-uv v10.2.0, and create-pull-request v6.1.0 by SHA.

## Constitution Check

- **Single Source of Truth**: Repository `AGENTS.md` was read first and remains unchanged.
- **Verify Before Acting**: Run #24 and its failed step/log were inspected; the command's expected SHA-256 was compared with the managed manifest.
- **Implementation Sequence**: Scope is limited to workflow scheduling, restoring the managed prompt file, and the required Spec Kit/memory artifacts.
- **Protect Core Systems**: The documentation updater is a protected system; explicit owner authorization was received. No secrets, APIs, database, payments, deployment, or application behavior are changed.
- **Resource Conservation**: No new dependencies or service calls are introduced. Context7 was not used.
- **Post-design re-check**: The proposed change retains the existing daily success guard and safe no-force integration upgrade.

## Research Decisions

1. Restore `.jules/cmds/speckit.specify.md` from the last known-good managed version at commit `903e1f86`; its SHA-256 matches the `.specify/integrations/generic.manifest.json` entry exactly.
2. Preserve `specify integration upgrade generic` without `--force`. Official Spec Kit documentation confirms modified managed files intentionally block the upgrade unless force is explicitly used.
3. Keep `5 1 * * 2,5` and `5 5 * * 2,5`, both with `America/Halifax`; remove `5 9 * * 2,5`.
4. Preserve the existing daily guard: only an earlier success marker from a create/update PR operation makes the retry skip.

## Project Structure

```text
.github/workflows/update-spec-kit.yml
.jules/cmds/speckit.specify.md
.specify/feature.json
specs/022-spec-kit-updater-recovery/  (active Spec Kit task artifacts)
memory-bank/activeContext.md
memory-bank/progress.md
```

## Verification Plan

- Inspect the schedule and confirm there are exactly two entries with the desired cron fields and timezone.
- Compare the restored command's SHA-256 with the recorded manifest hash.
- Run `./jules-verify.sh`, `pnpm tsc --noEmit`, `pnpm run build`, and the repository's prescribed build-size measurement.
- After the proposed changes land, use the existing manual `workflow_dispatch` trigger to verify the integration upgrade, extension update, status validation, governance validation, and PR creation/refresh sequence.
- Do not claim runtime success until those commands actually run and pass.

# Implementation Plan: Remove the Retired Public Theme CSS Mirror

**Branch**: `chore/178-public-theme-css-cleanup` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/178-public-theme-css-cleanup/spec.md`

## Summary

Remove the eight-file legacy CSS mirror at `public/themes/default/` as a complete unit. Preserve every active stylesheet under `themes/default/` and all application imports. Correct the three living CSS/deployment guides that still recommend the retired public-copy approach.

## Technical Context

- **Language/Version**: CSS and Markdown; application toolchain is Node.js 26.x.
- **Primary Dependencies**: Next.js 16.4.3; no dependency changes.
- **Storage**: N/A.
- **Testing**: Repository reference search; Browserless inspection of production HTML; PR-triggered Visual QA, unit tests, TypeScript, DevSkim and OpenNext build validation.
- **Target Platform**: Next.js App Router deployed through Cloudflare OpenNext.
- **Project Type**: Web application / static stylesheet and documentation cleanup.
- **Performance Goals**: Remove stale public CSS files without changing the CSS compiled into the application.
- **Constraints**: Preserve active theme sources and behavior; build output remains below 495 MiB; no Cloudflare, application runtime, dependency or visual baseline changes.
- **Scale/Scope**: Eight public CSS deletions and three documentation corrections, plus scoped Spec Kit records.

## Constitution Check

- **Scope**: The user explicitly authorized removal of the old public stylesheet bundle in a separate PR.
- **Source of truth**: Current application imports and production HTML were inspected; the active CSS remains in `themes/default/`.
- **Visual preservation**: No active source CSS declarations, app modules, assets or visual baselines are modified.
- **Protection**: No protected governance file, workflow, checker, configuration, package manifest, database or Cloudflare resource is changed.
- **Build size**: No dependency or application build input is added. A local build could not run because the available environment has Node.js 22.16.0 and no pnpm, while the repository requires Node.js 26.x and pnpm 10.30.3.
- **Verification integrity**: Browserless page evidence is included; PR-triggered checks remain pending after submission.

## Phase 0: Research

The repository import graph and current production HTML resolve the only material question. No additional framework research is required: the application imports source styles from `themes/default/`, and its rendered routes link to generated Next.js CSS bundles rather than the public mirror.

## Design Decisions

1. Delete all eight files in `public/themes/default/` together because the public `index.css` imports the other files in that directory.
2. Preserve all files under `themes/default/` and every application import.
3. Update only `CSS_FIX_GUIDE.md`, the Bug #1 section of `QUICK_FIX_GUIDE.md`, and CSS-specific checks in `DEPLOYMENT_CHECKLIST.md`.
4. Do not touch historical task records, application behavior, tests, visual snapshots, deployment configuration or external services.

## Project Structure

- `public/themes/default/*.css`: retired public mirror; all eight files removed.
- `themes/default/*.css`: active theme source; unchanged.
- `CSS_FIX_GUIDE.md`: current stylesheet loading reference.
- `QUICK_FIX_GUIDE.md`: corrected CSS troubleshooting section; database guidance retained.
- `DEPLOYMENT_CHECKLIST.md`: corrected CSS build, browser, rollback and troubleshooting checks; unrelated deployment/database guidance retained.
- `specs/178-public-theme-css-cleanup/`: specification, plan, tasks and requirements checklist.

## Verification Gate

The implementation is self-reviewed against the PR scope checker, visual-change classifier, changed-code review and verification-integrity requirements. Browserless evidence covers the homepage, Crystal Ball and map routes. PR CI will supply the required current-head Visual QA, test, type and build results. Local tests and build are not claimed because the required toolchain is unavailable in the current session.

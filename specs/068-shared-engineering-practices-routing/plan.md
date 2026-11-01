# Implementation Plan: Shared Engineering Practices Reference Routing

**Branch**: `freebuff/gemini-api-skill-conditional-routing-20261101` | **Date**: 2026-11-01 | **Spec**: `specs/068-shared-engineering-practices-routing/spec.md`

## Summary

Register Google's “What to Look For in a Code Review” as one shared upstream source, route it to all eight Freebuff task groups, and make it an optional cross-cutting reference in each group's normal instructions.

## Technical Context

**Language/Version**: Markdown and JSON; existing Node.js documentation refresh script.
**Primary Dependencies**: None. No package changes.
**Testing**: Parse/validate manifest JSON; assert exact group membership, source URL, snapshot filenames, and instruction references; inspect existing updater's manifest-driven canonical-file and symlink logic. The owner will re-trigger the updater after the PR changes are available.
**Constraints**: Do not modify the updater implementation or `.docs/` snapshots directly. Do not make the reference mandatory for every task. Preserve all existing group-specific guidance and the existing PR.

## Design

- Use manifest ID `/google/eng-practices`; the updater converts this to `_google_eng-practices.md`.
- Point the source to the raw Markdown file in Google's official `google/eng-practices` repository.
- Append the source ID to each of the eight existing manifest groups. Creation remains first, so the updater writes one canonical copy there and creates symlinks in the other groups.
- Add a short, conditional reference block to each group file, with its group-specific local path, scope, attribution, and precedence.
- Add a concise entrypoint note so Freebuff knows the reference is shared and optional.
- Keep the actual upstream snapshot managed by `scripts/refresh-docs.js`; do not hand-create files under `.docs/`.

## Source and Maintenance

Google's repository was archived on 2025-11-21. The source remains a useful published checklist but will not receive upstream repository updates. The updater can still retrieve and inventory the archived source; it cannot make the upstream project active again.

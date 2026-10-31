# Implementation Plan: Freebuff Agent Governance Migration

## Approach
Make a repository-only migration that preserves existing command contents and operational behavior. Retire the two Jules library sources at both the manifest and updater layers so restoring an old manifest cannot restore their snapshots.

## Work sequence
1. Audit the current manifest, documentation updater, task-group instructions, Spec Kit integration, verification script, and all active references.
2. Add a permanent retired-source filter and safe snapshot cleanup to the docs updater. Include regression coverage for both manifest reintroduction and dangling snapshot symlinks.
3. Remove both Jules IDs from every manifest routing location and remove all tracked snapshot files and symlink entries from the eight task groups.
4. Move active instructions and the ten Spec Kit command definitions from `.jules/` to `.freebuff/`. Remove Jules documentation requirements, make the Gemini API Developer Skill mandatory across all groups, retain the general Gemini API overview only in Creation, and keep Gemini CLI conditional.
5. Update `AGENTS.md`, the Constitution, Spec Kit integration settings and file manifest, scheduled updater/rebase scripts, pre-commit hook, and updater documentation.
6. Rename the verification script and update active callers, preserving executable permissions.
7. Inspect the complete branch tree and diff; run focused updater and Spec Kit tests plus the Freebuff verification gate; review current-head CI. Leave the PR open and unmerged.

## Risk controls
- Preserve Spec Kit command contents and existing customization overlays.
- Keep the Gemini API Developer Skill mandatory in all eight groups, the general Gemini API overview scoped to Creation, and Gemini CLI conditional.
- Do not rename or disable the separate production Jules API webhook Worker without a verified replacement.
- Do not rewrite historical task/PR records merely to remove past Jules mentions.
- Do not claim verified completion while mandatory tests or current-head checks remain pending.

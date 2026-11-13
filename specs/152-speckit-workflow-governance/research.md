# Research: Spec Kit Workflow Governance Alignment

**Date**: 2026-11-13
**Feature**: `specs/152-speckit-workflow-governance/spec.md`

## Installed Version and Command Inventory

The repository records Spec Kit version **1.4.0** in:

- `.specify/init-options.json`
- `.specify/integration.json`
- `.specify/integrations/generic.manifest.json`
- `.specify/integrations/speckit.manifest.json`

The nine installed command definitions are:

| Core stage | Command file |
|---|---|
| Specify | `.freebuff/cmds/speckit.specify.md` |
| Plan | `.freebuff/cmds/speckit.plan.md` |
| Tasks | `.freebuff/cmds/speckit.tasks.md` |
| Implement | `.freebuff/cmds/speckit.implement.md` |

| Supporting command | Command file |
|---|---|
| Clarify | `.freebuff/cmds/speckit.clarify.md` |
| Analyze | `.freebuff/cmds/speckit.analyze.md` |
| Checklist | `.freebuff/cmds/speckit.checklist.md` |
| Constitution | `.freebuff/cmds/speckit.constitution.md` |
| Converge | `.freebuff/cmds/speckit.converge.md` |

The four core stages are required in sequence by the repository constitution. Supporting commands are separate command definitions and are used when their instructions or task needs make them applicable; their presence does not mean all five must be executed on every task.

## Template Requirements and Conditional Content

- `.specify/templates/spec-template.md` identifies User Scenarios & Testing, Requirements and Success Criteria as mandatory. Key Entities applies only when the feature involves data. Assumptions must be grounded in reasonable defaults.
- `.specify/templates/plan-template.md` requires the technical context, constitution check and concrete project structure. Its Complexity Tracking section is to be filled only when the Constitution Check has violations that need justification.
- `.specify/templates/tasks-template.md` requires specific task formatting, file paths and story organization. Test tasks are explicitly optional unless the feature specification requests them.
- The command definitions provide additional task-specific requirements, including validation and extension-hook handling.

Therefore, "fill out everything" must mean every required item and every applicable conditional item—not inventing content for optional or irrelevant sections.

## Existing Governance Gap

The prior Section A.9 asked Freebuff to use the Spec Kit command files and complete Specify, Plan and Tasks before implementation. It did not explicitly:
- name the four core stages and five supporting commands;
- require all required template sections, fields and groups to be completed;
- distinguish conditional and optional content;
- check for changes to the installed Spec Kit workflow;
- notify the owner and authorize only a surgical correction to `AGENTS.md`.

The existing governance test asserted the old wording and therefore needs a directly related update.

## Relevant Repository Safeguards

- `.github/workflows/protected-files.yml` treats `AGENTS.md` as protected and requires a dedicated governance PR.
- `.github/scripts/agents_md_protection.py` permits the governance file with relevant governance tests and Spec Kit task records, while refusing unrelated application changes in the same PR.
- `PR_SUBMISSION.md` requires a complete PR body, truthful verification statuses, an open non-draft unmerged PR, and an immediate stop after successful submission.

## Conclusion

A narrow Section A.9 correction plus the existing governance regression-test update is sufficient. No application code, templates, Spec Kit command definitions or protection workflow need to change.

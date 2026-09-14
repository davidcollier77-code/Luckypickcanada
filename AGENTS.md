LuckyPickCanada — Final AGENTS.md Documentation Workflow Update

Use the repository’s actual current state as the source of truth.

A — ANALYZE

FIRST: Read and follow the repository’s actual "AGENTS.md". It is authoritative.

Inspect the current repository and current "AGENTS.md" before making any changes.

After "AGENTS.md" has established the repository workflow, every substantive task must ALWAYS use the required Jules and Gemini documentation, including:

- the official Jules Documentation
- the official Jules API documentation
- the official Gemini CLI documentation
- the official Gemini API documentation

These four documentation sources are mandatory for every substantive task. Do not skip them because a task appears simple or because the repository files appear sufficient.

The four required Jules/Gemini documentation sources must be actually read and used to inform the work, not merely acknowledged, listed, or referenced.

Then use the repository’s applicable Jules guidance files:

- ".jules/jules.md"
- the applicable specialist file(s) under ".jules/*.md"
- the applicable command/workflow file(s) under ".jules/cmds/*.md"

Use the current "AGENTS.md" and the task itself to determine which ".jules/*.md" specialist guidance and ".jules/cmds/*.md" command/workflow guidance applies.

Do not merely read or summarize these files. Read, use, and apply their applicable instructions, constraints, decisions, workflow requirements, and technical guidance to the actual work.

Also identify and use all other applicable repository guidance, project context, task-specific instructions, command/workflow instructions, and reference material required by the repository workflow.

This includes, where applicable:

- "memory-bank/projectBrief.md"
- "memory-bank/activeContext.md"
- "memory-bank/progress.md"
- "memory-bank/techContext.md"
- applicable ".specify/*"
- applicable ".specify/memory/*"
- other repository-specific instruction or workflow files required by "AGENTS.md"
- relevant ".docs/" library/reference files identified through ".docs/manifest.json"

Do not treat Memory Bank as the only source of project context.

After establishing the applicable guidance, determine which library/reference documentation is relevant to the specific task. Read the relevant ".docs/" files and use that documentation to inform and shape the work.

Verify important implementation facts against the actual current source, configuration, dependencies, and repository state.

Never treat a previous agent report, PR description, memory entry, cached documentation, or prior task result as authoritative when the current repository can establish the fact.

B — BOUNDARIES AND PLAN

This task is limited to the documentation-usage wording in "AGENTS.md".

The objective is to make the repository workflow explicitly require Jules to read, use, and apply the applicable documentation and repository guidance, while making the Jules/Gemini documentation requirement mandatory for every substantive task.

Preserve the existing repository governance and behavior, including:

- the ABC operating model
- the existing instruction hierarchy
- authorization and scope requirements
- Memory Bank rules
- ".jules/" and ".jules/cmds/" workflow rules
- ".specify/" workflow integration
- ".docs/" protection rules
- documentation-mapping governance
- the existing 46-library inventory
- the existing 8 task groups
- documentation refresh/update governance
- existing Jules/Gemini workflow requirements

Do not redesign or broadly restructure "AGENTS.md".

For this task, do not modify:

- ".docs/"
- ".docs/manifest.json"
- documentation sources or library mappings
- documentation refresh scripts
- documentation refresh workflows
- ".jules/"
- ".jules/cmds/"
- ".specify/"
- "memory-bank/*"
- application code
- dependencies
- unrelated files

Reading and using these resources when applicable is permitted and required; modifying them is not authorized.

For this task, ".docs/" is reference-only. Applicable ".docs/" files may be read and used, and the specific files actually referenced must be reported, but ".docs/" and its documentation system must not be updated, refreshed, regenerated, or modified.

Make the smallest wording change necessary to establish the intended behavior.

Do not introduce new workflow concepts unless they are necessary to express the requested documentation-usage requirements.

C — EXECUTE, VERIFY, AND REPORT

Update only the authorized documentation-usage wording in "AGENTS.md".

The resulting workflow must clearly establish this sequence:

Read and follow "AGENTS.md" first → always read and use the four required Jules/Gemini documentation sources → identify all other applicable repository guidance and context → identify relevant library/reference documentation → read, use, and apply those sources → verify against the current repository.

The resulting wording must make clear that:

1. "AGENTS.md" remains authoritative and is read first.
2. The official Jules Documentation is mandatory for every substantive task.
3. The official Jules API documentation is mandatory for every substantive task.
4. The official Gemini CLI documentation is mandatory for every substantive task.
5. The official Gemini API documentation is mandatory for every substantive task.
6. Those four Jules/Gemini documentation sources must actually be read and used to inform the work, not merely acknowledged or cited.
7. ".jules/jules.md" is an explicit repository guidance source and must be read and followed.
8. Applicable ".jules/*.md" specialist guidance must be identified, read, and applied.
9. Applicable ".jules/cmds/*.md" command/workflow guidance must be identified, read, and applied.
10. Jules must identify and use all other applicable repository guidance and project context required by the repository workflow.
11. This includes applicable "memory-bank/projectBrief.md", "memory-bank/activeContext.md", "memory-bank/progress.md", "memory-bank/techContext.md", ".specify/*", ".specify/memory/*", and other repository-specific guidance when relevant.
12. Relevant ".docs/" library/reference documentation must be selected according to task relevance through ".docs/manifest.json", then read and used.
13. Relevant information from all applicable sources must be applied to the actual task.
14. Current repository state remains authoritative for implementation facts.
15. ".docs/" remains read-only unless a future task explicitly authorizes documentation-system changes.
16. The existing 46-library inventory remains unchanged.
17. The existing 8 task groups remain unchanged.
18. No unrelated governance or workflow rules are changed.

Keep the wording concise, operational, and non-redundant.

Avoid duplicating the same requirement in multiple sections when one clear requirement is sufficient.

Do not weaken any existing higher-priority repository instruction.

Verification

After editing:

1. Review the complete "AGENTS.md".
2. Confirm the existing governance and instruction hierarchy remain intact.
3. Confirm the mandatory four Jules/Gemini documentation sources are explicitly named and required for every substantive task.
4. Confirm the wording requires those sources to be read and used, not merely consulted or acknowledged.
5. Confirm ".jules/jules.md" is explicitly named.
6. Confirm applicable ".jules/*.md" and ".jules/cmds/*.md" guidance is explicitly required when relevant.
7. Confirm applicable Memory Bank and ".specify/" guidance is covered.
8. Confirm relevant ".docs/" documentation is selected by task relevance and must be read and used.
9. Confirm the existing 46-library inventory and 8 task groups are preserved.
10. Confirm ".docs/", ".docs/manifest.json", documentation refresh scripts, and documentation workflows were not modified.
11. Confirm ".jules/", ".jules/cmds/", ".specify/", and "memory-bank/*" were not modified.
12. Confirm no unrelated files were modified.
13. Run appropriate validation for this documentation-only change.
14. Double-check the final repository state and report only verified results.

Reporting

Report only evidence-supported results.

Include:

- the exact file changed
- the exact section or wording changed
- validation performed
- final repository state
- the specific ".docs/" library/reference files actually read and used
- a brief explanation of how each referenced ".docs/" file informed the task
- the specific repository guidance files actually used, including applicable ".jules/", ".jules/cmds/", Memory Bank, or ".specify/" files when relevant

Do not claim a documentation source was used unless it was actually read and applied.

Do not claim a repository file was inspected unless it was actually inspected.

Do not claim validation passed unless it was actually performed.

Do not modify any file outside the authorized "AGENTS.md" wording change.

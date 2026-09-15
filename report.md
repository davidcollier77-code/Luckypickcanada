A — Verified

State:
- The current "AGENTS.md" required Jules to read files, establish official baselines, and identify relevant resources, but did not require an explicit selection of a task group.
- The reporting section required reporting "relevant libraries" but did not clearly distinguish between documentation that was merely "consulted" versus documentation that was materially "used/applied" during implementation.

B — Applied

State:
- Clarified the required governance concept by explicitly adding the selection of one of the eight task groups to the "Required initialization order".
- Added language clarifying that repository files and project systems should be "materially applicable" to the task, not simply checked off arbitrarily.
- Updated the "Consult documentation" step and the reporting requirement to differentiate between "Consulted" (read/reviewed) and "Used/Applied" (materially influenced).
- Inserted surgical changes in sections 1, 3, 4, and the reporting rules in B and C of AGENTS.md, avoiding duplication of entire file structures.

C — Verified

State:
- Exact files changed: `AGENTS.md` and `report.md`.
- Confirmed via `git show` that both files changed.
- Verified that the final diff represents surgical additions exactly matching the ABC requirements.
- Confirmed the 8 task groups remain unchanged.
- Confirmed the 53-library inventory remains unchanged.
- Confirmed the Memory Bank rules remain intact.
- Confirmed the MCP approval rules (including Context7) remain explicitly gated.
- Confirmed existing protected governance (payment, db, env, UI, etc.) remain intact.

Systems & Documentation Used:
- `AGENTS.md` (Self-governance)
- No external library documentation was required for this task.

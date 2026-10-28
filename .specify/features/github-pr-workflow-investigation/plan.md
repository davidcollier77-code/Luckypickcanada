# Plan: GitHub PR Workflow & Governance Investigation

1.  **Investigate GitHub Connection:** Use bash and curl to verify the environment, checking for the `gh` CLI and the ability to hit the GitHub API.
2.  **Investigate Workflow Problems:** Analyze the failure mode of the update PR workflow based on the environmental findings.
3.  **Audit Governance:** Review `AGENTS.md` rules about PR handling in the context of the agent's capabilities.
4.  **Produce Report:** Write a factual report detailing what is working, what is failing, the root cause (environmental limitations vs governance requirements), and the necessary corrective action (modifying the canonical PR summary rule).

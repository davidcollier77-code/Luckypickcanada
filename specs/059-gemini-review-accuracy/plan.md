# Plan: Gemini Full-Review Accuracy and Compact Review Context

1. **Inspect the current review pipeline**
   - Trace command routing, source-context collection, task-group/document selection, batch construction, model fallback, finding normalization, verdict generation, and publication.
   - Use the missed-defect examples from the PR #1634 Amazon Q review as regression patterns while rechecking the current code.
2. **Add independent adversarial review**
   - Add a dedicated prompt helper with a concise defect-seeking checklist and explicit instruction not to defer to the primary pass.
   - Run it for each batch after the primary pass, even if the primary pass fails.
   - Merge validated findings and treat failure of either pass as a coverage gap.
   - Normalize each pass against the exact batch supplied to the model.
3. **Report context accurately**
   - Derive short task-group reasons.
   - Replace the verbose document inventory with a compact Review context section listing only documents assessed as useful.
   - Preserve meaningful notes for selection fallback and document load/truncation problems.
4. **Guard publication**
   - Re-fetch PR metadata immediately before publishing and abort if the current head SHA differs from the reviewed SHA.
5. **Verify**
   - Add deterministic unit tests for adversarial review guidance, useful-document filtering, compact reporting, batch-scoped paths, and head freshness.
   - Run focused tests, the complete test suite, ./jules-verify.sh, and any other required checks; inspect the full final diff.

## Verification constraints
The coding environment cannot resolve GitHub from its local shell. Repository edits are prepared through GitHub's repository API; CI results and any live Gemini API review remain pending until actually observed.

6. **Repair post-merge runtime regression**
   - Restore valid document-context reporting and review-state serialization in the merged reviewer script.
   - Ensure the adversarial pass executes for every batch and its failures are included in coverage reporting.
   - Add deterministic assertions and verify the script parses under the workflow's Node runtime.

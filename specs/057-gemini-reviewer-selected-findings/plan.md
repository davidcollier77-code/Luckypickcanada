# Plan: Gemini Reviewer Selected Findings

1. **Reviewer Output Formatting (`formatReviewSections`)**:
   - Present the "Fix Selected Issues" checkbox properly.
   - Display `- [ ] Finding \`ID\`: ...` for each finding.
   - Update instructions at the bottom to mention checking boxes and checking "Fix selected findings" (currently it says "Fix selected issues", I need to match the actual logic inside `parseReviewAction`).

2. **Action Parsing (`parseReviewAction`)**:
   - The current code already looks for `- [x] 🛠️ **Fix selected findings**`.
   - It also checks `parseSelectedIds`.
   - Ensure the logic safely handles an empty list of selected findings (if `ids.length === 0`, do nothing safely).

3. **Workflow Logic (`main`)**:
   - If `mode === "fix-selected"`, extract the `targetFinding` array (which holds the IDs).
   - Check if `targetFinding` is empty. If so, post comment: "No findings were selected. No fix suggestions generated."
   - Filter `state.findings` by matching the IDs.
   - Only pass these requested findings to `fixModule.applyAutoFix`.

4. **Testing**:
   - Add a test case for `parseReviewAction` simulating 0, 1, and multiple selections, as well as the empty selection scenario.

5. **Pre Commit Instructions**:
   - Ensure pre-commit instructions are followed.

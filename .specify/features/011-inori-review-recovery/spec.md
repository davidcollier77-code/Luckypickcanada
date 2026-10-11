# Feature Specification: Inori Review Recovery

## 1. Description
Make the Inori pull-request review workflow recover from a single terminal model-response validation failure without hiding real failures or weakening review validation.

## 2. Required Behavior
- The first Inori action attempt remains pinned to the existing immutable commit SHA and retains its current inputs, request budget, permissions, triggers, and response contract.
- A second, independent attempt runs only when the first attempt fails with Inori's explicit reason that no review batch completed successfully and no review was published.
- The workflow summary identifies the effective outcome and preserves initial/recovery reasons for troubleshooting.
- A successful recovery allows the review check to pass.
- Non-retriable initial failures and failed recovery attempts fail the required check; continue-on-error must never mask an unrecovered failure.
- The workflow does not report a failed or absent review as successful and does not weaken model-response validation.

## 3. Scope Boundaries
- Modify only the Inori review workflow and the task records required by repository governance.
- Do not change the external action's pinned SHA, model provider, secret names, review instructions, website code, deployment configuration, or dependencies.
- No secret values may be logged or committed.

## 4. Success Criteria
- The retry condition matches the specific no-valid-batch failure reason.
- The recovery attempt uses the same trusted action SHA and review configuration.
- The final guard keeps the job failed unless the recovery attempt succeeds or the initial attempt was not a failure.
- The summary makes the attempt count/outcome and failure reasons visible.
- The changed workflow is reviewed for valid GitHub Actions expression and YAML structure.
- Repository verification results are reported truthfully; unrun checks are not claimed as passing.
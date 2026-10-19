# Quickstart: Verify the Gemini PR-Agent Review

## Before a live review

1. Confirm repository Actions settings contain a secret named `GEMINI_API_KEY`. Do not print, paste, or include its value in an issue or log.
2. Open this PR and inspect the targeted regression test and current-head CI results.
3. Wait until the corrected workflow is present on `main`; workflow changes in a PR are not proof that the base-branch workflow can run them.

## Live acceptance test after merge

1. On a new same-repository pull request, push a commit or use another supported event: opened, reopened, synchronize, ready_for_review, or review_requested.
2. Open the PR's **Checks** tab and locate **Run PR Agent**.
3. Confirm the credential-preflight step succeeds without printing the credential.
4. Confirm the PR-Agent step succeeds and a Gemini review summary is visible in the PR conversation/review timeline.
5. Confirm the selected and fallback model remain the intended Gemini model; a transient Gemini 503 must not switch the review to an unrelated default OpenAI model.

## Failure diagnosis

- **Credential preflight reports the secret missing or unavailable**: check the secret name and repository Actions availability in GitHub Settings. Do not put the secret in the workflow file.
- **Preflight succeeds but PR-Agent fails**: inspect the redacted action error for provider/model/quota details. A 503 `UNAVAILABLE` means the provider reported temporary service unavailability; retry a new supported PR event later. Verify the Gemini API key is active and has model access in Google AI Studio; never paste the key into logs.
- **No PR-Agent run appears**: inspect the workflow's event trigger, the Actions tab for workflow parse errors, and whether the workflow file has reached the default branch.
- **Review job succeeds but no review appears**: inspect the action's event/configuration logs and confirm the PR-Agent action has review publishing permissions.

## Limits

A passing static test validates repository configuration only. A successful credentialed post-merge workflow run with a visible review is the required live acceptance evidence.

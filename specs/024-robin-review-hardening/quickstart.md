# Quickstart: Verify Robin's bounded review

## Successful path

1. Open or update a small pull request.
2. Check the Robin Code Review job. Confirm preflight succeeds without exposing the key.
3. Confirm the action uses the configured model (default: openrouter/free) and completes or hits its hard two-minute step cap.
4. If Robin posts a review, confirm the final outcome step exits successfully and the review is attached to the current PR head.

## Failure / timeout path

1. On a test PR, use a provider or model expected to fail only if a maintainer is willing to change and restore the repository variable. Do not change or display secrets.
2. Confirm the action failure or cancellation triggers the review guard and that the guard matches the current PR head and timestamp.
3. Confirm the final outcome step rechecks reviews and fails if none was posted.
4. Confirm the action does not wait beyond two minutes and the overall job stays within five minutes after starting.

## Missing-key path

1. Do not print or inspect the key value.
2. If OPENROUTER_API_KEY is unavailable, preflight should stop immediately and point to repository Settings → Secrets and variables → Dependabot or Actions as appropriate.
3. No model request should be attempted.

## Known boundaries

- The free router selects its model dynamically; a successful status does not guarantee findings.
- No separate external fallback-reviewer handoff is configured in this repository. The failed Robin check by itself should not be described as triggering another tool automatically.
- ./jules-verify.sh has not been run locally in this environment; leave that verification open until it is executed.

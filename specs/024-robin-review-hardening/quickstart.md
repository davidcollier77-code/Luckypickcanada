# Quickstart: Verify Robin Review Failover

## Automatic path

1. Open or update a small pull request.
2. Observe the Robin Code Review job after the job starts.
3. Confirm the primary model is the configured primary ID and the step finishes no later than three minutes.
4. Confirm that a successful primary review is posted only once and the fallback step is skipped.
5. Confirm the workflow summary records the outcomes without printing credentials.

## Failure path

1. In a safe test branch, make the primary model unavailable using a temporary invalid model override only if a maintainer is willing to change and then restore the repository variable. Do not change or reveal any key.
2. Confirm the primary step is terminated by its timeout or fails before three minutes.
3. Confirm the duplicate-review guard checks the current PR head and timestamp.
4. Confirm the explicit Qwen free fallback begins only when the guard succeeds and reports that the primary did not post a review.
5. Confirm the whole job finishes within eight minutes, with a green result only if a review was posted.

## Missing-key path

1. Do not print or inspect any secret value.
2. If the key is not available to a Dependabot-triggered run, confirm the job stops in preflight and points to repository Settings → Secrets and variables → Dependabot.
3. Confirm no model action is attempted.

## Verification note

A passing automatic primary run does not by itself prove the timeout/fallback branch works. Keep T008 unchecked until that branch is exercised on a controlled test PR.

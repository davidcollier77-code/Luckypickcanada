# Data Model: Spec Kit Updater Recovery

No new product/domain data entities are introduced.

The workflow continues to use existing GitHub Actions metadata:

- **Workflow run**: run ID, created timestamp, status, and conclusion.
- **Run job/steps**: step names and conclusions used to identify the successful PR-submission marker.
- **Update pull request**: existing create/update operation and PR number outputs.
- **Integration manifest**: the recorded SHA-256 for each integration-managed command file.

No database, environment variable, secret, or API schema changes are required.

# Plan: Fix Cloudflare Deployment 10013 Failure

1.  **Update Spec Kit Artifacts**: Create `spec.md`, `plan.md`, and `tasks.md` in `specs/060-assets-upload-10013-fix`.
2.  **Modify Deployment Workflow**: Edit `.github/workflows/deploy-open-next.yml` to include `code: 10013` in the bounded backoff retry condition.
3.  **Upgrade Wrangler**: Use `sed` to update the `wrangler` version to `4.155.0` in `package.json` and run `pnpm install` to update `pnpm-lock.yaml`.
4.  **Verify Governance**: Run `./jules-verify.sh` to ensure all checks pass.
5.  **Pre-commit & Submit**: Follow pre-commit instructions and create a PR with the appropriate Sentinel prefix.

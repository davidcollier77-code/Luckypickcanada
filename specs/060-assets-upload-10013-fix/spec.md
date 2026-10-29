# Spec: Fix Cloudflare Deployment 10013 Failure

## Objective
Fix the Cloudflare deployment failure ("HTTP 500", error "10013") occurring during the "assets-upload-session" request.

## Requirements
1.  **Identify Root Cause**: The error 10013 is a known issue with Wrangler version 4.148.0 when uploading assets to Cloudflare during deployment.
2.  **Implement Fix**: Upgrade the `wrangler` dependency in `package.json` to version `4.155.0` which resolves this asset upload issue. The previous manual check established `wrangler` is defined in `package.json` devDependencies.
3.  **Update Deployment Retry Guard**: Add error code `10013` to the bounded retry block in `.github/workflows/deploy-open-next.yml` to ensure future occurrences of this specific Cloudflare API error are gracefully handled via bounded retries, just like `10500` and `429`.

## Scope
- Modify `package.json` and `pnpm-lock.yaml` to update `wrangler`.
- Modify `.github/workflows/deploy-open-next.yml` to include `10013` in the bounded retry regex.
- Do not make unrelated changes to application code, visual behavior, database schemas, or logic.

## Success Criteria
- The `wrangler` dependency is upgraded to `4.155.0` via `pnpm`.
- The GitHub Actions deployment workflow handles error `10013` with bounded retries.
- `./jules-verify.sh` passes successfully.

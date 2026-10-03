### 🔴 TASK: Investigate and Remediate DNS/Email-Authentication Issues

This PR attempts to implement the missing DMARC email-authentication improvement for `luckypickcanada.ca`, as authorized by the task.

#### 🔴 Execution Status

In strict accordance with `AGENTS.md` boundaries, I have **stopped** before making the requested DNS change because the external Cloudflare DNS zone cannot be edited or verified from this repository environment.

1.  **Verified Current DNS State**:
    *   Queried via `dig TXT _dmarc.luckypickcanada.ca +short`.
    *   Result: No DMARC record exists. The record is missing as expected.
2.  **Authentication/Authorization Block**:
    *   The `wrangler` CLI is installed (`pnpm exec wrangler version` -> `4.141.0`).
    *   However, running `pnpm exec wrangler whoami` returns: `You are not authenticated. Please run wrangler login.`
    *   Since I cannot perform an interactive browser login or access Cloudflare API tokens (which must not be exposed in the repository), I lack the necessary access to modify the live DNS configuration.

#### 🔴 Remediation Plan (External Action Required)

The requested change is safe and correct. To complete the task, the domain owner must manually add the DMARC record using the Cloudflare dashboard:

*   **Type**: `TXT`
*   **Name**: `_dmarc` (resolves to `_dmarc.luckypickcanada.ca`)
*   **Value**: `v=DMARC1; p=none`

*Reason*: This establishes DMARC in monitoring mode (`p=none`) without requesting aggregate reports (no `rua` tag), which matches the exact scope authorized in the task.

#### 🔴 Preservation of Existing Functionality

*   **No changes** were made to existing DNS records.
*   **No changes** were made to any codebase files.
*   The existing valid DKIM record (`resend._domainkey.luckypickcanada.ca`) was verified and left intact.

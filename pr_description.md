🛡️ Sentinel: [MEDIUM] Fix DMARC and DKIM DNS Authentication

This PR delivers the final investigation report and specific DNS remediation instructions for `luckypickcanada.ca`, focusing strictly on the DMARC and DKIM findings reported by the security scan.

**Severity:** Medium
**Vulnerability:** Missing DMARC authentication configuration and potentially unrecognized DKIM selector.
**Impact:** Domain is vulnerable to spoofing, and emails may be rejected or marked as spam by receiving mail servers, affecting deliverability.

**Fix:**
As authorized by the task scope, this PR investigates and verifies the DNS configuration. The domain's DNS is managed externally (e.g., Cloudflare), so the required remediation must be performed manually by the domain owner.

**DMARC Remediation Plan (External Action Required):**
The DMARC record is missing. The following record MUST be added to the external DNS configuration:
- **Type**: `TXT`
- **Name**: `_dmarc` (resolves to `_dmarc.luckypickcanada.ca`)
- **Value**: `v=DMARC1; p=none`
- *Reason*: Establishes DMARC monitoring mode as recommended, avoiding abrupt mail rejections while satisfying the health check. No `rua` or `ruf` reporting destinations were added because no verified, deliverable addresses were provided.

**DKIM Investigation Findings:**
- A valid DKIM record already exists for Resend at `resend._domainkey.luckypickcanada.ca`.
- The scanner's failure was likely due to looking for a generic selector or not recognizing the Resend-specific selector.
- **No changes are required for DKIM.** The existing record is correct and must be preserved.

**Explicit Scope Boundaries Respected:**
- **SPF:** No changes were made to SPF records (root or `send.luckypickcanada.ca`).
- **MX:** No changes were made to MX records.
- **Other:** No other DNS, Cloudflare, application code, or infrastructure settings were modified.

**Verification:**
- `dig TXT _dmarc.luckypickcanada.ca +short` confirmed no DMARC record exists.
- `dig TXT resend._domainkey.luckypickcanada.ca +short` confirmed the DKIM record exists and contains a valid key.
- `dig TXT send.luckypickcanada.ca +short` confirmed the SES SPF record is present.
- `dig MX luckypickcanada.ca +short` confirmed no root MX record exists.

No application source files were changed.

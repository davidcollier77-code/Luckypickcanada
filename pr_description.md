🛡️ Sentinel: [HIGH] Fix Root SPF and DMARC DNS Authentication

This PR delivers the investigation and remediation instructions for the missing root-domain SPF and DMARC DNS authentication records for `luckypickcanada.ca`.

**Severity:** High
**Vulnerability:** Missing root SPF and DMARC records.
**Impact:** Emails sent from root-domain addresses (e.g., `gifts@luckypickcanada.ca`) lack SPF authorization and DMARC alignment, leaving the domain vulnerable to spoofing and causing legitimate emails to be rejected or marked as spam by receiving mail servers.

**Fix (External Action Required):**
The domain's DNS is managed externally (Cloudflare), and the execution environment lacks the necessary authenticated access to apply DNS changes directly. The following records MUST be manually added to the Cloudflare DNS zone by the domain owner.

**1. Root Domain SPF Record**
- **Type**: `TXT`
- **Name**: `@` (or `luckypickcanada.ca`)
- **Value**: `v=spf1 include:amazonses.com ~all`
- *Reason*: Authorizes Resend (via AWS SES) to send emails on behalf of the root domain. The codebase investigation confirmed that Resend is the exclusive outbound email provider for `@luckypickcanada.ca` addresses. No other providers (like Google) are used for sending.

**2. DMARC Monitoring Record**
- **Type**: `TXT`
- **Name**: `_dmarc` (resolves to `_dmarc.luckypickcanada.ca`)
- **Value**: `v=DMARC1; p=none;`
- *Reason*: Establishes DMARC monitoring mode as recommended, avoiding abrupt mail rejections while satisfying health checks. No `rua` or `ruf` reporting destinations were added because no verified, deliverable addresses were provided.

**Explicit Scope Boundaries Respected:**
- **DKIM:** The existing Resend DKIM record at `resend._domainkey.luckypickcanada.ca` was verified and remains unchanged.
- **Subdomain SPF:** The existing SES SPF record at `send.luckypickcanada.ca` was verified and remains unchanged.
- **Other:** No other DNS, Cloudflare, application code, or infrastructure settings were modified.

**Verification Performed:**
- `dig TXT luckypickcanada.ca +short` confirmed no root SPF record exists.
- `dig TXT _dmarc.luckypickcanada.ca +short` confirmed no DMARC record exists.
- `grep` analysis of the codebase (`app/` and `functions/`) confirmed Resend is the sole outbound email sender.

No application source files were changed.

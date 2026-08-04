const PUBLIC_TURNSTILE_SITE_KEY = '0x4AAAAAAD7JVgYkWZSLX0ib';
const MASKED_SENSITIVE_VALUE = '[SENSITIVE]';

export function getTurnstileSiteKey() {
  const configuredSiteKey = process.env.TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!configuredSiteKey || configuredSiteKey === MASKED_SENSITIVE_VALUE) {
    return PUBLIC_TURNSTILE_SITE_KEY;
  }

  return configuredSiteKey;
}

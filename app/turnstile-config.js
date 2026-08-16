const MASKED_SENSITIVE_VALUE = '[SENSITIVE]';
// Server-side function for API routes

export function getTurnstileSiteKey() {
  const configuredSiteKey = process.env.TURNSTILE_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!configuredSiteKey || configuredSiteKey === MASKED_SENSITIVE_VALUE) {
    return null;
  }

  return configuredSiteKey;
}

// Client-side function for React components
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '[SENSITIVE]' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== '' ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : null;

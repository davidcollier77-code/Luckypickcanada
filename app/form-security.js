const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;
const SCRIPT_PATTERN = /(?:<\s*script|javascript:|data:text\/html|on\w+\s*=)/i;
const URL_PATTERN = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|info|biz|xyz|ru|cn|top|click|site)\b/i;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function sanitizePlainText(value, maxLength) {
  return String(value || '')
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSingleLine(value, maxLength) {
  return sanitizePlainText(value, maxLength)
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function hasHeaderInjection(value) {
  return /[\r\n]/.test(String(value || '')) || /(?:bcc|cc|to|from|subject)\s*:/i.test(String(value || ''));
}

export function isValidEmailAddress(value) {
  const email = sanitizeSingleLine(value, 120).toLowerCase();

  return Boolean(email) && !hasHeaderInjection(value) && EMAIL_PATTERN.test(email);
}

export function validatePlainTextField({ value, label, minLength = 0, maxLength, required = false, allowUrls = false }) {
  const rawValue = String(value || '');
  const cleaned = sanitizePlainText(rawValue, maxLength);

  if (required && !cleaned) {
    return { error: `${label} is required.` };
  }

  if (cleaned && cleaned.length < minLength) {
    return { error: `${label} must be at least ${minLength} characters.` };
  }

  if (SCRIPT_PATTERN.test(rawValue) || HTML_TAG_PATTERN.test(rawValue)) {
    return { error: `${label} cannot include HTML, scripts, or embedded code.` };
  }

  if (!allowUrls && URL_PATTERN.test(rawValue)) {
    return { error: `${label} cannot include links.` };
  }

  return { value: cleaned };
}

export function createSubmissionFingerprint(fields) {
  return fields
    .map((field) => sanitizePlainText(field, 2000).toLowerCase())
    .join('|')
    .replace(/\s+/g, ' ')
    .trim();
}

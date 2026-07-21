import { createSubmissionFingerprint } from './form-security';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const SPAM_BLOCK_THRESHOLD = 3;
const TEMP_BLOCK_MS = 60 * 60 * 1000;
const DUPLICATE_SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

const submissionBuckets = new Map();
const spamAttempts = new Map();
const recentSubmissions = new Map();

function now() {
  return Date.now();
}

function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function pruneExpiredEntries() {
  const currentTime = now();

  for (const [ip, bucket] of submissionBuckets.entries()) {
    if (bucket.resetAt <= currentTime) {
      submissionBuckets.delete(ip);
    }
  }

  for (const [ip, attempt] of spamAttempts.entries()) {
    if (attempt.resetAt <= currentTime && (!attempt.blockedUntil || attempt.blockedUntil <= currentTime)) {
      spamAttempts.delete(ip);
    }
  }

  for (const [fingerprint, expiresAt] of recentSubmissions.entries()) {
    if (expiresAt <= currentTime) {
      recentSubmissions.delete(fingerprint);
    }
  }
}

function logSpamAttempt({ formName, ip, reason }) {
  console.warn('Public form spam protection triggered', {
    formName,
    ip,
    reason,
    at: new Date().toISOString(),
  });
}

function recordSpamAttempt({ formName, ip, reason, forceBlock = false }) {
  const currentTime = now();
  const existing = spamAttempts.get(ip);
  const attempt = existing && existing.resetAt > currentTime
    ? existing
    : { count: 0, resetAt: currentTime + RATE_LIMIT_WINDOW_MS, blockedUntil: 0 };

  attempt.count += 1;

  if (forceBlock || attempt.count >= SPAM_BLOCK_THRESHOLD) {
    attempt.blockedUntil = currentTime + TEMP_BLOCK_MS;
  }

  spamAttempts.set(ip, attempt);
  logSpamAttempt({ formName, ip, reason });
}

function getBlockedMessage(ip) {
  const attempt = spamAttempts.get(ip);

  if (attempt?.blockedUntil && attempt.blockedUntil > now()) {
    return 'Too many submissions were detected. Please try again in about an hour.';
  }

  return null;
}

function checkRateLimit({ formName, ip }) {
  const currentTime = now();
  const existing = submissionBuckets.get(ip);
  const bucket = existing && existing.resetAt > currentTime
    ? existing
    : { count: 0, resetAt: currentTime + RATE_LIMIT_WINDOW_MS };

  bucket.count += 1;
  submissionBuckets.set(ip, bucket);

  if (bucket.count > MAX_SUBMISSIONS_PER_WINDOW) {
    recordSpamAttempt({ formName, ip, reason: 'rate_limit', forceBlock: true });
    return { ok: false, error: 'Too many submissions. Please try again in about an hour.' };
  }

  return { ok: true };
}

function checkDuplicateSubmission({ formName, ip, fields }) {
  if (!fields?.length) {
    return { ok: true };
  }

  const submissionFingerprint = createSubmissionFingerprint(fields);

  if (!submissionFingerprint) {
    return { ok: true };
  }

  const fingerprint = `${formName}:${ip}:${submissionFingerprint}`;

  if (recentSubmissions.has(fingerprint)) {
    recordSpamAttempt({ formName, ip, reason: 'duplicate_submission' });
    return { ok: false, error: 'This looks like a duplicate submission. Please wait a few minutes before trying again.' };
  }

  recentSubmissions.set(fingerprint, now() + DUPLICATE_SUBMISSION_WINDOW_MS);
  return { ok: true };
}

async function verifyTurnstile({ token, ip, formName }) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is missing for public form spam protection', { formName });
    return { ok: false, error: 'This form is temporarily unavailable. Please try again later.' };
  }

  if (!token) {
    recordSpamAttempt({ formName, ip, reason: 'missing_turnstile_token' });
    return { ok: false, error: 'Complete the spam check and try again.' };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: String(token),
        remoteip: ip === 'unknown' ? '' : ip,
      }),
    });

    if (!response.ok) {
      recordSpamAttempt({ formName, ip, reason: 'turnstile_verify_request_failed' });
      return { ok: false, error: 'Unable to verify the spam check. Please try again.' };
    }

    const result = await response.json();

    if (!result.success) {
      recordSpamAttempt({ formName, ip, reason: `turnstile_failed:${(result['error-codes'] || []).join(',')}` });
      return { ok: false, error: 'Spam check failed. Please try again.' };
    }
  } catch (error) {
    console.error('Turnstile verification failed', { formName, ip, error });
    return { ok: false, error: 'Unable to verify the spam check. Please try again.' };
  }

  return { ok: true };
}

export async function validatePublicFormSubmission({ request, formData, formName, duplicateFields = [] }) {
  pruneExpiredEntries();

  const ip = getClientIp(request);
  const blockedMessage = getBlockedMessage(ip);

  if (blockedMessage) {
    logSpamAttempt({ formName, ip, reason: 'temporary_ip_block' });
    return { ok: false, error: blockedMessage };
  }

  if (formData.get('website')) {
    recordSpamAttempt({ formName, ip, reason: 'honeypot' });
    return { ok: false, error: 'Unable to accept this submission.' };
  }

  const rateLimit = checkRateLimit({ formName, ip });

  if (!rateLimit.ok) {
    return rateLimit;
  }

  const turnstile = await verifyTurnstile({
    token: formData.get('cf-turnstile-response'),
    ip,
    formName,
  });

  if (!turnstile.ok) {
    return turnstile;
  }

  return checkDuplicateSubmission({ formName, ip, fields: duplicateFields });
}

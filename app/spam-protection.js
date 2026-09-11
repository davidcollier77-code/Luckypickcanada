import { Redis } from '@upstash/redis';
import { createSubmissionFingerprint } from './form-security';
import { getTurnstileSiteKey } from './turnstile-config';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const SPAM_BLOCK_THRESHOLD = 3;
const TEMP_BLOCK_MS = 60 * 60 * 1000;
const DUPLICATE_SUBMISSION_WINDOW_MS = 10 * 60 * 1000;

let redisClient = null;

function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = Redis.fromEnv();
    return redisClient;
  } catch (error) {
    console.error('Redis initialization failed for rate limiting:', error);
    return null;
  }
}

export function getClientIp(request) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

function logSpamAttempt({ formName, ip, reason }) {
  console.warn('Public form spam protection triggered', {
    formName,
    ip,
    reason,
    at: new Date().toISOString(),
  });
}

async function recordSpamAttempt({ formName, ip, reason, forceBlock = false }) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const attemptsKey = `spam:attempts:${ip}`;
      const windowSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

      const count = await redis.incr(attemptsKey);
      if (count === 1) {
        await redis.expire(attemptsKey, windowSeconds);
      }

      if (forceBlock || count >= SPAM_BLOCK_THRESHOLD) {
        const blockSeconds = Math.ceil(TEMP_BLOCK_MS / 1000);
        await redis.set(`spam:blocked:${ip}`, '1', { ex: blockSeconds });
      }
    } catch (error) {
      console.error('Failed to record spam attempt in Redis:', error);
    }
  }

  logSpamAttempt({ formName, ip, reason });
}

async function getBlockedMessage(ip) {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const blocked = await redis.get(`spam:blocked:${ip}`);
    if (blocked) {
      return 'Too many submissions were detected. Please try again in about an hour.';
    }
  } catch (error) {
    console.error('Failed to check blocked status in Redis:', error);
  }

  return null;
}

async function checkRateLimit({ formName, ip }) {
  const redis = getRedisClient();
  if (!redis) {
    return { ok: true };
  }

  try {
    const key = `spam:form:${formName}:${ip}`;
    const windowSeconds = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (count > MAX_SUBMISSIONS_PER_WINDOW) {
      await recordSpamAttempt({ formName, ip, reason: 'rate_limit', forceBlock: true });
      return { ok: false, error: 'Too many submissions. Please try again in about an hour.' };
    }
  } catch (error) {
    console.error('Failed to check form rate limit in Redis:', error);
  }

  return { ok: true };
}

async function checkDuplicateSubmission({ formName, ip, fields }) {
  if (!fields?.length) {
    return { ok: true };
  }

  const submissionFingerprint = createSubmissionFingerprint(fields);

  if (!submissionFingerprint) {
    return { ok: true };
  }

  const fingerprint = `${formName}:${ip}:${submissionFingerprint}`;
  const redis = getRedisClient();
  if (!redis) {
    return { ok: true };
  }

  try {
    const dedupKey = `spam:dedup:${fingerprint}`;
    const dedupSeconds = Math.ceil(DUPLICATE_SUBMISSION_WINDOW_MS / 1000);

    const exists = await redis.get(dedupKey);
    if (exists) {
      await recordSpamAttempt({ formName, ip, reason: 'duplicate_submission' });
      return { ok: false, error: 'This looks like a duplicate submission. Please wait a few minutes before trying again.' };
    }

    await redis.set(dedupKey, '1', { ex: dedupSeconds });
  } catch (error) {
    console.error('Failed to check duplicate submission in Redis:', error);
  }

  return { ok: true };
}

async function verifyTurnstile({ token, ip, formName }) {
  const siteKey = getTurnstileSiteKey();
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKey) {
    console.error('Turnstile site key is missing for public form spam protection', { formName });
    return { ok: false, error: 'This form is temporarily unavailable. Please try again later.' };
  }

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is missing for public form spam protection', { formName });
    return { ok: false, error: 'This form is temporarily unavailable. Please try again later.' };
  }

  if (!token) {
    await recordSpamAttempt({ formName, ip, reason: 'missing_turnstile_token' });
    return { ok: false, error: 'Complete the spam check and try again.' };
  }

  try {
    const payload = {
      secret: secretKey,
      response: String(token)
    };
    if (ip && ip !== 'unknown') {
      payload.remoteip = ip;
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await recordSpamAttempt({ formName, ip, reason: 'turnstile_verify_request_failed' });
      return { ok: false, error: 'Unable to verify the spam check. Please try again.' };
    }

    const result = await response.json();

    if (!result.success) {
      await recordSpamAttempt({ formName, ip, reason: `turnstile_failed:${(result['error-codes'] || []).join(',')}` });
      return { ok: false, error: 'Spam check failed. Please try again.' };
    }
  } catch (error) {
    console.error('Turnstile verification failed', { formName, ip, error });
    return { ok: false, error: 'Unable to verify the spam check. Please try again.' };
  }

  return { ok: true };
}

export async function validatePublicFormSubmission({ request, formData, formName, duplicateFields = [] }) {
  const ip = getClientIp(request);
  const blockedMessage = await getBlockedMessage(ip);

  if (blockedMessage) {
    logSpamAttempt({ formName, ip, reason: 'temporary_ip_block' });
    return { ok: false, error: blockedMessage };
  }

  if (formData.get('website')) {
    await recordSpamAttempt({ formName, ip, reason: 'honeypot' });
    return { ok: false, error: 'Unable to accept this submission.' };
  }

  const rateLimit = await checkRateLimit({ formName, ip });

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

export async function checkApiRateLimit(ip, action = 'global', limit = 10, windowMs = 60000) {
  const redis = getRedisClient();

  if (!redis) {
    console.error('API rate limiting is unavailable: Redis is not configured', { action, ip });
    return { ok: true };
  }

  const key = `ratelimit:${action}:${ip}`;
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return { ok: count <= limit };
  } catch (error) {
    console.error('API rate limit check failed:', { action, ip, error });
    return { ok: true };
  }
}

// NOTE: The edge runtime is explicitly avoided in this route to allow OpenNext bundling to compile correctly.
import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Redis } from '@upstash/redis';
import { createOracleUsageManager, ORACLE_DAILY_LIMIT } from '../../lib/oracle-usage';
import { checkApiRateLimit, getClientIp } from '../../spam-protection';

const ALLOWED_ORIGINS = [
  'https://luckypickcanada.ca',
  'https://www.luckypickcanada.ca',
  'http://localhost:3000',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
}

const FALLBACK_FORTUNES = [
  "The Northern Lights whisper that today brings unexpected luck and double-doubles.",
  "The mists reveal smooth travels and good company ahead, like a warm cabin after a snowy trek.",
  "A loon calls in the distance—your patience is about to pay off in delightful ways.",
  "The spirit of the maple leaf suggests a sweet surprise is just around the corner.",
  "Expect a polite encounter today that will open up a surprising new path for you."
];

function getRandomFallback() {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return FALLBACK_FORTUNES[randomBuffer[0] % FALLBACK_FORTUNES.length];
}

let oracleUsageManager;

function getUsageManager() {
  if (oracleUsageManager) return oracleUsageManager;

  let env = {};
  try {
    env = getCloudflareContext()?.env || {};
  } catch {
    // Local development can run without a Cloudflare request context.
  }

  const redisUrl = env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
  oracleUsageManager = createOracleUsageManager({ redis, kv: env.LUCKYPICK_KV || null });
  return oracleUsageManager;
}

function getApiKey() {
  let apiKey = process.env.GROQ_API_KEY;
  try {
    const ctx = getCloudflareContext();
    if (ctx?.env?.GROQ_API_KEY) apiKey = ctx.env.GROQ_API_KEY;
  } catch {
    // Running outside Cloudflare; keep the process environment fallback.
  }
  return apiKey;
}

function fallbackPayload(quota) {
  const fortune = getRandomFallback();
  return { prediction: fortune, fortune, reading: fortune, source: 'fallback', quota };
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request) {
  const headers = getCorsHeaders(request);
  const clientIp = getClientIp(request) || 'anonymous';
  try {
    const quota = await getUsageManager().getStatus(clientIp);
    return NextResponse.json({ quota }, { status: 200, headers });
  } catch (error) {
    console.error('Oracle quota status unavailable:', error);
    return NextResponse.json(
      { error: 'Your daily question allowance is temporarily unavailable. Please try again shortly.' },
      { status: 503, headers }
    );
  }
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = getClientIp(request) || 'anonymous';
  let usageManager = null;
  let reservation = null;

  try {
    const rateLimit = await checkApiRateLimit(clientIp, 'oracle', 10, 60000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before consulting the oracle again.' },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => null);
    const rawQuestion = body?.message || body?.prompt || body?.question;
    let question = '';

    if (rawQuestion) {
      if (typeof rawQuestion !== 'string') {
        return NextResponse.json({ error: 'Invalid question format.' }, { status: 400, headers: corsHeaders });
      }

      question = rawQuestion
        .replace(/["'\\]/g, '')
        .replaceAll(String.fromCharCode(96), '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/[<>]/g, '')
        .trim();

      if (question.length > 120) {
        return NextResponse.json(
          { error: 'Question is too long. Please keep it under 120 characters.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const lowercased = question.toLowerCase();
      const injectionPatterns = ['ignore previous', 'ignore all', 'disregard', 'system:', 'assistant:', 'prompt:', 'instructions:'];
      if (injectionPatterns.some((pattern) => lowercased.includes(pattern))) {
        return NextResponse.json({ error: 'Invalid question format' }, { status: 400, headers: corsHeaders });
      }
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Oracle Error: GROQ_API_KEY environment variable is missing.');
      let quota = null;
      try { quota = await getUsageManager().getStatus(clientIp); } catch { /* fallback response remains available */ }
      return NextResponse.json(fallbackPayload(quota), { status: 200, headers: corsHeaders });
    }

    usageManager = getUsageManager();
    let reserved;
    try {
      reserved = await usageManager.reserve(clientIp);
    } catch (error) {
      console.error('Oracle daily quota reservation failed:', error);
      return NextResponse.json(
        { error: 'Your daily question allowance is temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: corsHeaders }
      );
    }

    if (!reserved.ok) {
      return NextResponse.json(
        { error: 'You’ve used all ' + ORACLE_DAILY_LIMIT + ' Crystal Ball questions for today. Come back after the daily reset.', quota: reserved.quota },
        { status: 429, headers: corsHeaders }
      );
    }
    reservation = reserved.reservation;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let groqResponse;

    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: 'You are the Lucky Pick Oracle for luckypickcanada.ca, a digital entertainment project strictly for fun with no affiliation with gambling or real lottery prizes. If the user asks a factual, practical, or direct question, answer it directly, accurately, and helpfully. If the user asks a playful, fortune-telling, or whimsical question, respond in character as a lighthearted, witty Canadian-themed oracle keeping things fun, positive, and under 3 sentences.',
            },
            { role: 'user', content: question || 'Give me a daily lucky prediction.' },
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Oracle Error:', fetchError);
      await usageManager.release(reservation);
      reservation = null;
      const quota = await usageManager.getStatus(clientIp);
      return NextResponse.json(fallbackPayload(quota), { status: 200, headers: corsHeaders });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Oracle Error:', groqResponse.status, errorText);
      await usageManager.release(reservation);
      reservation = null;
      const quota = await usageManager.getStatus(clientIp);
      return NextResponse.json(fallbackPayload(quota), { status: 200, headers: corsHeaders });
    }

    const data = await groqResponse.json();
    const reading = data.choices?.[0]?.message?.content?.trim();

    if (!reading) {
      console.error('Oracle Error: Missing content in Groq API response');
      await usageManager.release(reservation);
      reservation = null;
      const quota = await usageManager.getStatus(clientIp);
      return NextResponse.json(fallbackPayload(quota), { status: 200, headers: corsHeaders });
    }

    let quota = reserved.quota;
    try {
      await usageManager.commit(reservation);
      reservation = null;
      quota = await usageManager.getStatus(clientIp);
    } catch (error) {
      // The pending reservation still holds this slot, so a successful AI answer
      // remains accounted for even if promotion from pending to used fails.
      console.error('Oracle daily quota commit failed; keeping the reservation held:', error);
      reservation = null;
    }

    return NextResponse.json(
      { prediction: reading, fortune: reading, reading, source: 'ai', quota },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Oracle Route Exception:', error);
    if (reservation && usageManager) {
      try { await usageManager.release(reservation); } catch (releaseError) {
        console.error('Oracle quota release failed after route exception:', releaseError);
      }
    }
    return NextResponse.json(fallbackPayload(null), { status: 200, headers: corsHeaders });
  }
}

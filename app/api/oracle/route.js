// NOTE: The edge runtime is explicitly avoided in this route to allow OpenNext bundling to compile correctly.
import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkApiRateLimit, getClientIp } from '../../spam-protection';

const ALLOWED_ORIGINS = [
  'https://luckypickcanada.ca',
  'https://www.luckypickcanada.ca',
  'http://localhost:3000',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
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

function fallbackPayload() {
  const fortune = getRandomFallback();
  return { prediction: fortune, fortune, reading: fortune, source: 'fallback' };
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

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = getClientIp(request) || 'anonymous';

  try {
    // Keep the short-window abuse limit, independent of the visitor-side daily counter.
    const rateLimit = await checkApiRateLimit(clientIp, 'oracle', 10, 60000);
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before consulting the oracle again.' },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid question format.' }, { status: 400, headers: corsHeaders });
    }

    const rawQuestion = body.message ?? body.prompt ?? body.question;
    if (typeof rawQuestion !== 'string') {
      return NextResponse.json({ error: 'Please enter a question for the Crystal Ball.' }, { status: 400, headers: corsHeaders });
    }

    const question = rawQuestion
      .replace(/["'\\]/g, '')
      .replaceAll(String.fromCharCode(96), '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[<>]/g, '')
      .trim();

    if (!question) {
      return NextResponse.json({ error: 'Please enter a question for the Crystal Ball.' }, { status: 400, headers: corsHeaders });
    }

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

    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Oracle Error: GROQ_API_KEY environment variable is missing.');
      return NextResponse.json(fallbackPayload(), { status: 200, headers: corsHeaders });
    }

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
            { role: 'user', content: question },
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      console.error('Oracle Error:', fetchError);
      return NextResponse.json(fallbackPayload(), { status: 200, headers: corsHeaders });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Oracle Error:', groqResponse.status, errorText);
      return NextResponse.json(fallbackPayload(), { status: 200, headers: corsHeaders });
    }

    const data = await groqResponse.json();
    const reading = data.choices?.[0]?.message?.content?.trim();

    if (!reading) {
      console.error('Oracle Error: Missing content in Groq API response');
      return NextResponse.json(fallbackPayload(), { status: 200, headers: corsHeaders });
    }

    return NextResponse.json(
      { prediction: reading, fortune: reading, reading, source: 'ai' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Oracle Route Exception:', error);
    return NextResponse.json(fallbackPayload(), { status: 200, headers: corsHeaders });
  }
}

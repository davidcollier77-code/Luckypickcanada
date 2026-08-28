// NOTE: The edge runtime is explicitly avoided in this route to allow OpenNext bundling to compile correctly.
import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

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
  };
}

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);
  return true;
}

const FALLBACK_FORTUNES = [
  "The Northern Lights whisper that today brings unexpected luck and double-doubles.",
  "The mists reveal smooth travels and good company ahead, like a warm cabin after a snowy trek.",
  "A loon calls in the distance—your patience is about to pay off in delightful ways.",
  "The spirit of the maple leaf suggests a sweet surprise is just around the corner.",
  "Expect a polite encounter today that will open up a surprising new path for you."
];

function getRandomFallback() {
  const index = Math.floor(Math.random() * FALLBACK_FORTUNES.length);
  return FALLBACK_FORTUNES[index];
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const clientIp = request.headers.get('cf-connecting-ip') || 'anonymous';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before consulting the oracle again.' },
        { status: 429, headers: corsHeaders }
      );
    }

    let apiKey = process.env.GROQ_API_KEY;
    try {
      const ctx = getCloudflareContext();
      if (ctx && ctx.env && ctx.env.GROQ_API_KEY) {
        apiKey = ctx.env.GROQ_API_KEY;
      }
    } catch (e) {
      // console.warn("Could not get Cloudflare context for GROQ_API_KEY", e.message);
    }

    const body = await request.json().catch(() => null);
    const rawQuestion = body?.question?.trim();

    let question = '';
    if (rawQuestion) {
      question = rawQuestion
        .replace(/["'`\\]/g, '')
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
      const injectionPatterns = [
        'ignore previous',
        'ignore all',
        'disregard',
        'system:',
        'assistant:',
        'prompt:',
        'instructions:',
      ];
      for (const pattern of injectionPatterns) {
        if (lowercased.includes(pattern)) {
          return NextResponse.json(
            { error: 'Invalid question format' },
            { status: 400, headers: corsHeaders }
          );
        }
      }
    }

    if (!apiKey) {
      console.error('Oracle Error: GROQ_API_KEY environment variable is missing.');
      return NextResponse.json(
        { reading: getRandomFallback(), source: 'fallback' },
        { status: 200, headers: corsHeaders }
      );
    }

    const systemPrompt =
      'You are the mystical Canadian Oracle of LuckyPickCanada.ca. Provide brief, engaging, fun, and warm Canadian-themed fortunes (2-4 sentences max). Be playful and positive. Mention things like the Northern Lights, maple syrup, double-doubles, polite encounters, or winter coziness. Strictly act as a digital entertainment project just for fun. Do not provide any gambling advice, and ensure there is absolutely no affiliation with real gambling or real lottery prizes. Only provide fortunes for entertainment.';

    const userMessage = question
      ? `The seeker asks: ${question}`
      : 'The seeker has approached quietly. Please provide a general mystical Canadian fortune.';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let groqResponse;
    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      console.error('Oracle Error:', fetchErr);
      return NextResponse.json(
        { reading: getRandomFallback(), source: 'fallback' },
        { status: 200, headers: corsHeaders }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Oracle Error:', groqResponse.status, errorText);
      return NextResponse.json(
        { reading: getRandomFallback(), source: 'fallback' },
        { status: 200, headers: corsHeaders }
      );
    }

    const data = await groqResponse.json();
    const reading = data.choices?.[0]?.message?.content?.trim();

    if (!reading) {
      console.error('Oracle Error: Missing content in Groq API response', data);
      return NextResponse.json(
        { reading: getRandomFallback(), source: 'fallback' },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { reading, source: 'ai' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Oracle Route Exception:', error);
    return NextResponse.json(
      { reading: getRandomFallback(), source: 'fallback' },
      { status: 200, headers: corsHeaders }
    );
  }
}

// Trigger fresh Cloudflare deployment for GROQ_API_KEY

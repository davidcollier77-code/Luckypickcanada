import { NextResponse } from 'next/server';



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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY environment variable is missing.');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => null);
    const rawQuestion = body?.question?.trim();

    if (!rawQuestion) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const question = rawQuestion
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

    const systemPrompt =
      'You are the mystical Canadian Oracle of LuckyPickCanada.ca. Provide brief, engaging, fun, and warm Canadian-themed fortunes (2-4 sentences max). Be playful and positive.';

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
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504, headers: corsHeaders }
        );
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', groqResponse.status, errorText);
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await groqResponse.json();
    const fortune =
      data.choices?.[0]?.message?.content?.trim() ||
      'The spirits are quiet... try again soon.';

    return NextResponse.json(
      { fortune },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Oracle Route Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

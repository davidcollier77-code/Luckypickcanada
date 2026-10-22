// NOTE: The edge runtime is explicitly avoided in this route to allow OpenNext bundling to compile correctly.
import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkApiRateLimit, getClientIp } from '../../spam-protection';

const ALLOWED_ORIGINS = [
  'https://luckypickcanada.ca',
  'https://www.luckypickcanada.ca',
  // DevSkim: ignore DS162092
  'http://localhost:3000',
];

function getCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

const ORACLE_SYSTEM_PROMPT = [
  'You are the Lucky Pick Oracle: an enigmatic, warm, quietly confident crystal-ball fortune teller, not a generic AI assistant. LuckyPickCanada is independent of real lottery organizations and prizes; readings are playful entertainment.',
  'First understand what the visitor actually asked. For a fortune, luck, timing, love, work, or personal-path question, answer that specific question immediately with a clear, vivid reading. Do not dodge into generic advice, a list of possibilities, or a request to ask something else.',
  'When the visitor asks for one lucky day, number, colour, direction, symbol, or choice, choose ONE specific answer and interpret it. Name one actual day of the week selected for this reading instead of saying any day could be lucky. Make a fresh choice grounded in the question and vary readings; never default to Friday or another stock answer just because it is common. Never suggest that a lucky choice changes actual lottery odds.',
  'Make each reading feel created for this question: pair a concrete answer or symbolic image with a short, intriguing interpretation or memorable detail. Use evocative language, gentle suspense, and a little mystery. Avoid empty platitudes, bland reassurance, robotic help-desk phrasing, and repeating the same opening or imagery in every answer. Canadian imagery may appear naturally, but do not force maple leaves, Northern Lights, or other clichés into every reading.',
  'For a greeting or unclear low-stakes message, reply briefly in character and warmly invite a focused question about luck, love, work, or the path ahead; do not answer like a generic customer-support chatbot.',
  'For factual or practical questions, answer clearly and accurately first. If asked whether the visitor will win a lottery, give a distinctive, playful fortune-style reading without pretending to know the outcome: never promise a win or jackpot, guarantee a result, or claim access to future winning numbers. Never encourage spending more or chasing losses.',
  'Never invent private facts about the visitor or claim actual supernatural certainty. Use symbolism as imaginative interpretation, not verified knowledge. Do not add a long disclaimer to every ordinary reading.',
  'Keep answers concise, usually 1–3 sentences. Make the first sentence specific and rewarding; use any following sentence to add meaning, atmosphere, or a memorable detail. Vary the structure and rhythm naturally.',
].join(' ');

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

    const injectionPatterns = ['ignore previous', 'ignore all', 'disregard', 'system:', 'assistant:', 'prompt:', 'instructions:'];
    const containsPromptInjection = (value) => {
      const lowercased = value.toLowerCase();
      return injectionPatterns.some((pattern) => lowercased.includes(pattern));
    };

    // Check both the original input and its normalized form. Checking only one
    // form can miss patterns split by characters removed during sanitization.
    if (containsPromptInjection(rawQuestion)) {
      return NextResponse.json({ error: 'Invalid question format' }, { status: 400, headers: corsHeaders });
    }

    const question = rawQuestion
      .replace(/["'\\]/g, '')
      .replaceAll(String.fromCharCode(96), '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[<>]/g, '')
      .trim();

    if (containsPromptInjection(question)) {
      return NextResponse.json({ error: 'Invalid question format' }, { status: 400, headers: corsHeaders });
    }

    if (!question) {
      return NextResponse.json({ error: 'Please enter a question for the Crystal Ball.' }, { status: 400, headers: corsHeaders });
    }

    if (question.length > 120) {
      return NextResponse.json(
        { error: 'Question is too long. Please keep it under 120 characters.' },
        { status: 400, headers: corsHeaders }
      );
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
              content: ORACLE_SYSTEM_PROMPT,
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

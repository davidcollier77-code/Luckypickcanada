// NOTE: The edge runtime is explicitly avoided in this route to allow OpenNext bundling to compile correctly.
import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkApiRateLimit, getClientIp } from '../../spam-protection';
import {
  describeCalendar,
  getCalendarContext,
  getToneInstruction,
  parseCalendarDate,
  getServerDateKey,
} from '../../lib/crystal-ball-calendar';
import {
  addTimeGreeting,
  getFallbackFollowUp,
  getFallbackFortune,
} from '../../lib/crystal-ball-fortunes';
import { getTimeOfDayFromLocalTime, parseLocalTime } from '../../lib/local-time';

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

const PLAYFUL_IDENTITY =
  'You are the Lucky Pick Canada Crystal Ball: funny, clever, mysterious, warm, occasionally cheeky, uplifting and unmistakably Canadian — not a generic AI assistant.';

const SOLEMN_IDENTITY =
  'You are the Lucky Pick Canada Crystal Ball: thoughtful, reflective, sincere, warm and unmistakably Canadian — not a generic AI assistant.';

const SAFETY_RULES = [
  'This is entertainment only.',
  'Never claim supernatural powers or certainty, never invent private facts, never promise a lottery win or jackpot, never claim to know winning numbers, and never encourage spending more or chasing losses.',
  'No political commentary, no cruel, insulting or offensive humour, and no jokes about tragedies, disasters or serious commemorative occasions.',
].join(' ');

const VARIETY_RULES = [
  'Vary the style, length, opening and punchline across readings: rotate between funny, magical, mysterious, encouraging, thoughtful, adventurous, seasonal and festive.',
  'Avoid repetitive wording, recycled fortune-cookie lines, empty platitudes, robotic help-desk phrasing and the same opening every time.',
  'Do not reuse a phrase just because it worked before; each reading should feel newly written for this visitor and this day.',
].join(' ');

const HUMOUR_RULES = [
  'Humour is a regular feature, not an occasional garnish: use Canadian expressions, relatable everyday situations, gentle sarcasm and an occasional unexpected punchline.',
  'Keep it kind, inclusive and never mean-spirited, and never force a joke into every sentence.',
  'Aim for clever and surprising over cute; a genuinely funny fortune should feel like a small gift, not a greeting card.',
].join(' ');

const CALENDAR_RULES = [
  'Use the supplied calendar facts exactly. Never invent or recalculate a weekday, date, season, holiday, news event or current information.',
  'If a promising day or upcoming occasion is mentioned, use only the supplied weekday and occasion information and keep it accurate.',
  'Never invent news, current events, statistics, prices or information beyond the supplied calendar facts; if no reliable current information is supplied, do not pretend to have it.',
  'Follow the occasion focus and its stated intensity exactly, and let the tone return naturally to everyday life when the occasion has passed.',
].join(' ');

const FORTUNE_SHAPE = [
  'Write today’s fortune without asking the visitor a question.',
  'Most fortunes should be two to four well-written sentences: begin with something specific and rewarding, then add meaning, atmosphere or a memorable Canadian detail.',
  'Occasionally write one crisp sentence, and occasionally a slightly longer story; vary the rhythm instead of following one template.',
  'Recognize the current Canadian season and any supplied occasion naturally when it fits; do not force a holiday into an unrelated fortune.',
].join(' ');

const TIME_RULES = [
  'Use the supplied visitor local time and greeting label only to set the atmosphere (morning, afternoon, evening or late night); never state or invent a different time.',
  'Occasionally open with a natural time-appropriate greeting such as “Good morning”, “Good afternoon”, “Good evening” or a late-night nod when the tone allows it.',
].join(' ');

const FOLLOW_UP_RULES = [
  'The visitor has already received a daily fortune and may ask exactly one follow-up question related to it.',
  'First understand what the visitor actually asked, then answer that specific question immediately with a clear, vivid reading.',
  'Do not dodge into generic advice, a list of possibilities, or a request to ask something else.',
  'When the visitor asks for one lucky day, number, colour, direction, symbol or choice, choose ONE specific answer and interpret it.',
  'Name one actual day of the week selected for this reading instead of saying any day could be lucky.',
  'Make a fresh choice grounded in the question and vary readings; never default to Friday or another stock answer just because it is common.',
  'Never suggest that a lucky choice changes actual lottery odds.',
  'Connect the answer to the supplied original fortune, but do not repeat the whole fortune.',
  'Keep it concise, usually 1–3 sentences. Make the first sentence specific and rewarding; use any following sentence to add meaning, atmosphere or a memorable detail.',
  'For factual or practical questions, answer clearly and accurately first.',
  'If asked whether the visitor will win a lottery, give a distinctive, playful fortune-style reading without pretending to know the outcome: never promise a win or jackpot, guarantee a result, or claim access to future winning numbers.',
].join(' ');

function isSolemn(context) {
  return context?.tone === 'respectful' || context?.tone === 'thoughtful';
}

/**
 * Build the system prompt for the current date and occasion. Solemn days use a
 * quieter identity and deliberately omit every humour instruction.
 */
function buildSystemPrompt(context, mode) {
  const solemn = isSolemn(context);
  const parts = [
    solemn ? SOLEMN_IDENTITY : PLAYFUL_IDENTITY,
    SAFETY_RULES,
    VARIETY_RULES,
    CALENDAR_RULES,
    getToneInstruction(context),
  ];

  if (!solemn) parts.push(HUMOUR_RULES);
  parts.push(mode === 'follow-up' ? FOLLOW_UP_RULES : FORTUNE_SHAPE);
  if (mode === 'fortune') parts.push(TIME_RULES);

  return parts.join(' ');
}

function getFallbackPayload(context, mode) {
  const reading =
    mode === 'follow-up'
      ? getFallbackFollowUp(context)
      : addTimeGreeting(getFallbackFortune(context), context);

  return { prediction: reading, fortune: reading, reading, source: 'fallback' };
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

const INJECTION_PATTERNS = [
  'ignore previous',
  'ignore all',
  'disregard',
  'system:',
  'assistant:',
  'prompt:',
  'instructions:',
];

function containsPromptInjection(value) {
  const lowercased = value.toLowerCase();
  return INJECTION_PATTERNS.some((pattern) => lowercased.includes(pattern));
}

function sanitizeText(value) {
  return value
    .replace(/["'\\]/g, '')
    .replaceAll(String.fromCharCode(96), '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[<>]/g, '')
    .trim();
}

function sanitizeTimeZone(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, 64);
  return /^[A-Za-z0-9_+\-/]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Accept only a 24-hour wall-clock time sent by the visitor's browser. The
 * calendar facts (date, weekday, season, holidays) always come from the
 * already-validated local date, so a malformed or spoofed time can only change
 * the reading's atmosphere, never a factual calendar claim.
 */
function sanitizeLocalTime(value) {
  const parsed = parseLocalTime(value);
  if (!parsed) return null;
  return `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}`;
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function POST(request) {
  const corsHeaders = getCorsHeaders(request);
  const clientIp = getClientIp(request) || 'anonymous';
  let requestMode = 'fortune';
  let calendarContext = null;

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

    if (body.mode !== undefined && body.mode !== 'fortune' && body.mode !== 'follow-up') {
      return NextResponse.json({ error: 'Invalid request mode.' }, { status: 400, headers: corsHeaders });
    }

    const rawQuestion = body.message ?? body.prompt ?? body.question;
    // Requests without a mode keep the old question-only behaviour; the Crystal
    // Ball client explicitly sends `fortune` for the daily reading.
    const mode = body.mode || (rawQuestion !== undefined ? 'follow-up' : 'fortune');
    requestMode = mode;

    let question = '';
    if (mode === 'follow-up') {
      if (typeof rawQuestion !== 'string') {
        return NextResponse.json({ error: 'Please enter a question for the Crystal Ball.' }, { status: 400, headers: corsHeaders });
      }

      // Check both the original input and its normalized form. Checking only one
      // form can miss patterns split by characters removed during sanitization.
      if (containsPromptInjection(rawQuestion)) {
        return NextResponse.json({ error: 'Invalid question format' }, { status: 400, headers: corsHeaders });
      }

      question = sanitizeText(rawQuestion);

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
    }

    let fortuneContext = null;
    if (mode === 'follow-up' && body.fortune !== undefined) {
      if (typeof body.fortune !== 'string' || containsPromptInjection(body.fortune)) {
        return NextResponse.json({ error: 'Invalid fortune context.' }, { status: 400, headers: corsHeaders });
      }
      fortuneContext = sanitizeText(body.fortune).slice(0, 1500);
      if (!fortuneContext || containsPromptInjection(fortuneContext)) {
        return NextResponse.json({ error: 'Invalid fortune context.' }, { status: 400, headers: corsHeaders });
      }
    }

    const localDate =
      parseCalendarDate(body.localDate) || parseCalendarDate(getServerDateKey());
    const context = getCalendarContext(localDate.key);
    const timeZone = sanitizeTimeZone(body.timeZone);
    const localTime = sanitizeLocalTime(body.localTime);
    context.timeOfDay = getTimeOfDayFromLocalTime(localTime);
    calendarContext = context;
    const calendarFacts = describeCalendar(context, timeZone, localTime);

    const userContent =
      mode === 'fortune'
        ? `${calendarFacts}\n\nGenerate today’s Canadian Crystal Ball fortune now.`
        : fortuneContext
          ? `${calendarFacts}\n\nThe visitor’s daily fortune: "${fortuneContext}"\n\nTheir one follow-up question: "${question}"`
          : question;

    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Oracle Error: GROQ_API_KEY environment variable is missing.');
      return NextResponse.json(getFallbackPayload(context, mode), { status: 200, headers: corsHeaders });
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
            { role: 'system', content: buildSystemPrompt(context, mode) },
            { role: 'user', content: userContent },
          ],
          temperature: mode === 'fortune' ? 0.9 : 0.7,
          // gpt-oss-20b is a reasoning model: its internal reasoning shares the
          // completion budget. The old `max_tokens: 250` budget could be spent
          // entirely on reasoning, which returns HTTP 200 with an empty
          // `message.content` and produced the Cloudflare "Missing content in
          // Groq API response" issue. Use the supported `max_completion_tokens`
          // field, keep effort low for short readings and leave headroom for
          // reasoning plus the visible fortune.
          max_completion_tokens: 1024,
          reasoning_effort: 'low',
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      console.error('Oracle Error:', fetchError);
      return NextResponse.json(getFallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Oracle Error:', groqResponse.status, errorText);
      return NextResponse.json(getFallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;
    const reading = typeof content === 'string' ? content.trim() : '';

    if (!reading) {
      // Record why the content was empty so a recurrence can be diagnosed from
      // the log issue itself. Never include the prompt, reading or credentials.
      console.error(
        'Oracle Error: Missing content in Groq API response',
        JSON.stringify({
          mode,
          finishReason: data.choices?.[0]?.finish_reason ?? null,
          completionTokens: data.usage?.completion_tokens ?? null,
          reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens ?? null,
        }),
      );
      return NextResponse.json(getFallbackPayload(context, mode), { status: 200, headers: corsHeaders });
    }

    return NextResponse.json(
      { prediction: reading, fortune: reading, reading, source: 'ai' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Oracle Route Exception:', error);
    return NextResponse.json(getFallbackPayload(calendarContext, requestMode), { status: 200, headers: corsHeaders });
  }
}

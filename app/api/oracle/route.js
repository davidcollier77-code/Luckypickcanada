import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  "https://luckypickcanada.ca",
  "https://www.luckypickcanada.ca",
  "http://localhost:3000",
  "http://localhost:8788",
];

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : "https://luckypickcanada.ca";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}



// Sanitize user input to prevent prompt injection
function sanitizeInput(input) {
  const cleaned = input
    .replace(/["'`\\]/g, '')
    .replace(/[\r\n]/g, ' ')
    .replace(/[<>]/g, '')
    .trim();

  const lowercased = cleaned.toLowerCase();
  const injectionPatterns = [ 'ignore previous', 'ignore all', 'disregard', 'system:', 'assistant:', 'prompt:', 'instructions:' ];
  for (const pattern of injectionPatterns) {
    if (lowercased.includes(pattern)) {
      return 'What does my future hold?';
    }
  }
  return cleaned;
}



const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const rateLimitMap = new Map();

function getClientIp(request) {
  // Prefer cf-connecting-ip as it is trustworthy when running behind Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  // Fallback if not on CF, though CF is used in production
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip) {
  const currentTime = Date.now();

  const existing = rateLimitMap.get(ip);
  const bucket = existing && existing.resetAt > currentTime
    ? existing
    : { count: 0, resetAt: currentTime + RATE_LIMIT_WINDOW_MS };

  if (bucket.count < MAX_SUBMISSIONS_PER_WINDOW) {
     bucket.count += 1;
  } else {
     bucket.count = MAX_SUBMISSIONS_PER_WINDOW + 1;
  }
  rateLimitMap.set(ip, bucket);

  // Garbage collect expired entries
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt <= currentTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  return bucket.count <= MAX_SUBMISSIONS_PER_WINDOW;
}

export async function POST(request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait before asking again." }, {
      status: 429,
      headers: getCorsHeaders(request)
    });
  }


  const corsHeaders = getCorsHeaders(request);
  try {
    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Configuration error: Missing API key" }, {
        status: 500,
        headers: {
          ...corsHeaders
        }
      });
    }

    // Parse JSON body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, {
        status: 400,
        headers: {
          ...corsHeaders
        }
      });
    }

    const question = body.question;

    // Validation
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ error: "Please ask a question." }, {
        status: 400,
        headers: {
          ...corsHeaders
        }
      });
    }

    if (question.length > 120) {
      return NextResponse.json({ error: "Question is too long. Please keep it under 120 characters." }, {
        status: 400,
        headers: {
          ...corsHeaders
        }
      });
    }

    // Sanitize question before embedding in prompt
    const sanitizedQuestion = sanitizeInput(question);

    // Gemini API Request
    const currentDateTime = new Date().toLocaleString("en-CA", { timeZone: "America/Halifax" });

    const apiBody = {
      systemInstruction: {
        parts: [{
          text: `You are the Mystic Crystal Ball of LuckyPickCanada. The current real-world date and time is ${currentDateTime}. You are fully aware of the current date, time, and day of the week, and should seamlessly weave this temporal knowledge into your answers when asked.

    You are a Mystic Canadian Oracle. Your tone is atmospheric, warm, encouraging, and mysterious. Do not use clichés like "Greetings traveler", "Ahoy", or overly formal fantasy prose (no pirate or renaissance fair jargon). Do NOT explicitly mention "three-tier digital cards", "percentage gauge", or "the luck meter" in the readings unless the user directly asks about them.
    Keep fortunes concise (2 to 4 impactful, poetic sentences max). Focus on intuition, optimism, possibility, and Canadian wilderness/aurora themes. Keep all responses punchy, grounded, and uplifting. Ground the advice in general good fortune, focus, and positive energy for digital entertainment.`
        }]
      },
      contents: [{
        parts: [{ text: sanitizedQuestion }]
      }],
      generationConfig: {
        temperature: 0.7,
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let geminiResponse;
    try {
      geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(apiBody),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: "The mists took too long to answer. Try again." }, {
          status: 504,
          headers: {
            ...corsHeaders
          }
        });
      }
      throw error;
    }

    clearTimeout(timeoutId);

    if (geminiResponse.status === 429) {
      return NextResponse.json({ error: "The mists are tired! Please wait a moment before asking again." }, {
        status: 429,
        headers: {
          ...corsHeaders
        }
      });
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      // Log only non-sensitive information
      console.error('Gemini API Error:', geminiResponse.status, errorText);
      return NextResponse.json({ error: "The oracle is temporarily unavailable." }, {
        status: 502,
        headers: {
          ...corsHeaders
        }
      });
    }

    const data = await geminiResponse.json();

    let fortune = "The mists are silent today.";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
      fortune = data.candidates[0].content.parts[0].text.trim();
    }

    return NextResponse.json({ fortune }, {
      headers: {
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Unhandled Oracle Error:', error);
    return NextResponse.json({ error: "An unexpected disturbance occurred in the ethereal realm." }, {
      headers: {
      status: 500,
        ...corsHeaders
      }
    });
  }
}

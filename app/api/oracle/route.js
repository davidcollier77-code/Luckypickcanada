export const runtime = 'edge';
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


const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 10;
const rateLimitMap = new Map();

function getClientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'anonymous';
}

function checkRateLimit(ip) {
  const currentTime = Date.now();

  // Clean up old entries to prevent memory leak
  if (rateLimitMap.size > 1000 || Math.random() < 0.1) {
    for (const [key, bucket] of rateLimitMap.entries()) {
      if (bucket.resetAt <= currentTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  const existing = rateLimitMap.get(ip);
  const bucket = existing && existing.resetAt > currentTime
    ? existing
    : { count: 0, resetAt: currentTime + RATE_LIMIT_WINDOW_MS };

  // Fix race condition by incrementing and setting before the check
  bucket.count += 1;
  rateLimitMap.set(ip, bucket);
  
  return bucket.count <= MAX_SUBMISSIONS_PER_WINDOW;
}

export async function POST(request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "The mists are tired! Please wait a moment before asking again." }, {
      status: 429,
      headers: getCorsHeaders(request)
    });
  }

  const corsHeaders = getCorsHeaders(request);
  try {
    // Check API Key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('Missing GROQ_API_KEY environment variable');
      return NextResponse.json({ error: 'Internal server error' }, {
        status: 500,
        headers: { ...corsHeaders }
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
      return NextResponse.json({ error: 'Question is required' }, {
        status: 400,
        headers: { ...corsHeaders }
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

    // Groq API Request

    const systemPrompt = `You are the Mystic Canadian Oracle for Lucky Pick Canada. Users will ask you all kinds of questions—from love, career, and lottery hopes to completely random, everyday inquiries.

Your core guidelines:
1. THE CANADIAN LUCKY PIVOT: No matter what question the user asks (even if it's completely unrelated), playfully spin your answer into an uplifting fortune. Weave in Canadian imagery and luck metaphors (the dancing Northern Lights, maple sweetness, lucky loonies, crisp boreal breezes, or cozy campfires).
2. TONE & VIBE: Warm, whimsical, encouraging, and mystical. Never sarcastic or robotic.
3. ENTERTAINMENT ONLY: If asked about lottery jackpots or gambling odds, keep it light and grounded in fun—remind them that real magic is in the daily journey and unexpected smiles. Never guarantee financial outcomes or provide gambling advice.
4. BREVITY: Keep all fortunes strictly between 2 to 3 concise, punchy sentences so they display cleanly and instantly on mobile screens.
5. CLEAN OUTPUT: Return only the raw fortune text with no conversational prefixes (e.g., no 'Here is your fortune:'), quotes, or markdown code fences.`;

    const apiBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizedQuestion }
      ],
      temperature: 0.7,
      max_tokens: 150
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let groqResponse;
    try {
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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

    if (groqResponse.status === 429) {
      return NextResponse.json({ error: "The mists are tired! Please wait a moment before asking again." }, {
        status: 429,
        headers: {
          ...corsHeaders
        }
      });
    }

    if (!groqResponse.ok) {
      let errorData = await groqResponse.text();
      try {
        errorData = JSON.parse(errorData);
      } catch (e) {
        // keep as text if parsing fails
      }
      console.error('Groq API Error:', groqResponse.status, errorData);
      return NextResponse.json({ error: 'Service temporarily unavailable' }, {
        status: 502,
        headers: { ...corsHeaders }
      });
    }

    const data = await groqResponse.json();

    let fortune = "The mists are silent today.";
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      fortune = data.choices[0].message.content.trim();
    }

    return NextResponse.json({ fortune }, {
      headers: {
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Oracle Route Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, {
      status: 500,
      headers: { ...corsHeaders }
    });
  }
}

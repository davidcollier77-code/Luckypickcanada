import { NextResponse } from 'next/server';

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

export async function POST(request) {
  try {
    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Configuration error: Missing API key" }, {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
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
          "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
        }
      });
    }

    const question = body.question;

    // Validation
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ error: "Please ask a question." }, {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
        }
      });
    }

    if (question.length > 120) {
      return NextResponse.json({ error: "Question is too long. Please keep it under 120 characters." }, {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
        }
      });
    }

    // Sanitize question before embedding in prompt
    const sanitizedQuestion = sanitizeInput(question);

    // Gemini API Request
    const prompt = `You are a mystical, upbeat, and friendly oracle crystal ball.
The user asks: "${sanitizedQuestion}".
Reply with a 1 to 2 sentence mystical, positive, and friendly fortune or reading.`;

    const apiBody = {
      contents: [{
        parts: [{ text: prompt }]
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
            "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
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
          "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
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
          "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
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
        "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
      }
    });

  } catch (error) {
    console.error('Unhandled Oracle Error:', error);
    return NextResponse.json({ error: "An unexpected disturbance occurred in the ethereal realm." }, {
      headers: {
      status: 500,
        "Access-Control-Allow-Origin": "https://luckypickcanada.ca",
      }
    });
  }
}

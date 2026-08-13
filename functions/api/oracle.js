export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Check API Key
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Configuration error: Missing API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Parse JSON body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const question = body.question;

    // Validation
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return new Response(JSON.stringify({ error: "Please ask a question." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (question.length > 120) {
      return new Response(JSON.stringify({ error: "Question is too long. Please keep it under 120 characters." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Gemini API Request
    const prompt = `You are a mystical, upbeat, and friendly oracle crystal ball.
The user asks: "${question}".
Reply with a 1 to 2 sentence mystical, positive, and friendly fortune or reading.`;

    const apiBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let geminiResponse;
    try {
      geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return new Response(JSON.stringify({ error: "The mists took too long to answer. Try again." }), {
          status: 504,
          headers: { "Content-Type": "application/json" }
        });
      }
      throw error;
    }

    clearTimeout(timeoutId);

    if (geminiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "The mists are tired! Please wait a moment before asking again." }), {
        status: 429,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API Error:', geminiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "The oracle is temporarily unavailable." }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await geminiResponse.json();

    let fortune = "The mists are silent today.";
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
      fortune = data.candidates[0].content.parts[0].text.trim();
    }

    return new Response(JSON.stringify({ fortune }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Unhandled Oracle Error:', error);
    return new Response(JSON.stringify({ error: "An unexpected disturbance occurred in the ethereal realm." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

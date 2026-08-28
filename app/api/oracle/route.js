import { NextResponse } from 'next/server';

export const runtime = 'edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY environment variable is missing.');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await request.json().catch(() => null);
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const systemPrompt = 'You are the mystical Canadian Oracle of LuckyPickCanada.ca. Provide brief, engaging, fun, and warm Canadian-themed fortunes (2-4 sentences max). Be playful and positive.';

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', groqResponse.status, errorText);
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await groqResponse.json();
    const fortune = data.choices?.[0]?.message?.content?.trim() || 'The spirits are quiet... try again soon.';

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

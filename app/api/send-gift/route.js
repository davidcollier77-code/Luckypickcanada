import { sendGiftEmail, createGiftReveal } from '../../gift-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  // Add backend console logging to check if the email provider API key exists in process.env
  const resendApiKey = process.env.RESEND_API_KEY;
  console.log('[send-gift] Checking if email provider API key (RESEND_API_KEY) exists in process.env:', !!resendApiKey);

  const fromEmail = process.env.GIFT_FROM_EMAIL || 'noreply@luckypickcanada.ca';
  console.log('[send-gift] Using fromEmail:', fromEmail);

  try {
    const body = await request.json().catch(() => ({}));
    console.log('[send-gift] Received request body:', body);

    const recipientName = cleanText(body.recipientName, 80);
    const recipientEmail = cleanText(body.recipientEmail, 120).toLowerCase();
    const senderName = cleanText(body.senderName, 80);
    const personalMessage = cleanText(body.personalMessage || body.giftMessage, 500);
    const pickType = body.pickType || body.luckyPickGame || '6';

    if (!recipientName || !isValidEmail(recipientEmail)) {
      console.error('[send-gift] Validation failed: missing recipientName or invalid recipientEmail');
      return Response.json({ error: 'Validation failed: recipient name and a valid email are required.' }, { status: 400 });
    }

    if (!resendApiKey) {
      console.error('[send-gift] Error: RESEND_API_KEY is not defined in process.env.');
      return Response.json({ error: 'RESEND_API_KEY is not configured on the server.' }, { status: 500 });
    }

    const metadata = {
      checkoutType: 'gift_package',
      luckyPickGame: pickType === '7' ? '7' : '6',
      recipientName,
      recipientEmail,
      senderName,
      giftMessage: personalMessage,
    };

    const reveal = createGiftReveal(metadata);
    const emailResult = await sendGiftEmail({ metadata, resendApiKey, fromEmail, reveal });

    if (!emailResult.ok) {
      console.error('[send-gift] Email sending failed:', emailResult.details);
      return Response.json({ error: `Email sending failed: ${emailResult.details}` }, { status: 502 });
    }

    console.log('[send-gift] Email successfully sent to:', recipientEmail);
    return Response.json({
      ok: true,
      recipientEmail,
      reveal,
    });
  } catch (error) {
    console.error('[send-gift] Unexpected error occurred during send-gift execution:', error);
    return Response.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred.' }, { status: 500 });
  }
}

import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { escapeHtml, isValidEmailAddress } from '../../form-security';

// Force dynamic rendering to prevent build-time evaluation
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

export async function POST(req: Request) {
  try {
    // Ensure fromEmail has a robust fallback
    const fromEmail = process.env.GIFT_FROM_EMAIL?.trim() || 'gifts@luckypickcanada.ca';

    const { recipientEmail, personalMessage, revealId } = await req.json();

    if (
      !recipientEmail ||
      typeof recipientEmail !== 'string' ||
      !isValidEmailAddress(recipientEmail) ||
      !revealId ||
      typeof revealId !== 'string' ||
      revealId.length === 0 ||
      revealId.length > 100 ||
      (personalMessage !== undefined && personalMessage !== null && typeof personalMessage !== 'string')
      (personalMessage !== undefined && personalMessage !== null && personalMessage.length > 500)
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const safePersonalMessage = escapeHtml(
      personalMessage !== undefined && personalMessage !== null && personalMessage !== ''
        ? personalMessage
        : 'Enjoy your lucky jewel pick!'
    );

    // Build the unique link to your dedicated web page
    const revealUrl = `https://luckypickcanada.ca/reveal/${encodeURIComponent(revealId)}`;

    const data = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: "✨ Someone sent you a Lucky Pick Canada reveal!",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Received a Lucky Pick Canada Reveal!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 24px 10px 24px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">💎</div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                You've Received a Jewel Reveal!
              </h1>
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Someone sent you a special gem-tier pick from Lucky Pick Canada.
              </p>
            </td>
          </tr>

          <!-- Custom Message Box -->
          <tr>
            <td style="padding: 16px 24px;">
              <div style="background-color: #1f2937; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; color: #f3f4f6; font-size: 14px; line-height: 1.5; font-style: italic;">
                "${safePersonalMessage}"
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 20px 24px 32px 24px; text-align: center;">
              <p style="color: #d1d5db; font-size: 15px; margin-bottom: 24px;">
                Tap below to uncover your gems with the live slow reveal:
              </p>

              <a href="${revealUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 15px 36px; border-radius: 50px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                💎 Uncover My Jewels
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #030712; text-align: center; border-top: 1px solid #1f2937;">
              <p style="color: #4b5563; font-size: 12px; margin: 0;">
                Lucky Pick Canada — Picks are for fun and entertainment only.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to send gift email:', error);
    return NextResponse.json({ error: 'Failed to send gift email' }, { status: 500 });
  }
}

import postgres from 'postgres';

const DEFAULT_SUGGESTIONS_TO_EMAIL = 'davidcollier77@gmail.com';

let sql;

function getSql() {
  if (!process.env.POSTGRES_URL) {
    return null;
  }

  if (!sql) {
    sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  }

  return sql;
}

function cleanText(value, maxLength) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function validateSuggestion({ name, email, message }) {
  const cleanName = cleanText(name, 40);
  const cleanEmail = cleanText(email, 120).toLowerCase();
  const cleanMessage = cleanText(message, 1000);

  if (!cleanMessage || cleanMessage.length < 10) {
    return { error: 'Enter a suggestion with at least 10 characters.' };
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: 'Enter a valid email address or leave it blank.' };
  }

  return {
    name: cleanName || null,
    email: cleanEmail || null,
    message: cleanMessage,
  };
}

async function ensureSuggestionsTable(database) {
  await database`
    create table if not exists suggestions (
      id bigserial primary key,
      display_name text,
      email text,
      message text not null,
      created_at timestamptz not null default now()
    )
  `;
}

async function saveSuggestion(database, suggestion) {
  if (!database) {
    return { ok: false, skipped: true };
  }

  await ensureSuggestionsTable(database);
  await database`
    insert into suggestions (display_name, email, message)
    values (${suggestion.name}, ${suggestion.email}, ${suggestion.message})
  `;

  return { ok: true };
}

function buildSuggestionEmail({ name, email, message }) {
  const displayName = name || 'Anonymous visitor';
  const replyTo = email || 'Not provided';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#102033;">
      <h1 style="margin:0 0 16px;color:#0f766e;">New Lucky Pick Canada suggestion</h1>
      <p><strong>Name:</strong> ${escapeHtml(displayName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(replyTo)}</p>
      <div style="margin-top:18px;padding:16px;border-radius:14px;background:#f0fdfa;border:1px solid #99f6e4;">
        ${escapeHtml(message).replaceAll('\n', '<br />')}
      </div>
    </div>
  `;
}

async function emailSuggestion(suggestion) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SUGGESTIONS_FROM_EMAIL || process.env.GIFT_FROM_EMAIL;
  const toEmail = process.env.SUGGESTIONS_TO_EMAIL || DEFAULT_SUGGESTIONS_TO_EMAIL;

  if (!resendApiKey || !fromEmail || !toEmail) {
    return { ok: false, skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      reply_to: suggestion.email || undefined,
      subject: 'New Lucky Pick Canada suggestion',
      html: buildSuggestionEmail(suggestion),
      text: [
        'New Lucky Pick Canada suggestion',
        `Name: ${suggestion.name || 'Anonymous visitor'}`,
        `Email: ${suggestion.email || 'Not provided'}`,
        '',
        suggestion.message,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'Resend email request failed');
  }

  return { ok: true };
}

export async function createSuggestion({ name, email, message, website }) {
  if (website) {
    return { ok: true };
  }

  const validated = validateSuggestion({ name, email, message });

  if (validated.error) {
    return validated;
  }

  const results = await Promise.allSettled([
    saveSuggestion(getSql(), validated),
    emailSuggestion(validated),
  ]);

  const [saveResult, emailResult] = results;
  const saved = saveResult.status === 'fulfilled' && saveResult.value.ok;
  const emailed = emailResult.status === 'fulfilled' && emailResult.value.ok;

  if (saveResult.status === 'rejected') {
    console.error('Suggestion box save failed', saveResult.reason);
  }

  if (emailResult.status === 'rejected') {
    console.error('Suggestion box email failed', emailResult.reason);
  }

  if (!saved && !emailed) {
    return { error: 'The suggestion box needs either POSTGRES_URL or Resend email settings before it can receive suggestions.' };
  }

  return { ok: true };
}

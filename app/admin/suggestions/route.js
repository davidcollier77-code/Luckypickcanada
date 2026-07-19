import { listSuggestions } from '../../suggestions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isAuthorized(request) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return false;
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = new Map(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=');
        return separatorIndex === -1
          ? [part, '']
          : [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
      })
  );

  return cookies.get('suggestions_admin') === adminPassword;
}

function renderLogin(error = '') {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lucky Pick Canada Suggestions</title>
  </head>
  <body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#0f172a;color:#102033;">
    <main style="min-height:100vh;display:grid;place-items:center;padding:1.5rem;">
      <form method="POST" style="width:min(100%,420px);padding:1.5rem;border-radius:22px;background:white;box-shadow:0 24px 60px rgba(0,0,0,.25);display:grid;gap:1rem;">
        <img src="/logo-maple-clover-20260719.svg" alt="Lucky Pick Canada logo" width="72" height="72" style="border-radius:18px;box-shadow:0 10px 26px rgba(0,0,0,.18);" />
        <h1 style="margin:0;color:#0f766e;">Suggestion admin</h1>
        <p style="margin:0;line-height:1.5;">Enter the admin password to view visitor suggestions.</p>
        ${error ? `<p style="margin:0;padding:.75rem 1rem;border-radius:12px;background:#fee2e2;color:#991b1b;font-weight:700;">${escapeHtml(error)}</p>` : ''}
        <label style="display:grid;gap:.4rem;font-weight:700;">
          Admin password
          <input name="password" type="password" required style="padding:.8rem 1rem;border-radius:12px;border:1px solid #b7d9d5;font-size:1rem;" />
        </label>
        <button type="submit" style="padding:.9rem 1.2rem;border:0;border-radius:999px;background:#0f766e;color:white;font-weight:800;font-size:1rem;cursor:pointer;">View suggestions</button>
      </form>
    </main>
  </body>
</html>`;
}

function renderSuggestions({ isConfigured, suggestions }) {
  const rows = suggestions.length
    ? suggestions.map((suggestion) => `
        <article style="padding:1rem;border:1px solid #cbd5e1;border-radius:16px;background:#f8fafc;">
          <p style="margin:0 0 .75rem;white-space:pre-wrap;line-height:1.55;">${escapeHtml(suggestion.message)}</p>
          <p style="margin:0;color:#334155;font-size:.95rem;">
            <strong>${escapeHtml(suggestion.display_name || 'Anonymous visitor')}</strong>
            ${suggestion.email ? ` · <a href="mailto:${escapeHtml(suggestion.email)}">${escapeHtml(suggestion.email)}</a>` : ''}
            · ${escapeHtml(new Date(suggestion.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }))}
          </p>
        </article>`).join('')
    : '<p>No suggestions have been saved yet.</p>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lucky Pick Canada Suggestions</title>
  </head>
  <body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#0f172a;color:#102033;">
    <main style="max-width:900px;margin:0 auto;padding:2rem 1.5rem;">
      <section style="padding:1.5rem;border-radius:24px;background:white;box-shadow:0 24px 60px rgba(0,0,0,.25);">
        <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
          <img src="/logo-maple-clover-20260719.svg" alt="Lucky Pick Canada logo" width="72" height="72" style="border-radius:18px;box-shadow:0 10px 26px rgba(0,0,0,.18);" />
          <div>
            <p style="margin:0;text-transform:uppercase;letter-spacing:2px;color:#0f766e;font-weight:800;">Lucky Pick Canada</p>
            <h1 style="margin:.25rem 0 0;">Visitor suggestions</h1>
          </div>
        </div>
        ${isConfigured ? '' : '<p style="padding:.8rem 1rem;border-radius:14px;background:#fef3c7;color:#92400e;font-weight:700;">Database settings are missing, so suggestions cannot be listed.</p>'}
        <div style="display:grid;gap:1rem;margin-top:1.5rem;">${rows}</div>
      </section>
    </main>
  </body>
</html>`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return new Response(renderLogin(), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const result = await listSuggestions(100);

  return new Response(renderSuggestions(result), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(request) {
  const formData = await request.formData();
  const password = String(formData.get('password') || '');
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return new Response(renderLogin('Incorrect admin password.'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/admin/suggestions',
      'Set-Cookie': `suggestions_admin=${encodeURIComponent(adminPassword)}; HttpOnly; Secure; SameSite=Lax; Path=/admin/suggestions; Max-Age=86400`,
    },
  });
}

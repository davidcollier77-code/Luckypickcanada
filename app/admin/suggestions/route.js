import crypto from 'crypto';
import { listSuggestions } from '../../suggestions';
import { getClientIp, checkApiRateLimit } from '../../spam-protection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

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

  const providedCookie = cookies.get('suggestions_admin');
  if (!providedCookie) {
    return false;
  }

  const parts = providedCookie.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [expiresAtStr, hmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedHmac = crypto.createHmac('sha256', adminPassword).update(expiresAtStr).digest('hex');
  return secureCompare(hmac, expectedHmac);
}

function renderLogin(error = '', success = '') {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lucky Pick Canada Suggestions</title>
  </head>
  <body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#0f172a;color:#102033;">
    <div style="min-height:100vh;display:grid;place-items:center;padding:1.5rem;">
      <form method="POST" style="width:min(100%,420px);padding:1.5rem;border-radius:22px;background:white;box-shadow:0 24px 60px rgba(0,0,0,.25);display:grid;gap:1rem;">
        <img src="/apple-touch-icon.png" alt="LuckyPickCanada logo with maple leaf" width="72" height="72" style="border-radius:18px;box-shadow:0 10px 26px rgba(0,0,0,.18);" />
        <h1 style="margin:0;color:#0f766e;">Suggestion admin</h1>
        <p style="margin:0;line-height:1.5;">Enter the admin email to view visitor suggestions.</p>
        ${error ? `<p style="margin:0;padding:.75rem 1rem;border-radius:12px;background:#fee2e2;color:#991b1b;font-weight:700;">${escapeHtml(error)}</p>` : ''}
        ${success ? `<p style="margin:0;padding:.75rem 1rem;border-radius:12px;background:#d1fae5;color:#065f46;font-weight:700;">${escapeHtml(success)}</p>` : ''}
        <label style="display:grid;gap:.4rem;font-weight:700;">
          Admin email
          <input name="email" type="email" required style="padding:.8rem 1rem;border-radius:12px;border:1px solid #b7d9d5;font-size:1rem;" />
        </label>
        <button type="submit" style="padding:.9rem 1.2rem;border:0;border-radius:999px;background:#0f766e;color:white;font-weight:800;font-size:1rem;cursor:pointer;">Send login link</button>
      </form>
      </div>
    <script>
      (() => {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const token = fragment.get('auth');
        if (!token) return;
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        fetch('/admin/suggestions', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken: token })
        }).then((response) => {
          if (response.ok) {
            window.location.replace('/admin/suggestions');
            return;
          }
          document.querySelector('form')?.insertAdjacentHTML('beforebegin',
            '<p role="alert" style="padding:.75rem 1rem;border-radius:12px;background:#fee2e2;color:#991b1b;font-weight:700;">Login link is invalid, expired, or unavailable. Please request a new link.</p>');
        }).catch(() => {
          document.querySelector('form')?.insertAdjacentHTML('beforebegin',
            '<p role="alert" style="padding:.75rem 1rem;border-radius:12px;background:#fee2e2;color:#991b1b;font-weight:700;">Unable to complete login. Please request a new link.</p>');
        });
      })();
    </script>
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
    <div style="max-width:900px;margin:0 auto;padding:2rem 1.5rem;">
      <section style="padding:1.5rem;border-radius:24px;background:white;box-shadow:0 24px 60px rgba(0,0,0,.25);">
        <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
          <img src="/apple-touch-icon.png" alt="LuckyPickCanada logo with maple leaf" width="72" height="72" style="border-radius:18px;box-shadow:0 10px 26px rgba(0,0,0,.18);" />
          <div>
            <p style="margin:0;text-transform:uppercase;letter-spacing:2px;color:#0f766e;font-weight:800;">Lucky Pick Canada</p>
            <h1 style="margin:.25rem 0 0;">Visitor suggestions</h1>
          </div>
        </div>
        ${isConfigured ? '' : '<p style="padding:.8rem 1rem;border-radius:14px;background:#fef3c7;color:#92400e;font-weight:700;">Database settings are missing, so suggestions cannot be listed.</p>'}
        <div style="display:grid;gap:1rem;margin-top:1.5rem;">${rows}</div>
      </section>
    </div>
  </body>
</html>`;
}

function getAdminConfig() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SUGGESTIONS_TO_EMAIL || '').trim().toLowerCase();
  const resendApiKey = process.env.RESEND_API_KEY;
  return { adminPassword, adminEmail, resendApiKey };
}

function isValidMagicToken(token, adminPassword) {
  if (!adminPassword || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiresAtStr, hmac] = parts;
  if (!/^\d+$/.test(expiresAtStr) || !/^[a-f0-9]{64}$/i.test(hmac)) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isSafeInteger(expiresAt) || Date.now() > expiresAt) return false;
  const expectedHmac = crypto.createHmac('sha256', adminPassword).update(expiresAtStr).digest('hex');
  return secureCompare(hmac, expectedHmac);
}

async function sendMagicLink(email, token, requestUrl) {
  const { resendApiKey } = getAdminConfig();
  const fromEmail = process.env.SUGGESTIONS_FROM_EMAIL || process.env.GIFT_FROM_EMAIL || 'noreply@luckypickcanada.ca';
  if (!resendApiKey) return false;

  const loginUrl = new URL('/admin/suggestions', requestUrl).toString() + '#auth=' + encodeURIComponent(token);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + resendApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: 'Lucky Pick Canada Admin Login',
        html: '<p>Click the link below to securely log into the suggestions admin area:</p>' +
          '<p><a href="' + loginUrl + '" style="padding:.8rem 1.2rem;background:#0f766e;color:white;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Log in to Admin</a></p>' +
          '<p>This link will expire in 15 minutes.</p>'
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch (error) {
    console.error('Admin magic-link delivery failed.');
    return false;
  }
}

function secureResponseHeaders(extra = {}) {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  };
}

export async function GET(request) {
  const { adminPassword, adminEmail, resendApiKey } = getAdminConfig();
  if (!adminPassword || !adminEmail) {
    return new Response(renderLogin('Admin login is temporarily unavailable because authentication is not fully configured.'), {
      status: 503,
      headers: secureResponseHeaders(),
    });
  }

  if (!isAuthorized(request)) {
    return new Response(renderLogin(), {
      status: 401,
      headers: secureResponseHeaders(),
    });
  }

  try {
    const result = await listSuggestions(100);
    return new Response(renderSuggestions(result), {
      headers: secureResponseHeaders(),
    });
  } catch (error) {
    console.error('Admin suggestions page failed.');
    return new Response(renderSuggestions({ isConfigured: false, suggestions: [] }), {
      status: 500,
      headers: secureResponseHeaders(),
    });
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rateLimit = await checkApiRateLimit(ip, 'admin_login', 5, 15 * 60 * 1000);
  if (!rateLimit.ok) {
    return new Response(renderLogin('Too many attempts. Please try again later.'), {
      status: 429,
      headers: secureResponseHeaders(),
    });
  }

  const { adminPassword, adminEmail, resendApiKey } = getAdminConfig();
  if (!adminPassword || !adminEmail) {
    return new Response(renderLogin('Admin login is temporarily unavailable because authentication is not fully configured.'), {
      status: 503,
      headers: secureResponseHeaders(),
    });
  }

  if ((request.headers.get('content-type') || '').includes('application/json')) {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response('Invalid login request.', {
        status: 400,
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      });
    }

    if (!isValidMagicToken(body?.authToken, adminPassword)) {
      return new Response('Invalid or expired login link.', {
        status: 401,
        headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
      });
    }

    const sessionExpiresAt = Date.now() + 86400000;
    const sessionHmac = crypto.createHmac('sha256', adminPassword).update(String(sessionExpiresAt)).digest('hex');
    const sessionToken = String(sessionExpiresAt) + '.' + sessionHmac;
    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': 'suggestions_admin=' + sessionToken + '; HttpOnly; Secure; SameSite=Lax; Path=/admin/suggestions; Max-Age=86400',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  }

  if (!resendApiKey) {
    return new Response(renderLogin('Admin login is temporarily unavailable because email delivery is not configured.'), {
      status: 503,
      headers: secureResponseHeaders(),
    });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    return new Response(renderLogin('Please enter the admin email address.'), {
      status: 400,
      headers: secureResponseHeaders(),
    });
  }
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const isEmailMatch = secureCompare(
    crypto.createHash('sha256').update(email).digest('hex'),
    crypto.createHash('sha256').update(adminEmail).digest('hex')
  );

  if (isEmailMatch) {
    const expiresAt = Date.now() + 15 * 60000;
    const hmac = crypto.createHmac('sha256', adminPassword).update(String(expiresAt)).digest('hex');
    const sent = await sendMagicLink(adminEmail, String(expiresAt) + '.' + hmac, request.url);
    if (!sent) {
      // Keep the response indistinguishable from an unknown email to avoid account enumeration.
      console.error('Admin magic-link delivery was unavailable.');
    }
  }

  return new Response(renderLogin('', 'If the email matches our records and delivery is available, a login link will be sent.'), {
    status: 200,
    headers: secureResponseHeaders(),
  });
}

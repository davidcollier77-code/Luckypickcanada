import Stripe from 'stripe';
import { GIFT_PROCESSING_MARKER, deliverGiftEmailForSession, isGiftDelivered } from '../../gift-email';

export const runtime = 'nodejs';

// Bounded wait for the worker that currently holds the gift lock. The holder only performs a
// single provider API call, so a handful of short polls covers the common case while staying
// far below any serverless execution timeout.
const DELIVERY_POLL_ATTEMPTS = 6;
const DELIVERY_POLL_DELAY_MS = 700;
const PENDING_PAGE_POLL_ATTEMPTS = 8;

// Query flag the reveal page requires before it will show the dispatch confirmation.
const DELIVERED_PARAM = 'giftDelivered';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redirectHome(request, params) {
  const url = new URL('/', request.url);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return Response.redirect(url, 303);
}

// Success redirect. Only ever built once delivery is confirmed, and it always carries the
// explicit `giftDelivered` flag so the reveal page cannot infer success from a hand-crafted
// `recipientEmail` query parameter.
function redirectToReveal(request, session, metadata) {
  const url = new URL(`/reveal/${session.id}`, request.url);
  const recipientEmail = metadata?.recipientEmail || '';

  url.searchParams.set(DELIVERED_PARAM, '1');

  if (recipientEmail) {
    url.searchParams.set('recipientEmail', recipientEmail);
  }

  return Response.redirect(url, 303);
}

async function findCheckoutSession(stripe, paymentId) {
  if (!paymentId) {
    return null;
  }

  if (paymentId.startsWith('cs_')) {
    return stripe.checkout.sessions.retrieve(paymentId);
  }

  if (!paymentId.startsWith('pi_')) {
    return null;
  }

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentId,
    limit: 1,
  });

  return sessions.data[0] || null;
}

function isPollRequest(request) {
  return new URL(request.url).searchParams.get('poll') === '1';
}

// Re-read the Stripe session a bounded number of times, returning as soon as the lock holder
// durably records the dispatch. The total wait is capped so the request can never run long
// enough to hit a serverless execution timeout.
async function waitForConfirmedDelivery(stripe, sessionId, attempts = DELIVERY_POLL_ATTEMPTS) {
  const totalAttempts = Math.min(Math.max(attempts, 0), DELIVERY_POLL_ATTEMPTS);
  const deadline = Date.now() + totalAttempts * DELIVERY_POLL_DELAY_MS;
  let latestSession = null;

  for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
    if (attempt > 0) {
      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        break;
      }

      await wait(Math.min(DELIVERY_POLL_DELAY_MS, remaining));
    }

    try {
      const refreshedSession = await stripe.checkout.sessions.retrieve(sessionId);
      latestSession = refreshedSession;

      if (isGiftDelivered(refreshedSession.metadata)) {
        return refreshedSession;
      }
    } catch (error) {
      console.error('Failed to re-read gift session while waiting for delivery', error);
    }
  }

  return latestSession;
}

// Non-success waiting screen. It deliberately renders no pick content and no recipient
// address: it only re-polls this same endpoint, which re-verifies the payment server-side and
// only ever responds with a 303 to the reveal page once delivery is confirmed.
function pendingResponse(request, attemptsLeft) {
  const pollUrl = new URL(request.url);
  pollUrl.searchParams.set('poll', '1');

  // `request.url` is derived from the incoming Host header, so escape before it lands in an
  // attribute value.
  const homeUrl = new URL('/', request.url).toString()
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const statusText = 'Your gift email is still being dispatched. This page checks automatically — keep this tab open for a moment.';
  const giveUpText = 'We could not confirm the gift email yet. Your payment was successful and your gift is on its way; you can safely close this tab.';

  const script = `
(function () {
  var attemptsLeft = ${attemptsLeft};
  var status = document.getElementById('gift-pending-status');
  var timer = null;

  function giveUp() {
    if (!status) return;
    status.textContent = ${JSON.stringify(giveUpText)};
    var actions = document.getElementById('gift-pending-actions');
    if (actions) actions.hidden = false;
  }

  function schedule() {
    if (attemptsLeft <= 0) {
      giveUp();
      return;
    }
    attemptsLeft -= 1;
    timer = window.setTimeout(function () {
      window.fetch(${JSON.stringify(pollUrl.toString())}, { cache: 'no-store', redirect: 'follow' })
        .then(function (response) {
          if (response.redirected && response.url) {
            window.location.replace(response.url);
            return;
          }
          if (attemptsLeft <= 0) {
            giveUp();
            return;
          }
          schedule();
        })
        .catch(function () {
          if (attemptsLeft <= 0) {
            giveUp();
            return;
          }
          schedule();
        });
    }, 2000);
  }

  schedule();

  window.addEventListener('pagehide', function () {
    if (timer) window.clearTimeout(timer);
  });
})();
`;

  const html = `<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Finishing your Lucky Pick Canada gift</title>
<style>
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    background: #061826;
    color: #f8fafc;
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
  }
  main { max-width: 34rem; }
  .badge {
    display: inline-block;
    padding: 0.35rem 1rem;
    border-radius: 999px;
    background: rgba(153, 246, 228, 0.16);
    border: 1px solid rgba(153, 246, 228, 0.34);
    color: #99f6e4;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.8rem;
  }
  h1 { font-size: clamp(1.6rem, 4vw, 2.3rem); line-height: 1.15; margin: 1.1rem 0 0.9rem; }
  p { font-size: 1.05rem; line-height: 1.6; color: #d1fae5; margin: 0 0 1.1rem; }
  .spinner {
    width: 2.75rem;
    height: 2.75rem;
    margin: 0 auto 0.5rem;
    border-radius: 50%;
    border: 4px solid rgba(153, 246, 228, 0.25);
    border-top-color: #5eead4;
  }
  a.button {
    display: inline-block;
    padding: 0.7rem 1.5rem;
    border-radius: 999px;
    background: #5eead4;
    color: #04202a;
    font-weight: 700;
    text-decoration: none;
    border: 0;
    cursor: pointer;
    font-size: 1rem;
  }
  a.button:focus-visible {
    outline: 3px solid #fde68a;
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: no-preference) {
    .spinner { animation: gift-pending-spin 1.1s linear infinite; }
    @keyframes gift-pending-spin { to { transform: rotate(360deg); } }
  }
</style>
</head>
<body>
  <main>
    <div class="spinner" aria-hidden="true"></div>
    <span class="badge">Gift in progress</span>
    <h1>Finishing your gift</h1>
    <p id="gift-pending-status" role="status" aria-live="polite">${statusText}</p>
    <div id="gift-pending-actions" hidden>
      <a class="button" href="${homeUrl}">Back to Lucky Pick Canada</a>
    </div>
  </main>
  <script>${script}</script>
</body>
</html>`;

  return new Response(html, {
    status: 202,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function GET(request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const paymentId = new URL(request.url).searchParams.get('session_id') || new URL(request.url).searchParams.get('payment_id');

  if (!secretKey || !paymentId) {
    return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
  }

  const stripe = new Stripe(secretKey);
  const isPoll = isPollRequest(request);

  try {
    const session = await findCheckoutSession(stripe, paymentId);

    if (!session) {
      return redirectHome(request, { giftError: 'Unable to find the paid gift checkout session.' });
    }

    const metadata = session.metadata || {};

    // If it's not a gift package, or not paid, redirect to home
    if (session.payment_status !== 'paid' || metadata.checkoutType !== 'gift_package') {
      return redirectHome(request, { giftError: 'Unable to verify the gift payment.' });
    }

    // Only redirect to reveal if delivery was confirmed completed. An intermediate
    // `processing` claim is not a completed delivery and must not short-circuit to success.
    if (isGiftDelivered(metadata)) {
      return redirectToReveal(request, session, metadata);
    }

    // If webhook hasn't processed it yet, attempt delivery here as fallback,
    // but this is mostly handled by webhook now. Let's just do it securely.
    const result = await deliverGiftEmailForSession(stripe, session.id);

    if (result.lockHeld) {
      // Another worker (usually the webhook) is mid-delivery and the email has NOT been sent
      // yet. Reporting success here is the false-success bug this guards against: wait
      // briefly for that worker to finish and only redirect once it durably confirms
      // delivery.
      const confirmedSession = await waitForConfirmedDelivery(stripe, session.id, isPoll ? 2 : DELIVERY_POLL_ATTEMPTS);
      const confirmedMetadata = confirmedSession?.metadata || {};

      if (isGiftDelivered(confirmedMetadata)) {
        return redirectToReveal(request, confirmedSession, confirmedMetadata);
      }

      return pendingResponse(request, isPoll ? 0 : PENDING_PAGE_POLL_ATTEMPTS);
    }

    if (result.delivered === true) {
      // The email provider accepted the message during this request, so dispatch is genuinely
      // confirmed even if the durable Stripe marker write failed afterwards.
      return redirectToReveal(request, session, metadata);
    }

    if (result.alreadyDelivered === true && metadata.giftDeliveredAt !== GIFT_PROCESSING_MARKER) {
      // A durable sent marker already exists, which means a previous attempt did dispatch the
      // email. The in-flight `processing` claim is excluded because it only records that some
      // attempt was underway, never that an email went out.
      return redirectToReveal(request, session, metadata);
    }

    return redirectHome(request, { giftError: result.reason || 'Unable to send this lucky pick gift right now.' });
  } catch (error) {
    console.error('Gift delivery failed', error);
    return redirectHome(request, { giftError: 'Unable to send this lucky pick gift right now.' });
  }
}

'use client';

import { useState } from 'react';
import { canBypassRevealPayment } from './test-tools/reveal-testing/revealTestConfig';

const COPY = {
  lucky_pick: { title: 'Choose your Lucky Pick', description: 'Select a game to continue to the secure checkout.' },
  gift_package: { title: 'Gift a Lucky Pick', description: 'Add the recipient details before continuing to the secure checkout.' },
  tip: { title: 'Leave a tip', description: 'Choose an amount in Canadian dollars to continue to the secure checkout.' },
};

export default function CheckoutModal({ type, onClose, onRevealTestStart }) {
  const [luckyPickGame, setLuckyPickGame] = useState('6');
  const copy = COPY[type];
  const isRevealTestMode = canBypassRevealPayment(type);

  async function requestRevealAccess(event) {
    if (!isRevealTestMode) return;

    event.preventDefault();

    if (type === 'gift_package') {
      const formData = new FormData(event.currentTarget);
      const recipientName = formData.get('recipientName') || '';
      const recipientEmail = formData.get('recipientEmail') || '';
      const senderName = formData.get('senderName') || '';
      const giftMessage = formData.get('giftMessage') || '';
      const selectedGame = formData.get('luckyPickGame') || luckyPickGame;

      try {
        const res = await fetch('/api/send-gift', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientName,
            recipientEmail,
            senderName,
            personalMessage: giftMessage,
            pickType: selectedGame,
          }),
        });

        if (!res.ok) {
          console.error('[Client] Backend gift email sending failed with status:', res.status);
          console.error('[Client] Response:', await res.text().catch(() => 'Unable to read response'));
        } else {
          console.log('[Client] Backend gift email sending triggered successfully');
        }
      } catch (err) {
        console.error('[Client] Network error when sending gift email:', err);
        console.error('[Client] Error details:', err.message || 'Unknown error');
      }
    }

    onRevealTestStart?.(type, luckyPickGame);
  }

  return (
    <div className="checkout-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="checkout-modal-close" onClick={onClose} aria-label="Close checkout options">×</button>
        <p className="homepage-offer-kicker">Lucky Pick Canada</p>
        <h2 id="checkout-modal-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <form action="/api/checkout" method="post" className="checkout-modal-form" onSubmit={requestRevealAccess} noValidate={isRevealTestMode}>
          <input type="hidden" name="checkoutType" value={type} />
          {(type === 'lucky_pick' || type === 'gift_package') && (
            <fieldset>
              <legend>Choose your game</legend>
              <label><input type="radio" name="luckyPickGame" value="6" checked={luckyPickGame === '6'} onChange={() => setLuckyPickGame('6')} /> 6 Pick</label>
              <label><input type="radio" name="luckyPickGame" value="7" checked={luckyPickGame === '7'} onChange={() => setLuckyPickGame('7')} /> 7 Pick</label>
            </fieldset>
          )}
          {type === 'gift_package' && (
            <>
              <label>Recipient name<input name="recipientName" required maxLength="80" autoComplete="name" /></label>
              <label>Recipient email<input name="recipientEmail" type="email" required maxLength="120" autoComplete="email" /></label>
              <label>Your name<input name="senderName" maxLength="80" autoComplete="name" /></label>
              <label>Personal message<textarea name="giftMessage" maxLength="500" rows="3" /></label>
            </>
          )}
          {type === 'tip' && <label>Tip amount (CAD)<input name="tipAmount" type="number" min="0.50" step="0.01" inputMode="decimal" required placeholder="5.00" /></label>}
          <button type="submit" className="checkout-modal-submit">Continue to secure checkout</button>
        </form>
      </section>
    </div>
  );
}

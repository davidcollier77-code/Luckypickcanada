'use client';

import { useState, useEffect } from 'react';
import { canPreviewReveal } from './test-tools/reveal-testing/revealTestConfig';

const COPY = {
  lucky_pick: { title: 'Choose your Lucky Pick', description: 'Select a game to continue to the secure checkout.' },
  gift_package: { title: 'Gift a Lucky Pick', description: 'Add the recipient details before continuing to the secure checkout.' },
  tip: { title: 'Leave a tip', description: 'Thank you so much for your support! Your generosity keeps the magic alive. Choose an amount in Canadian dollars to continue to the secure checkout.' },
};

export default function CheckoutModal({ type, onClose, onPreviewReveal }) {
  const [luckyPickGame, setLuckyPickGame] = useState('6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = COPY[type];
  if (!copy) {
    return null;
  }
  const isPreviewEnabled = canPreviewReveal(type);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted) {
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  /**
   * Guards against duplicate paid submissions only. The form always posts to
   * /api/checkout exactly as before; previews never pass through here.
   *
   * @param {import('react').FormEvent<HTMLFormElement>} event The submit event.
   */
  function requestRevealAccess(event) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    setIsSubmitting(true);
    // Reset the submit guard after a fixed delay; the callback is a static function reference, not user data.
    const resetSubmitting = () => setIsSubmitting(false);
    setTimeout(resetSubmitting, 8000);
  }

  /**
   * Opens the existing reveal animation without submitting the form, contacting
   * Stripe, taking payment, or sending any email.
   */
  function startPreviewReveal() {
    onPreviewReveal?.(type, luckyPickGame);
  }

  return (
    <div className="checkout-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`checkout-modal checkout-modal-${type}`} role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="checkout-modal-close focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={onClose} aria-label="Close checkout options" autoFocus>×</button>
        <p className="homepage-offer-kicker">Lucky Pick Canada</p>
        <h2 id="checkout-modal-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <form action="/api/checkout" method="post" className="checkout-modal-form" onSubmit={requestRevealAccess}>
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
              <label><span className="inline-flex items-center gap-1">Recipient name<span aria-hidden="true" className="text-red-500">*</span></span><input name="recipientName" required maxLength="80" autoComplete="name" /></label>
              <label><span className="inline-flex items-center gap-1">Recipient email<span aria-hidden="true" className="text-red-500">*</span></span><input name="recipientEmail" type="email" required maxLength="120" autoComplete="email" /></label>
              <label><span className="inline-flex items-center gap-1">Your name<span className="text-gray-400 font-normal text-[0.85em]">(optional)</span></span><input name="senderName" maxLength="80" autoComplete="name" /></label>
              <label><span className="inline-flex items-center gap-1">Personal message<span className="text-gray-400 font-normal text-[0.85em]">(optional)</span></span><textarea name="giftMessage" maxLength="500" rows="3" /></label>
            </>
          )}
          {type === 'tip' && <label><span className="inline-flex items-center gap-1">Tip amount (CAD)<span aria-hidden="true" className="text-red-500">*</span></span><input name="tipAmount" type="number" min="0.50" step="0.01" inputMode="decimal" required placeholder="5.00" /></label>}
          <button type="submit" disabled={isSubmitting} className="gold-3d-btn checkout-modal-submit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><span className="gold-cta-emoji" aria-hidden="true">🔒</span>{isSubmitting ? 'Please wait...' : 'Continue to secure checkout'}</button>
        </form>
        {isPreviewEnabled && (
          <div className="checkout-modal-preview">
            <button type="button" className="checkout-modal-preview-button focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" onClick={startPreviewReveal}>Preview Reveal — FREE</button>
            <p className="checkout-modal-preview-note">Preview only — no payment is taken and no emails are sent.</p>
          </div>
        )}
      </section>
    </div>
  );
}

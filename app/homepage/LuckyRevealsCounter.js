'use client';

import { useEffect, useState } from 'react';

/**
 * Premium neon-gold counter for the homepage: the number of paid Lucky Reveals
 * (Personal CAD $1.00 or Gift CAD $1.99) created to date.
 *
 * It starts at zero, exactly as requested, and reads the real total once on
 * mount. The endpoint never writes, so a visitor cannot influence the number.
 *
 * @returns {import('react').ReactElement} The counter plaque.
 */
export default function LuckyRevealsCounter() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let isActive = true;

    fetch('/api/lucky-reveals-count', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!isActive || !data) return;

        const nextTotal = Number(data.total);
        if (Number.isFinite(nextTotal) && nextTotal >= 0) {
          setTotal(Math.trunc(nextTotal));
        }
      })
      .catch((error) => console.warn('Lucky reveal counter unavailable', error));

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section
      id="lucky-reveals-counter"
      className="homepage-reveals-counter"
      aria-labelledby="lucky-reveals-counter-label"
    >
      <p id="lucky-reveals-counter-label" className="homepage-reveals-counter-label">
        LUCKY REVEALS CREATED TO DATE
      </p>
      <p className="homepage-reveals-counter-value">
        <span className="homepage-reveals-counter-number">{total.toLocaleString('en-CA')}</span>
      </p>
      <span className="homepage-reveals-counter-rule" aria-hidden="true" />
    </section>
  );
}

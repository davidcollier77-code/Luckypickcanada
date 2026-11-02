import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(join(process.cwd(), path), 'utf8');

const checkoutSource = read('app/api/checkout/route.js');
const giftEmailSource = read('app/gift-email.js');
const homepageSource = read('app/homepage/HomePage.js');
const modalSource = read('app/checkout-modal.jsx');

function optionBlock(name) {
  const block = checkoutSource.match(new RegExp(`\\b${name}: \\{[\\s\\S]*?\\n  \\},`));
  if (!block) {
    throw new Error(`Could not read the ${name} checkout option`);
  }
  return block[0];
}

function optionAmount(name) {
  const amount = optionBlock(name).match(/unitAmount: (\d+)/);
  if (!amount) {
    throw new Error(`Could not read the ${name} price`);
  }
  return Number(amount[1]);
}

describe('Stripe product alignment', () => {
  it('charges the official Lucky Pick price of CAD $1.00', () => {
    expect(optionAmount('lucky_pick')).toBe(100);
  });

  it('charges the official Lucky Pick Gift price of CAD $1.99', () => {
    expect(optionAmount('gift_package')).toBe(199);
  });

  it('keeps the gift delivery guard on the same price the checkout charges', () => {
    const guard = giftEmailSource.match(/amount_total !== (\d+)/);

    expect(guard).not.toBeNull();
    expect(Number(guard[1])).toBe(optionAmount('gift_package'));
    expect(giftEmailSource).toContain('session.currency !== "cad"');
  });

  it('creates every checkout as a one-time CAD payment', () => {
    expect(checkoutSource.match(/mode: 'payment'/g)).toHaveLength(1);
    expect(checkoutSource).not.toContain("mode: 'subscription'");
    expect(checkoutSource).not.toContain('subscription_data');
    expect(checkoutSource).not.toContain('recurring');
    expect(checkoutSource).toContain("currency: 'cad'");
    // Products are defined inline per session; no stored Stripe price ID is referenced.
    expect(checkoutSource).toContain('price_data:');
    expect(checkoutSource).not.toMatch(/\bprice:\s*['"]price_/);
  });

  it('lets the Tip Jar take a customer-entered CAD amount', () => {
    expect(checkoutSource).toContain("const tipAmount = dollarsToCents(formData.get('tipAmount'));");
    expect(checkoutSource).toContain('unitAmount: tipAmount');
    expect(checkoutSource).toMatch(/tipAmount < 50/);
    expect(checkoutSource).toContain('^\\d+(\\.\\d{1,2})?$');
    expect(modalSource).toContain('name="tipAmount"');
    expect(modalSource).toContain('min="0.50"');
    expect(modalSource).toContain('placeholder="5.00"');
    expect(modalSource).toContain('Suggested CAD $5.00');
  });

  it('uses the official product names on the Stripe Checkout page', () => {
    expect(checkoutSource).toContain("name: 'Lucky Pick',");
    expect(checkoutSource).toContain("name: 'Lucky Pick Gift',");
    expect(checkoutSource).toContain("name: 'Tip Jar',");
    expect(checkoutSource).not.toContain("name: 'Lucky Reveal'");
  });

  it('keeps the Lucky Reveal presentation on the website', () => {
    expect(homepageSource).toContain('Choose a Lucky Pick');
    expect(homepageSource).toContain('Personal Reveal');
    expect(homepageSource).toContain('Gift Reveal');
    expect(modalSource).toContain("title: 'Lucky Reveal'");
    expect(modalSource).toContain("title: 'Lucky Reveal Gift Edition'");
  });

  it('advertises the same prices on the website as it charges', () => {
    expect(homepageSource).toContain('Lucky Reveal · CAD $1');
    expect(homepageSource).toContain('CAD $1.99');
    expect(homepageSource).not.toContain('$2.99');
    expect(modalSource).not.toContain('$2.99');
    expect(giftEmailSource).not.toContain('$2.99');
  });
});

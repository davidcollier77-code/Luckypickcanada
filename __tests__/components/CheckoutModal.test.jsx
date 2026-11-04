// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import CheckoutModal from '../../app/checkout-modal';

const PAID_LABEL = /Continue to secure checkout/i;
const PREVIEW_LABEL = /Preview Reveal/i;

let onClose;
let fetchSpy;

beforeEach(() => {
  onClose = vi.fn();
  fetchSpy = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderModal(type) {
  return render(<CheckoutModal type={type} onClose={onClose} />);
}

describe('Checkout modal paywall', () => {
  it('offers only the paid checkout action for the personal reveal', () => {
    renderModal('lucky_pick');

    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: PREVIEW_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByText(/no payment is taken/i)).not.toBeInTheDocument();
  });

  it('offers only the paid checkout action for the gift reveal', () => {
    renderModal('gift_package');

    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: PREVIEW_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByText(/no payment is taken/i)).not.toBeInTheDocument();
  });

  it('keeps the tip jar unchanged and free of any preview', () => {
    renderModal('tip');

    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
    expect(screen.getByLabelText(/Tip amount/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: PREVIEW_LABEL })).not.toBeInTheDocument();
  });

  it('keeps the paid submit scoped to /api/checkout with no client fetch', () => {
    const { container } = renderModal('gift_package');
    const form = container.querySelector('form');

    fireEvent.submit(form);

    expect(form).toHaveAttribute('action', '/api/checkout');
    expect(screen.getByRole('button', { name: /Please wait/i })).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('Unified Lucky Reveal selection popup', () => {
  it('offers both delivery choices with the official prices and starts on Personal', () => {
    const { container } = renderModal('lucky_reveal');

    expect(container.querySelector('input[name="checkoutType"]')).toHaveValue('lucky_pick');
    expect(screen.getByRole('radio', { name: /Personal Reveal — CAD \$1\.00/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Gift Reveal — CAD \$1\.99/ })).not.toBeChecked();
    expect(container.querySelector('.checkout-modal-summary')).toHaveTextContent('Personal Reveal — CAD $1.00');
    expect(screen.queryByLabelText(/Recipient email/i)).not.toBeInTheDocument();
  });

  it('switches the posted checkout type to the gift and asks for recipient details', () => {
    const { container } = renderModal('lucky_reveal');

    fireEvent.click(screen.getByRole('radio', { name: /Gift Reveal/ }));

    expect(container.querySelector('input[name="checkoutType"]')).toHaveValue('gift_package');
    expect(container.querySelector('.checkout-modal-summary')).toHaveTextContent('Gift Reveal — CAD $1.99');
    expect(screen.getByLabelText(/Recipient email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient name/i)).toBeRequired();
  });

  it('removes the gift fields again when Personal is reselected', () => {
    const { container } = renderModal('lucky_reveal');

    fireEvent.click(screen.getByRole('radio', { name: /Gift Reveal/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Personal Reveal/ }));

    expect(container.querySelector('input[name="checkoutType"]')).toHaveValue('lucky_pick');
    expect(screen.queryByLabelText(/Recipient name/i)).not.toBeInTheDocument();
    expect(container.querySelector('textarea[name="giftMessage"]')).toBeNull();
  });

  it('keeps the 6 Pick or 7 Pick choice for both delivery types', () => {
    const { container } = renderModal('lucky_reveal');

    fireEvent.click(screen.getByRole('radio', { name: /7 Pick/i }));
    expect(container.querySelector('input[name="luckyPickGame"][value="7"]')).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /Gift Reveal/ }));
    expect(container.querySelector('input[name="checkoutType"]')).toHaveValue('gift_package');
    expect(container.querySelector('input[name="luckyPickGame"][value="7"]')).toBeChecked();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

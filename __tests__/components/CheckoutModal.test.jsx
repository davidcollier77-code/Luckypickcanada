// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import CheckoutModal from '../../app/checkout-modal';

// The real helper is exercised in security-payment.test.js. Here the switch and
// the eligible-flow set are mocked so both switch states can be asserted.
const previewState = vi.hoisted(() => ({ enabled: true }));

vi.mock('../../app/test-tools/reveal-testing/revealTestConfig', () => ({
  canPreviewReveal: (revealType) =>
    previewState.enabled && (revealType === 'lucky_pick' || revealType === 'gift_package'),
}));

const PREVIEW_LABEL = /Preview Reveal — FREE/i;
const PAID_LABEL = /Continue to secure checkout/i;

let onPreviewReveal;
let onClose;
let fetchSpy;

beforeEach(() => {
  previewState.enabled = true;
  onPreviewReveal = vi.fn();
  onClose = vi.fn();
  fetchSpy = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderModal(type) {
  return render(<CheckoutModal type={type} onClose={onClose} onPreviewReveal={onPreviewReveal} />);
}

describe('Checkout modal free preview', () => {
  it('shows the preview button and the no-email explanation beside the paid button', () => {
    renderModal('lucky_pick');

    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: PREVIEW_LABEL })).toHaveAttribute('type', 'button');
    expect(
      screen.getByText(/no payment is taken and no emails are sent/i)
    ).toBeInTheDocument();
  });

  it('previews the selected 6 Pick game without submitting, charging or emailing', () => {
    const { container } = renderModal('lucky_pick');
    const form = container.querySelector('form');

    fireEvent.click(screen.getByRole('button', { name: PREVIEW_LABEL }));

    expect(onPreviewReveal).toHaveBeenCalledWith('lucky_pick', '6');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(form).not.toBeNull();
    // The preview is outside the form and never triggers its submit handler.
    expect(form.contains(screen.getByRole('button', { name: PREVIEW_LABEL }))).toBe(false);
    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
  });

  it('previews the 7 Pick game selected in the modal', () => {
    renderModal('lucky_pick');

    fireEvent.click(screen.getByRole('radio', { name: /7 Pick/i }));
    fireEvent.click(screen.getByRole('button', { name: PREVIEW_LABEL }));

    expect(onPreviewReveal).toHaveBeenCalledWith('lucky_pick', '7');
  });

  it('previews a gift without requiring recipient details or calling any route', () => {
    renderModal('gift_package');

    fireEvent.click(screen.getByRole('button', { name: PREVIEW_LABEL }));

    expect(onPreviewReveal).toHaveBeenCalledWith('gift_package', '6');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Recipient email/i)).not.toBeValid();
  });

  it('never adds a preview button to the tip jar', () => {
    renderModal('tip');

    expect(screen.queryByRole('button', { name: PREVIEW_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByText(/no payment is taken/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
    expect(screen.getByLabelText(/Tip amount/i)).toBeInTheDocument();
  });

  it('hides the preview button when the switch is off and leaves checkout intact', () => {
    previewState.enabled = false;
    renderModal('lucky_pick');

    expect(screen.queryByRole('button', { name: PREVIEW_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByText(/no payment is taken/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: PAID_LABEL })).toBeInTheDocument();
  });

  it('keeps the paid submit independent of the preview', () => {
    const { container } = renderModal('gift_package');
    const form = container.querySelector('form');

    fireEvent.submit(form);

    expect(onPreviewReveal).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Please wait/i })).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

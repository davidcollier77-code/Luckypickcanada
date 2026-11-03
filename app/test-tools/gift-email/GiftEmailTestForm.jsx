'use client';

import { useState } from 'react';

const INITIAL_FORM = {
  recipientEmail: '',
  recipientName: '',
  senderName: '',
  giftMessage: '',
  luckyPickGame: '6',
};

const FIELD_CLASS =
  'w-full rounded-xl border border-amber-200/40 bg-slate-950/70 px-3.5 py-3 text-base text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300';
const LABEL_CLASS = 'grid gap-1.5 text-sm font-bold text-amber-100';

export default function GiftEmailTestForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('sending');
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-tools/gift-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setError(data.error || 'The test gift email could not be sent.');
        return;
      }

      setStatus('success');
      setResult(data);
    } catch {
      setStatus('error');
      setError('The test gift email request failed. Check the connection and try again.');
    }
  }

  const isSending = status === 'sending';

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className={LABEL_CLASS}>
        <span>Recipient email (required)</span>
        <input
          className={FIELD_CLASS}
          type="email"
          name="recipientEmail"
          value={form.recipientEmail}
          onChange={updateField}
          maxLength={120}
          autoComplete="email"
          required
        />
      </label>

      <label className={LABEL_CLASS}>
        <span>Recipient name (required)</span>
        <input
          className={FIELD_CLASS}
          type="text"
          name="recipientName"
          value={form.recipientName}
          onChange={updateField}
          maxLength={80}
          autoComplete="name"
          required
        />
      </label>

      <label className={LABEL_CLASS}>
        <span>Sender name (optional)</span>
        <input
          className={FIELD_CLASS}
          type="text"
          name="senderName"
          value={form.senderName}
          onChange={updateField}
          maxLength={80}
          autoComplete="name"
          placeholder="Lucky Pick Canada"
        />
      </label>

      <label className={LABEL_CLASS}>
        <span>Gift message (optional)</span>
        <textarea
          className={FIELD_CLASS}
          name="giftMessage"
          value={form.giftMessage}
          onChange={updateField}
          maxLength={500}
          rows={3}
          placeholder="This is a test Lucky Pick Canada gift email."
        />
      </label>

      <fieldset className="grid gap-2 rounded-xl border border-amber-200/30 p-3.5">
        <legend className="px-1.5 text-sm font-bold text-amber-100">Lucky Pick game</legend>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-white">
            <input
              type="radio"
              name="luckyPickGame"
              value="6"
              checked={form.luckyPickGame === '6'}
              onChange={updateField}
            />
            6 Pick (1–49)
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-white">
            <input
              type="radio"
              name="luckyPickGame"
              value="7"
              checked={form.luckyPickGame === '7'}
              onChange={updateField}
            />
            7 Pick (1–50)
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSending}
        className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-950 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 disabled:cursor-wait disabled:opacity-70"
      >
        {isSending ? 'Sending test email…' : 'Send test gift email'}
      </button>

      <div aria-live="polite" className="min-h-6">
        {status === 'error' && (
          <p role="alert" className="rounded-xl border border-red-300/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </p>
        )}

        {status === 'success' && result && (
          <section className="grid gap-3 rounded-xl border border-emerald-300/40 bg-emerald-950/30 p-4 text-sm text-emerald-50">
            <h2 className="m-0 text-base font-black uppercase tracking-wider text-emerald-200">
              Gift email sent
            </h2>
            <p className="m-0">
              Resend accepted the email for <strong>{result.recipientEmail}</strong>.
            </p>
            <p className="m-0">
              {result.reveal.gameName}:{' '}
              <span className="inline-flex flex-wrap gap-1.5 align-middle">
                {result.reveal.numbers.map((number) => (
                  <span
                    key={number}
                    className="inline-grid h-8 w-8 place-items-center rounded-full bg-amber-100 font-black text-slate-950"
                  >
                    {number}
                  </span>
                ))}
              </span>
            </p>
            <p className="m-0">
              Lucky colour: <strong>{result.reveal.luckyColor}</strong> · Lucky day:{' '}
              <strong>{result.reveal.luckyDay}</strong>
            </p>
          </section>
        )}
      </div>
    </form>
  );
}

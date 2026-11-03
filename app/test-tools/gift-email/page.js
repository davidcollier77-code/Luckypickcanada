import Link from 'next/link';
import GiftEmailTestForm from './GiftEmailTestForm';
import { isGiftEmailTestEnabled } from './giftEmailTestConfig';

export const metadata = {
  title: 'Gift email test | Lucky Pick Canada',
  description: 'Internal tool for sending a Lucky Pick Canada gift reveal test email.',
  robots: { index: false, follow: false },
};

export default function GiftEmailTestPage() {
  const isEnabled = isGiftEmailTestEnabled();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 text-white">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-amber-300">
        Lucky Pick Canada · Internal test tool
      </p>
      <h1 className="m-0 text-3xl font-black leading-tight sm:text-4xl">Gift email test</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-white/80">
        Send the real Gift Edition email through the existing Resend configuration. This test
        bypasses the payment requirement only. It does not create a Stripe Checkout session, take a
        payment, or change the paid gift flow.
      </p>

      <div className="mt-8 rounded-3xl border border-amber-200/30 bg-slate-900/60 p-5 shadow-2xl backdrop-blur sm:p-8">
        {isEnabled ? (
          <GiftEmailTestForm />
        ) : (
          <p className="m-0 text-sm text-amber-100">
            The gift email test tool is turned off. Set <code>GIFT_EMAIL_TEST_MODE</code> to{' '}
            <code>true</code> in <code>app/test-tools/gift-email/giftEmailTestConfig.js</code> to
            enable it.
          </p>
        )}
      </div>

      <section className="mt-6 grid gap-2 text-sm leading-relaxed text-white/70">
        <p className="m-0">
          <strong className="text-white/90">What is sent:</strong> the same reveal generator and
          Resend request the paid Gift Edition uses, including the recipient name, sender name,
          optional message, numbers, lucky colour and lucky day.
        </p>
        <p className="m-0">
          <strong className="text-white/90">What is not sent:</strong> no API key or test secret is
          entered on this page. The Resend credentials stay server-side, and this page never
          receives their values.
        </p>
        <p className="m-0">
          <strong className="text-white/90">Limits:</strong> up to 5 test emails per hour per
          address, and only from this site. Previews and the normal paid gift purchase are
          unchanged.
        </p>
        <p className="m-0 text-xs text-white/45">
          The page is excluded from search indexing. Picks are for fun and entertainment only.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/" className="font-bold text-amber-300 underline underline-offset-4">
          Back to Lucky Pick Canada
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Refund Policy — LuckyPickCanada.ca',
  description:
    'How refunds work for LuckyPick reveals, digital luck gifts, and tips on LuckyPickCanada.ca.',
}

const UPDATED = 'July 15, 2026'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Digital, entertainment-only products',
    paragraphs: [
      'Everything you buy on LuckyPickCanada.ca is a digital, for-fun entertainment product that is delivered instantly: the $1.00 CAD LuckyPick reveal, the $4.99 CAD "Send a Little Luck" gift, and optional tips.',
      'Because these items are digital and delivered immediately, all sales are generally final and non-refundable.',
    ],
  },
  {
    heading: 'When we will make it right',
    paragraphs: [
      'We want everyone to leave feeling a little lucky. If you were charged more than once for the same purchase, charged in error, or a technical problem prevented your reveal or gift from being delivered, we will gladly issue a refund.',
      'Refund requests for these situations should be made within 30 days of the purchase.',
    ],
  },
  {
    heading: 'Tips',
    paragraphs: [
      'Tips left through the Lucky Tip Jar are voluntary gifts of support and are non-refundable, except in the case of a duplicate or clearly accidental charge.',
    ],
  },
  {
    heading: 'How to request a refund',
    paragraphs: [
      'Email hello@luckypickcanada.ca with the email address used at checkout and the approximate date and amount of the purchase. We will review and respond as quickly as we can.',
      'Approved refunds are returned to your original payment method through Stripe. It may take several business days for the refund to appear, depending on your bank or card issuer.',
    ],
  },
]

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated={UPDATED}
      intro="A quick, friendly explanation of how refunds work for our digital, just-for-fun purchases."
      sections={SECTIONS}
    />
  )
}

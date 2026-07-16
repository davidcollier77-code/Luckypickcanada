import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy — LuckyPickCanada.ca',
  description:
    'How LuckyPickCanada.ca collects, uses, and protects your information. We keep things minimal and privacy-friendly.',
}

const UPDATED = 'July 15, 2026'

const SECTIONS: LegalSection[] = [
  {
    heading: 'Our approach to privacy',
    paragraphs: [
      'LuckyPickCanada.ca is built to be privacy-friendly. We collect as little information as possible and never sell your personal information.',
    ],
  },
  {
    heading: 'Information we collect',
    paragraphs: [
      'LuckyPick experience: To generate your lucky reveal we use the first name and province you enter. These are used only to create your result and are not stored with your identity.',
      'Community submissions: If you share a story or suggestion, we store the name, province, message, and (for suggestions) optional email address you provide so we can review and, for stories, publish it.',
      'Canada Luck Map: We keep an anonymous count of LuckyPick activity per province. No exact locations or personal details are recorded — only a general province tally.',
      'Payments: When you buy a LuckyPick, send a gift, or leave a tip, payment is handled by Stripe. Stripe collects the details needed to process your payment. We receive confirmation of payment but do not store your full card number.',
    ],
  },
  {
    heading: 'How we use information',
    paragraphs: [
      'We use the limited information above to provide the LuckyPick experience, review and publish community stories, respond to suggestions when you request a reply, display anonymous province activity, and process payments.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'We use a small number of essential cookies, such as an administrator sign-in cookie for site moderation. We do not use advertising trackers.',
    ],
  },
  {
    heading: 'Third-party services',
    paragraphs: [
      'We rely on trusted providers to run the Site, including Stripe for payments and our hosting and database providers. These providers process data only as needed to deliver their service.',
    ],
  },
  {
    heading: 'Your choices and rights',
    paragraphs: [
      'You may request that we remove a story or suggestion you submitted, or ask what information we hold about you, by contacting us. Because the LuckyPick experience does not store personal identities, most activity on the Site is already anonymous.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'The Site is family-friendly, but purchases should be made by an adult or with a parent or guardian\u2019s permission. We do not knowingly collect personal information from children.',
    ],
  },
  {
    heading: 'Contact us',
    paragraphs: [
      'Questions about privacy? Email hello@luckypickcanada.ca and we will be happy to help.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      intro="Your privacy matters. Here is exactly what we collect, why, and how it is handled — in plain language."
      sections={SECTIONS}
    />
  )
}

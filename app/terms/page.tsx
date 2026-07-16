import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Terms of Service — LuckyPickCanada.ca',
  description:
    'The terms that govern your use of LuckyPickCanada.ca, a family-friendly entertainment website.',
}

const UPDATED = 'July 15, 2026'

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Acceptance of these terms',
    paragraphs: [
      'By accessing or using LuckyPickCanada.ca (the "Site"), you agree to these Terms of Service. If you do not agree, please do not use the Site.',
      'You must be at least the age of majority in your province or territory, or have permission from a parent or guardian, to make a purchase on the Site.',
    ],
  },
  {
    heading: '2. Entertainment purpose only',
    paragraphs: [
      'LuckyPickCanada.ca is a positive, family-friendly entertainment website. It is not a lottery, gambling service, betting platform, or prediction tool.',
      'The Site is not affiliated with, connected to, or operated by any Canadian lottery organization or government lottery corporation. Lucky numbers, colours, days, and messages are randomly generated for fun and do not predict winning numbers or improve your chances of winning any lottery or contest.',
    ],
  },
  {
    heading: '3. Paid features',
    paragraphs: [
      'The LuckyPick reveal is a paid entertainment experience costing $1.00 CAD per pick. The "Send a Little Luck" digital gift is $4.99 CAD. Tips through the Lucky Tip Jar are optional and may be any amount you choose.',
      'Payments are processed securely by Stripe. We do not store your full card details on our servers. Prices are in Canadian dollars and may change at any time.',
    ],
  },
  {
    heading: '4. Community submissions',
    paragraphs: [
      'When you submit a story or suggestion, you grant us permission to review, edit, publish, or decline it. All stories are reviewed before appearing publicly.',
      'Do not submit content that is unlawful, hateful, harassing, misleading, or that infringes anyone\u2019s rights. We may remove any content at our discretion.',
    ],
  },
  {
    heading: '5. Acceptable use',
    paragraphs: [
      'You agree not to misuse the Site, including attempting to disrupt it, access it through automated means without permission, or use it for any unlawful purpose.',
    ],
  },
  {
    heading: '6. Disclaimer and limitation of liability',
    paragraphs: [
      'The Site is provided "as is" without warranties of any kind. To the fullest extent permitted by law, LuckyPickCanada.ca is not liable for any indirect, incidental, or consequential damages arising from your use of the Site.',
    ],
  },
  {
    heading: '7. Changes to these terms',
    paragraphs: [
      'We may update these Terms from time to time. Continued use of the Site after changes means you accept the updated Terms.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={UPDATED}
      intro="Welcome! These terms explain the rules for using LuckyPickCanada.ca and its paid, just-for-fun features."
      sections={SECTIONS}
    />
  )
}

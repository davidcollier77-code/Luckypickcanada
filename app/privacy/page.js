import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Lucky Pick Canada',
  description: 'Learn how LuckyPickCanada.ca handles information related to your use of the website and explains its privacy practices.',
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <Link href="/" className="legal-back-link">
        ← Back to Home
      </Link>
      <h1 className="legal-title">Privacy Policy</h1>
      <p className="legal-meta">Last Updated: August 10, 2026</p>

      <div className="legal-surface">
        <section className="legal-section">
          <h2 className="legal-section-title">Introduction</h2>
          <p>
            Welcome to Lucky Pick Canada (<a href="https://luckypickcanada.ca">https://luckypickcanada.ca</a>). We are committed to protecting your privacy while you use our random generator and luck-themed digital card reveal platform. This Privacy Policy outlines how we handle your information when you visit and use our website.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">Information Collection</h2>
          <p>
            We believe in keeping things simple and secure. We do not require account creation for the core features of Lucky Pick Canada. To optimize the mobile experience and improve our platform, we only collect standard, non-identifying analytics data. This data helps us understand how our site is used so we can make it better for everyone.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">Premium Features</h2>
          <p>
            If you choose to access higher-tier features, such as the Coast to Coast premium card reveal, any necessary session data is handled securely. We do not store sensitive payment information directly on our servers. All payment processing is managed by secure, third-party payment providers to ensure your transactions are safe.
          </p>
        </section>

        <section className="legal-section">
          <h2 className="legal-section-title">Third-Party Services</h2>
          <p>
            To deliver our website quickly and reliably across Canada, we use standard edge-caching and analytics services. These third-party services may collect standard web log information (such as IP addresses and browser types) necessary for providing their technical infrastructure and security services.
          </p>
        </section>
      </div>
    </div>
  );
}

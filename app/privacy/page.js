import Link from 'next/link';

export const metadata = {
  title: "Privacy Policy | Lucky Pick Canada",
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto p-6 leading-relaxed">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: August 10, 2026</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Introduction</h2>
        <p className="mb-4">
          Welcome to Lucky Pick Canada (<a href="https://luckypickcanada.ca" className="text-blue-600 hover:underline">https://luckypickcanada.ca</a>). We are committed to protecting your privacy while you use our random generator and luck-themed digital card reveal platform. This Privacy Policy outlines how we handle your information when you visit and use our website.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Information Collection</h2>
        <p className="mb-4">
          We believe in keeping things simple and secure. We do not require account creation for the core features of Lucky Pick Canada. To optimize the mobile experience and improve our platform, we only collect standard, non-identifying analytics data. This data helps us understand how our site is used so we can make it better for everyone.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Premium Features</h2>
        <p className="mb-4">
          If you choose to access higher-tier features, such as the Coast to Coast premium card reveal, any necessary session data is handled securely. We do not store sensitive payment information directly on our servers. All payment processing is managed by secure, third-party payment providers to ensure your transactions are safe.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
        <p className="mb-4">
          To deliver our website quickly and reliably across Canada, we use standard edge-caching and analytics services. These third-party services may collect standard web log information (such as IP addresses and browser types) necessary for providing their technical infrastructure and security services.
        </p>
      </section>
    </main>
  );
}

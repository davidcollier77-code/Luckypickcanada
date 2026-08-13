// components/AboutSection.tsx
import Link from 'next/link';

export default function AboutSection() {
  return (
    <section className="py-12 px-4 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">About Lucky Pick Canada</h2>

      <p className="text-lg leading-relaxed text-slate-700 mb-4">
        Whether you want to draw a quick card or calculate your daily energy, start
        your morning with our{' '}
        <Link
          href="/lucky-meter"
          className="text-amber-600 font-semibold underline hover:text-amber-700"
        >
          interactive Lucky Meter generator
        </Link>
        . It's designed to bring a fast, fun spark of optimism coast to coast.
      </p>

      <p className="text-lg leading-relaxed text-slate-700 mb-4">
        Want to see how others across the country are sharing good energy? Explore
        real user posts on our{' '}
        <Link
          href="/stories"
          className="text-amber-600 font-semibold underline hover:text-amber-700"
        >
          Community Lucky Stories section
        </Link>{' '}
        or discover regional highlights on the{' '}
        <Link
          href="/map"
          className="text-amber-600 font-semibold underline hover:text-amber-700"
        >
          Canadian Lucky Map
        </Link>
        .
      </p>
    </section>
  );
}

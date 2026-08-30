import HomePage from './homepage/HomePage';
import Hero from './homepage/Hero';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>
      <Hero />
      <HomePage />
    </>
  );
}

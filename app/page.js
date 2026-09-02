import HomePage from './homepage/HomePage';
import Hero from './homepage/Hero';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <>
      <div className="aurora-container">
        <div className="aurora-layer aurora-layer-1"></div>
        <div className="aurora-layer aurora-layer-2"></div>
        <div className="aurora-layer aurora-layer-3"></div>
        <div className="aurora-layer aurora-layer-4"></div>
      </div>
      <Hero />
      <HomePage />
    </>
  );
}

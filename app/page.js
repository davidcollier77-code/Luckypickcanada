export const dynamic = 'force-dynamic';

const games = [
  { name: 'Lotto 6/49', count: 6, max: 49 },
  { name: 'Daily Grand', count: 5, max: 49 },
  { name: 'Set for Life', count: 8, max: 47 },
];

function generateNumbers(count, max) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      padding: '4rem 1.5rem',
      background: 'linear-gradient(135deg, #f7fff9 0%, #e6f3ff 100%)',
      color: '#102033',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      <section style={{ maxWidth: 900, margin: '0 auto' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#0f766e' }}>
          Lucky Pick Canada
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 1, margin: '1rem 0' }}>
          Quick lottery number picks
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: 620, lineHeight: 1.6 }}>
          Generate sample Canadian lottery number sets for fun. Refresh the page for a new set of picks.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          {games.map((game) => (
            <article key={game.name} style={{ padding: '1.5rem', borderRadius: 20, background: 'white', boxShadow: '0 20px 50px rgba(15, 118, 110, 0.12)' }}>
              <h2 style={{ marginTop: 0 }}>{game.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {generateNumbers(game.count, game.max).map((number) => (
                  <span key={number} style={{ display: 'inline-grid', placeItems: 'center', width: 42, height: 42, borderRadius: '50%', background: '#0f766e', color: 'white', fontWeight: 700 }}>
                    {number}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

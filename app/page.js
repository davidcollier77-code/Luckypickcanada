export const dynamic = 'force-dynamic';

const games = [
  { name: '6 Pick', count: 6, max: 49, description: 'Six unique numbers from 1 to 49.' },
  { name: '7 Pick', count: 7, max: 50, description: 'Seven unique numbers from 1 to 50.' },
];

const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const checkoutButtonStyle = {
  width: '100%',
  padding: '0.9rem 1.4rem',
  border: 0,
  borderRadius: 999,
  background: '#0f766e',
  color: 'white',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
};

function generateNumbers(count, max) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      padding: '4rem 1.5rem',
      background: 'radial-gradient(circle at top, rgba(45, 212, 191, 0.24), transparent 35%), linear-gradient(135deg, #061826 0%, #0f172a 52%, #14213d 100%)',
      color: '#f8fafc',
      fontFamily: 'Arial, Helvetica, sans-serif',
    }}>
      <section style={{ maxWidth: 900, margin: '0 auto' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#5eead4' }}>
          Lucky Pick Canada
        </p>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 1, margin: '1rem 0' }}>
          6 Pick and 7 Pick lucky numbers
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: 680, lineHeight: 1.6 }}>
          Get a $1 lucky pick with unique numbers, a slow reveal with stars and Aurora, plus your lucky color and day of the week.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <form action="/api/checkout" method="POST" style={{ padding: '1.5rem', borderRadius: 20, background: 'rgba(255, 255, 255, 0.95)', color: '#102033', boxShadow: '0 20px 50px rgba(15, 118, 110, 0.18)' }}>
            <input type="hidden" name="checkoutType" value="lucky_pick" />
            <h2 style={{ marginTop: 0 }}>Lucky pick</h2>
            <p style={{ lineHeight: 1.5 }}>Choose either a 6 Pick or 7 Pick result with no duplicate numbers.</p>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>6 Pick: 1 to 49</li>
              <li>7 Pick: 1 to 50</li>
              <li>Slow reveal with stars and Aurora</li>
              <li>Lucky color and lucky day included</li>
            </ul>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>$1.00 CAD</p>
            <button type="submit" style={checkoutButtonStyle}>Buy lucky pick for $1.00</button>
          </form>

          <form action="/api/checkout" method="POST" style={{ padding: '1.5rem', borderRadius: 20, background: 'rgba(255, 255, 255, 0.95)', color: '#102033', boxShadow: '0 20px 50px rgba(15, 118, 110, 0.18)' }}>
            <input type="hidden" name="checkoutType" value="gift_package" />
            <h2 style={{ marginTop: 0 }}>Gift packages</h2>
            <p style={{ lineHeight: 1.5 }}>Send Lucky Pick as a gift package.</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>$4.99 CAD</p>
            <button type="submit" style={checkoutButtonStyle}>Buy gift package for $4.99</button>
          </form>

          <form action="/api/checkout" method="POST" style={{ padding: '1.5rem', borderRadius: 20, background: 'rgba(255, 255, 255, 0.95)', color: '#102033', boxShadow: '0 20px 50px rgba(15, 118, 110, 0.18)' }}>
            <input type="hidden" name="checkoutType" value="tip" />
            <h2 style={{ marginTop: 0 }}>Tip jar</h2>
            <label htmlFor="tipAmount" style={{ display: 'block', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Enter any amount you want to tip.
            </label>
            <input
              id="tipAmount"
              name="tipAmount"
              type="number"
              min="0.50"
              step="0.01"
              placeholder="5.00"
              required
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 1rem', borderRadius: 12, border: '1px solid #b7d9d5', fontSize: '1rem', marginBottom: '1rem' }}
            />
            <button type="submit" style={checkoutButtonStyle}>Leave a tip</button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          {games.map((game) => {
            const luckyColor = pickOne(luckyColors);
            const luckyDay = pickOne(luckyDays);

            return (
              <article key={game.name} style={{ padding: '1.5rem', borderRadius: 20, background: 'rgba(255, 255, 255, 0.95)', color: '#102033', boxShadow: '0 20px 50px rgba(15, 118, 110, 0.18)' }}>
                <h2 style={{ marginTop: 0 }}>{game.name}</h2>
                <p>{game.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {generateNumbers(game.count, game.max).map((number) => (
                    <span key={number} style={{ display: 'inline-grid', placeItems: 'center', width: 42, height: 42, borderRadius: '50%', background: '#0f766e', color: 'white', fontWeight: 700, boxShadow: '0 0 18px rgba(94, 234, 212, 0.8)' }}>
                      {number}
                    </span>
                  ))}
                </div>
                <p style={{ lineHeight: 1.6 }}>
                  Slow reveal theme: stars and Aurora<br />
                  Lucky color: <strong>{luckyColor}</strong><br />
                  Lucky day: <strong>{luckyDay}</strong>
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

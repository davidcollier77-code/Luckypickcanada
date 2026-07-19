import { getLuckMap, provinces } from './luck-map';
import LuckMeter from './luck-meter';
import LuckyRevealPopup from './lucky-reveal-popup';
import { getLuckyStories } from './lucky-stories';

export const dynamic = 'force-dynamic';

const games = [
  { name: '6 Pick', count: 6, max: 49, description: 'Six unique numbers from 1 to 49.' },
  { name: '7 Pick', count: 7, max: 50, description: 'Seven unique numbers from 1 to 50.' },
];

const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const checkoutButtonStyle = {
  width: '100%',
  padding: '0.95rem 1.45rem',
  border: '1px solid rgba(255, 242, 180, 0.86)',
  borderRadius: 999,
  background: 'linear-gradient(135deg, #fff8c8 0%, #f9d86c 22%, #facc15 48%, #b7791f 100%)',
  color: '#06110d',
  fontSize: '1rem',
  fontWeight: 950,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  boxShadow: '0 0 26px rgba(250, 204, 21, 0.52), 0 16px 34px rgba(183, 121, 31, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.62)',
  textShadow: '0 1px 0 rgba(255, 255, 255, 0.45)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
};

const glassCardStyle = {
  padding: 'clamp(1.25rem, 3vw, 1.75rem)',
  borderRadius: 28,
  background: 'linear-gradient(145deg, rgba(5, 13, 24, 0.9), rgba(8, 38, 36, 0.78) 48%, rgba(7, 18, 37, 0.86))',
  color: '#fff7d6',
  border: '1px solid rgba(255, 235, 160, 0.24)',
  boxShadow: '0 26px 80px rgba(0, 0, 0, 0.44), 0 0 34px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(18px) saturate(130%)',
  position: 'relative',
  overflow: 'hidden',
};

const inputStyle = {
  padding: '0.85rem 1rem',
  borderRadius: 14,
  border: '1px solid rgba(255, 235, 160, 0.32)',
  background: 'linear-gradient(180deg, rgba(255, 253, 239, 0.96), rgba(239, 253, 245, 0.9))',
  color: '#071225',
  fontSize: '1rem',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 24px rgba(0, 0, 0, 0.16)',
};

const sectionHeadingStyle = {
  color: '#fff7d6',
  textShadow: '0 0 24px rgba(250, 204, 21, 0.18)',
};

const successMessageStyle = { padding: '0.8rem 1rem', borderRadius: 14, background: 'rgba(16, 185, 129, 0.16)', color: '#d1fae5', border: '1px solid rgba(52, 211, 153, 0.34)', fontWeight: 700 };
const errorMessageStyle = { padding: '0.8rem 1rem', borderRadius: 14, background: 'rgba(185, 28, 28, 0.16)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.36)', fontWeight: 700 };
const warningMessageStyle = { padding: '0.8rem 1rem', borderRadius: 14, background: 'rgba(250, 204, 21, 0.14)', color: '#fde68a', border: '1px solid rgba(250, 204, 21, 0.32)', fontWeight: 700 };

const logoCardStyle = {
  flex: '0 0 auto',
  display: 'block',
  objectFit: 'contain',
};

function BrandLogo({ size = 64, label = 'Lucky Pick Canada', textColor = '#f8fafc', tagline }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
      <img
        src="/file_00000000e8b8722f909e901d9b84325d.png"
        alt="Official Lucky Pick Canada logo"
        width={size}
        height={size}
        style={{ ...logoCardStyle, width: size, height: size }}
      />
      <div>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800, color: textColor }}>
          {label}
        </p>
        {tagline ? <p style={{ margin: '0.25rem 0 0', color: 'rgba(255, 245, 203, 0.78)' }}>{tagline}</p> : null}
      </div>
    </div>
  );
}

function SectionKicker({ children }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
      <img
        src="/file_00000000e8b8722f909e901d9b84325d.png"
        alt=""
        aria-hidden="true"
        width="36"
        height="36"
        style={{ ...logoCardStyle, width: 36, height: 36, borderRadius: 10, boxShadow: '0 0 22px rgba(250, 204, 21, 0.24)' }}
      />
      <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800, color: '#facc15' }}>
        {children}
      </p>
    </div>
  );
}

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

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const [luckMap, luckyStories] = await Promise.all([getLuckMap(), getLuckyStories()]);
  const { provinceCounts, recentShares, totalShares, isConfigured } = luckMap;
  const { recentStories, isConfigured: areStoriesConfigured } = luckyStories;
  const mapError = params?.mapError;
  const suggestionError = params?.suggestionError;
  const storyError = params?.storyError;
  const giftError = params?.giftError;
  const giftSent = params?.giftSent === '1';
  const shared = params?.shared === '1';
  const suggested = params?.suggested === '1';
  const storyShared = params?.storyShared === '1';
  const checkoutSessionId = params?.session_id || '';
  const canShareOnMap = params?.payment === 'success' && params?.map === '1' && checkoutSessionId;
  const selectedGame = params?.pick === '7' ? games[1] : games[0];
  const purchasedReveal = canShareOnMap
    ? {
        game: {
          name: selectedGame.name,
          numbers: generateNumbers(selectedGame.count, selectedGame.max),
        },
        luckyColor: pickOne(luckyColors),
        luckyDay: pickOne(luckyDays),
      }
    : null;

  return (
    <main style={{
      minHeight: '100vh',
      padding: '4rem 1.5rem',
      background: 'radial-gradient(circle at 14% 8%, rgba(250, 204, 21, 0.22), transparent 26%), radial-gradient(circle at 86% 12%, rgba(16, 185, 129, 0.28), transparent 31%), radial-gradient(circle at 50% 100%, rgba(185, 28, 28, 0.16), transparent 34%), linear-gradient(135deg, #010403 0%, #020817 35%, #071225 60%, #021a18 100%)',
      color: '#fff7d6',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes magical-star-twinkle {
          0%, 100% { opacity: 0.32; transform: scale(0.86) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.12) rotate(18deg); }
        }

        @keyframes aurora-drift {
          0% { transform: translate3d(-10%, -4%, 0) rotate(-9deg) scaleX(1); opacity: 0.44; }
          50% { transform: translate3d(7%, 4%, 0) rotate(6deg) scaleX(1.08); opacity: 0.72; }
          100% { transform: translate3d(16%, -2%, 0) rotate(-4deg) scaleX(1.02); opacity: 0.5; }
        }

        @keyframes page-fade-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .aurora-gold-button:hover { transform: translateY(-2px) scale(1.01); filter: saturate(1.12); box-shadow: 0 0 36px rgba(250, 204, 21, 0.64), 0 18px 40px rgba(183, 121, 31, 0.34) !important; }
        .aurora-glass-card { transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease; }
        .aurora-glass-card:hover { transform: translateY(-3px); border-color: rgba(255, 235, 160, 0.4) !important; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5), 0 0 42px rgba(16, 185, 129, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important; }
        .gold-text { background: linear-gradient(180deg, #fff8c8 0%, #facc15 44%, #b7791f 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 28px rgba(250, 204, 21, 0.2); }
      `}</style>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '6%', left: '-12%', width: '92vw', height: '19rem', borderRadius: '999px', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0), rgba(20, 184, 166, 0.5), rgba(250, 204, 21, 0.28), rgba(52, 211, 153, 0.34), rgba(16, 185, 129, 0))', filter: 'blur(18px)', animation: 'aurora-drift 14s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '18%', right: '-18%', width: '78vw', height: '15rem', borderRadius: '999px', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0), rgba(6, 182, 212, 0.28), rgba(52, 211, 153, 0.4), rgba(250, 204, 21, 0.2), rgba(16, 185, 129, 0))', filter: 'blur(22px)', animation: 'aurora-drift 18s ease-in-out -5s infinite alternate-reverse' }} />
        {[['✦', '9%', '12%', '0s'], ['✧', '82%', '10%', '0.7s'], ['✶', '72%', '32%', '1.3s'], ['✦', '16%', '44%', '1.8s'], ['✧', '90%', '64%', '2.4s'], ['✶', '35%', '76%', '3s']].map(([star, left, top, delay]) => (
          <span key={`${star}-${left}-${top}`} style={{ position: 'absolute', left, top, color: '#fde68a', textShadow: '0 0 16px rgba(250, 204, 21, 0.9)', animation: `magical-star-twinkle 3.4s ease-in-out ${delay} infinite` }}>
            {star}
          </span>
        ))}
      </div>
      <LuckyRevealPopup reveal={purchasedReveal} />
      <section style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1, animation: 'page-fade-in 700ms ease both' }}>
        <div style={{ marginBottom: '1rem', padding: 'clamp(1.25rem, 4vw, 2.2rem)', borderRadius: 34, border: '1px solid rgba(255, 235, 160, 0.2)', background: 'radial-gradient(circle at 85% 12%, rgba(250, 204, 21, 0.18), transparent 28%), radial-gradient(circle at 12% 16%, rgba(16, 185, 129, 0.22), transparent 30%), linear-gradient(145deg, rgba(2, 8, 23, 0.74), rgba(4, 24, 22, 0.62))', boxShadow: '0 28px 90px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(16px)' }}>
          <BrandLogo size={128} textColor="#facc15" tagline="Maple clover luck, made in Canada" />
          <h1 className="gold-text" style={{ fontSize: 'clamp(2.65rem, 8vw, 5.6rem)', lineHeight: 0.95, margin: '1rem 0 0.85rem', letterSpacing: '-0.055em', maxWidth: 900 }}>
            6 Pick and 7 Pick lucky numbers
          </h1>
          <p style={{ fontSize: 'clamp(1.08rem, 2.4vw, 1.35rem)', maxWidth: 720, lineHeight: 1.65, color: 'rgba(255, 247, 214, 0.88)', marginBottom: 0 }}>
            Get a $1 lucky pick with unique numbers, a slow reveal with stars and Aurora, plus your lucky color and day of the week.
          </p>
        </div>
        <p style={{ maxWidth: 680, lineHeight: 1.6, padding: '0.9rem 1rem', borderRadius: 16, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 235, 160, 0.24)', boxShadow: '0 0 28px rgba(250, 204, 21, 0.12)', backdropFilter: 'blur(12px)' }}>
          Disclaimer: Lucky Pick Canada is not affiliated with, endorsed by, or connected to any lottery organization. Picks are for fun and entertainment only.
        </p>

        <LuckMeter />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <form action="/api/checkout" method="POST" className="aurora-glass-card" style={glassCardStyle}>
            <input type="hidden" name="checkoutType" value="lucky_pick" />
            <h2 style={{ ...sectionHeadingStyle, marginTop: 0 }}>Lucky pick</h2>
            <p style={{ lineHeight: 1.5 }}>Choose either a 6 Pick or 7 Pick result with no duplicate numbers.</p>
            <div style={{ display: 'grid', gap: '0.6rem', margin: '1rem 0' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 700 }}>
                <input type="radio" name="luckyPickGame" value="6" defaultChecked />
                6 Pick: 1 to 49
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 700 }}>
                <input type="radio" name="luckyPickGame" value="7" />
                7 Pick: 1 to 50
              </label>
            </div>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.6 }}>
              <li>Randomly generated lucky pick</li>
              <li>Lucky color and lucky day included</li>
              <li>Slow reveal with stars and Aurora</li>
            </ul>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>$1.00 CAD</p>
            <button type="submit" className="aurora-gold-button" style={checkoutButtonStyle}>Buy lucky pick for $1.00</button>
            <p style={{ lineHeight: 1.5, marginBottom: 0 }}>After checkout, you can add your name and province to the Little Luck Map.</p>
          </form>

          <form action="/api/checkout" method="POST" className="aurora-glass-card" style={glassCardStyle}>
            <input type="hidden" name="checkoutType" value="gift_package" />
            <h2 style={{ ...sectionHeadingStyle, marginTop: 0 }}>Gift a lucky pick</h2>
            <p style={{ lineHeight: 1.5 }}>Send the same lucky reveal by email with your personal greeting.</p>
            {giftSent ? <p style={successMessageStyle}>Your lucky pick gift was sent.</p> : null}
            {giftError ? <p style={errorMessageStyle}>{giftError}</p> : null}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 700 }}>
                Recipient name
                <input name="recipientName" type="text" maxLength="80" placeholder="Friend's name" required style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 700 }}>
                Recipient email
                <input name="recipientEmail" type="email" maxLength="120" placeholder="friend@example.com" required style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 700 }}>
                Your name (optional)
                <input name="senderName" type="text" maxLength="80" placeholder="From David" style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 700 }}>
                Pick type
                <select name="luckyPickGame" defaultValue="6" style={inputStyle}>
                  <option value="6">6 Pick</option>
                  <option value="7">7 Pick</option>
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 700 }}>
                Personal greeting
                <textarea name="giftMessage" maxLength="500" rows={4} placeholder="Wishing you a lucky day." style={{ ...inputStyle, resize: 'vertical' }} />
              </label>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>$4.99 CAD</p>
            <button type="submit" className="aurora-gold-button" style={checkoutButtonStyle}>Send gift for $4.99</button>
          </form>

          <form action="/api/checkout" method="POST" className="aurora-glass-card" style={glassCardStyle}>
            <input type="hidden" name="checkoutType" value="tip" />
            <h2 style={{ ...sectionHeadingStyle, marginTop: 0 }}>Tip jar</h2>
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
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: '1rem' }}
            />
            <p style={{ lineHeight: 1.5, marginTop: 0 }}>
              Your tip helps keep Lucky Pick Canada running and supports new ideas, improvements, and visitor suggestions. Thanks for your support.
            </p>
            <button type="submit" className="aurora-gold-button" style={checkoutButtonStyle}>Leave a tip</button>
          </form>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          {games.map((game) => {
            const luckyColor = pickOne(luckyColors);
            const luckyDay = pickOne(luckyDays);

            return (
              <article key={game.name} className="aurora-glass-card" style={glassCardStyle}>
                <h2 style={{ ...sectionHeadingStyle, marginTop: 0 }}>{game.name}</h2>
                <p>{game.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {generateNumbers(game.count, game.max).map((number) => (
                    <span key={number} style={{ display: 'inline-grid', placeItems: 'center', width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle at 30% 25%, #ecfdf5, #10b981 45%, #064e3b 100%)', color: '#fff7d6', fontWeight: 900, border: '1px solid rgba(255, 235, 160, 0.4)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.62), 0 0 34px rgba(250, 204, 21, 0.22)' }}>
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

        <section id="lucky-stories" className="aurora-glass-card" style={{ ...glassCardStyle, marginTop: '2rem' }}>
          <SectionKicker>Lucky Stories</SectionKicker>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0.5rem 0', letterSpacing: '-0.035em' }}>
            Share your stories of luck and happiness
          </h2>
          <p style={{ lineHeight: 1.6, maxWidth: 680 }}>
            Lucky Pick Canada is more than lucky number reveals and gifts. It’s a place to share where you found luck, what it meant, and how a little happiness showed up in your life.
          </p>

          {storyShared ? <p style={successMessageStyle}>Thanks for sharing your lucky story.</p> : null}
          {storyError ? <p style={errorMessageStyle}>{storyError}</p> : null}
          {!areStoriesConfigured ? <p style={warningMessageStyle}>Lucky Stories is ready, but the database needs to be available before stories can be saved.</p> : null}

          <form action="/api/lucky-stories" method="POST" style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Your name
                <input name="name" type="text" minLength="2" maxLength="40" placeholder="David" required style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Where did it happen? (optional)
                <input name="location" type="text" maxLength="80" placeholder="Ontario, Canada" style={inputStyle} />
              </label>
            </div>
            <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
              Your lucky story
              <textarea name="story" minLength="20" maxLength="1500" rows={6} placeholder="Tell us where you found luck or happiness." required style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
            <label aria-hidden="true" style={{ display: 'none' }}>
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit" className="aurora-gold-button" style={{ ...checkoutButtonStyle, maxWidth: 320 }}>Share your story</button>
          </form>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Recent lucky stories</h3>
            {recentStories.length ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {recentStories.map((entry) => (
                  <article key={`${entry.display_name}-${entry.created_at}`} style={{ padding: '1rem', borderRadius: 20, background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(16, 185, 129, 0.08))', border: '1px solid rgba(255, 235, 160, 0.22)', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' }}>
                    <p style={{ marginTop: 0, lineHeight: 1.6 }}>{entry.story}</p>
                    <p style={{ marginBottom: 0, fontWeight: 700 }}>
                      — {entry.display_name}{entry.location ? `, ${entry.location}` : ''}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p>No lucky stories yet. Be the first to share where luck found you.</p>
            )}
          </div>
        </section>

        <section id="little-luck-map" className="aurora-glass-card" style={{ ...glassCardStyle, marginTop: '2rem' }}>
          <SectionKicker>Little Luck Map</SectionKicker>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0.5rem 0', letterSpacing: '-0.035em' }}>
            See where little luck is being shared
          </h2>
          <p style={{ lineHeight: 1.6, maxWidth: 680 }}>
            Purchase the $1 Lucky Pick, then add your first name and province or territory so the Canada map lights up with each place luck is shared.
          </p>

          {shared ? <p style={successMessageStyle}>Thanks for sharing a little luck.</p> : null}
          {mapError ? <p style={errorMessageStyle}>{mapError}</p> : null}
          {!isConfigured ? <p style={warningMessageStyle}>The map is ready, but the database needs to be available before entries can be saved.</p> : null}

          {canShareOnMap ? (
            <form action="/api/luck-map" method="POST" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end', marginTop: '1.5rem' }}>
              <input type="hidden" name="checkoutSessionId" value={checkoutSessionId} />
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Your name
                <input name="name" type="text" minLength="2" maxLength="40" placeholder="David" required style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Province or territory
                <select name="province" required defaultValue="" style={inputStyle}>
                  <option value="" disabled>Choose one</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>{province.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="aurora-gold-button" style={checkoutButtonStyle}>Share little luck</button>
            </form>
          ) : (
            <form action="/api/checkout" method="POST" style={{ display: 'grid', gap: '0.75rem', marginTop: '1.5rem', maxWidth: 360 }}>
              <input type="hidden" name="checkoutType" value="lucky_pick" />
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Pick type
                <select name="luckyPickGame" defaultValue="6" style={inputStyle}>
                  <option value="6">6 Pick</option>
                  <option value="7">7 Pick</option>
                </select>
              </label>
              <button type="submit" className="aurora-gold-button" style={{ ...checkoutButtonStyle, maxWidth: 320 }}>Buy $1 Lucky Pick to join the map</button>
            </form>
          )}

          <div aria-label="Canada Little Luck Map" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
            {provinces.map((province) => {
              const count = provinceCounts[province.code] || 0;

              return (
                <div key={province.code} style={{ padding: '1rem', minHeight: 78, borderRadius: 18, background: count ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.94), rgba(250, 204, 21, 0.9))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(16, 185, 129, 0.06))', border: count ? '2px solid rgba(255, 235, 160, 0.7)' : '2px solid rgba(255, 255, 255, 0.16)', boxShadow: count ? '0 0 22px rgba(16, 185, 129, 0.32)' : 'none' }}>
                  <strong style={{ display: 'block', fontSize: '1.25rem' }}>{province.code}</strong>
                  <span>{province.name}</span><br />
                  <span style={{ fontWeight: 700 }}>{count} {count === 1 ? 'share' : 'shares'}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Recent little luck shares: {totalShares}</h3>
            {recentShares.length ? (
              <ul style={{ display: 'grid', gap: '0.5rem', paddingLeft: '1.25rem' }}>
                {recentShares.map((share) => (
                  <li key={`${share.display_name}-${share.province}-${share.created_at}`}>
                    <strong>{share.display_name}</strong> shared luck from {share.province}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No shares yet. Be the first to put little luck on the map.</p>
            )}
          </div>
        </section>

        <section id="suggestion-box" className="aurora-glass-card" style={{ ...glassCardStyle, marginTop: '2rem' }}>
          <SectionKicker>Suggestion Box</SectionKicker>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0.5rem 0', letterSpacing: '-0.035em' }}>
            Help make Lucky Pick Canada better
          </h2>
          <p style={{ lineHeight: 1.6, maxWidth: 680 }}>
            Share an idea for a new feature, a smoother checkout, a better gift package, or anything that would make the site more fun to use.
          </p>

          {suggested ? <p style={successMessageStyle}>Thanks for the suggestion. I’ll review it soon.</p> : null}
          {suggestionError ? <p style={errorMessageStyle}>{suggestionError}</p> : null}

          <form action="/api/suggestions" method="POST" style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Name (optional)
                <input name="name" type="text" maxLength="40" placeholder="David" style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
                Email (optional)
                <input name="email" type="email" maxLength="120" placeholder="you@example.com" style={inputStyle} />
              </label>
            </div>
            <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700 }}>
              Your suggestion
              <textarea name="message" minLength="10" maxLength="1000" rows={5} placeholder="What would make this site better?" required style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
            <label aria-hidden="true" style={{ display: 'none' }}>
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit" className="aurora-gold-button" style={{ ...checkoutButtonStyle, maxWidth: 320 }}>Send suggestion</button>
          </form>
        </section>

        <footer style={{ marginTop: '2rem', padding: '1.25rem 0 0', borderTop: '1px solid rgba(255, 235, 160, 0.18)' }}>
          <BrandLogo size={44} textColor="#fff7d6" />
          <p style={{ margin: '0.75rem 0 0', color: 'rgba(255, 245, 203, 0.72)', lineHeight: 1.5 }}>
            Lucky Pick Canada is your home for maple clover lucky picks, gifts, stories, and a little shared luck across Canada.
          </p>
        </footer>
      </section>
    </main>
  );
}

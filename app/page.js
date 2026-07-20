import { getLuckMap, provinces } from './luck-map';
import LuckMeter from './luck-meter';
import LuckyBlackjackChallenge from './lucky-blackjack-challenge';
import LuckyRevealPopup from './lucky-reveal-popup';
import { getLuckyStories } from './lucky-stories';

export const dynamic = 'force-dynamic';

const games = [
  { name: '6 Pick', count: 6, max: 49, description: 'Six unique numbers from 1 to 49.' },
  { name: '7 Pick', count: 7, max: 50, description: 'Seven unique numbers from 1 to 50.' },
];

const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const facebookGroupUrl = 'https://www.facebook.com/share/g/1DASPZT9Cu/';

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

const premiumPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.55rem 0.9rem',
  borderRadius: 999,
  border: '1px solid rgba(255, 235, 160, 0.32)',
  background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(16, 185, 129, 0.12))',
  color: '#fff7d6',
  fontWeight: 900,
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 22px rgba(250, 204, 21, 0.12)',
};

const luckyNumberStyle = {
  display: 'inline-grid',
  placeItems: 'center',
  width: 46,
  height: 46,
  borderRadius: '50%',
  background: 'radial-gradient(circle at 32% 24%, #fff8c8 0%, #facc15 28%, #8a4f07 63%, #050d18 100%)',
  color: '#fff7d6',
  fontWeight: 950,
  border: '1px solid rgba(255, 235, 160, 0.74)',
  boxShadow: '0 0 0 2px rgba(2, 8, 23, 0.72), 0 0 24px rgba(250, 204, 21, 0.54), inset 0 2px 6px rgba(255, 255, 255, 0.42)',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.56)',
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

        @keyframes premium-section-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes maple-float {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-8deg); opacity: 0.28; }
          50% { transform: translate3d(10px, -12px, 0) rotate(7deg); opacity: 0.52; }
        }

        @keyframes premium-number-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(250,204,21,0.38)); }
          50% { filter: drop-shadow(0 0 22px rgba(255,247,214,0.72)); }
        }

        .aurora-gold-button { position: relative; overflow: hidden; }
        .aurora-gold-button::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.42) 42%, transparent 58%); transform: translateX(-120%); transition: transform 520ms ease; }
        .aurora-gold-button:hover { transform: translateY(-2px) scale(1.01); filter: saturate(1.12); box-shadow: 0 0 42px rgba(250, 204, 21, 0.74), 0 20px 46px rgba(183, 121, 31, 0.36) !important; }
        .aurora-gold-button:hover::after { transform: translateX(120%); }
        .aurora-glass-card { transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease; }
        .aurora-glass-card::before { content: ''; position: absolute; inset: 1px; border-radius: inherit; background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent 30%, rgba(16,185,129,0.08) 62%, rgba(250,204,21,0.12)); pointer-events: none; }
        .aurora-glass-card::after { content: ''; position: absolute; top: -35%; right: -30%; width: 16rem; height: 16rem; border-radius: 999px; background: radial-gradient(circle, rgba(250,204,21,0.16), transparent 66%); filter: blur(6px); pointer-events: none; }
        .aurora-glass-card > * { position: relative; z-index: 1; }
        .aurora-glass-card:hover { transform: translateY(-4px); border-color: rgba(255, 235, 160, 0.48) !important; box-shadow: 0 34px 96px rgba(0, 0, 0, 0.54), 0 0 50px rgba(16, 185, 129, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12) !important; }
        .premium-section { animation: premium-section-rise 720ms cubic-bezier(.16,.84,.28,1) both; scroll-margin-top: 1.5rem; }
        .premium-section:nth-of-type(2n) { animation-delay: 70ms; }
        .gold-text { background: linear-gradient(180deg, #fffdf0 0%, #ffe88d 20%, #facc15 52%, #9a5f10 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 34px rgba(250, 204, 21, 0.24); }
        .premium-phone { transform: rotate(6deg); transition: transform 260ms ease, box-shadow 260ms ease; }
        .premium-phone:hover { transform: rotate(3deg) translateY(-4px); }
        .premium-maple-accent { position: absolute; color: rgba(250,204,21,0.34); font-size: clamp(2rem, 7vw, 4.8rem); line-height: 1; filter: drop-shadow(0 0 20px rgba(250,204,21,0.24)); animation: maple-float 8s ease-in-out infinite; pointer-events: none; }
        .premium-lucky-number { animation: premium-number-glow 3.2s ease-in-out infinite; }
        @media (max-width: 820px) { .premium-phone { transform: none; max-width: 340px; margin: 0 auto; } main { padding-left: 1rem !important; padding-right: 1rem !important; } }
      `}</style>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.42, backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 0 1px, transparent 1.6px), radial-gradient(circle at 74% 12%, rgba(250,204,21,0.82) 0 1px, transparent 1.5px), radial-gradient(circle at 54% 62%, rgba(255,255,255,0.54) 0 1px, transparent 1.4px)', backgroundSize: '190px 190px, 260px 260px, 220px 220px' }} />
        <div style={{ position: 'absolute', top: '2%', left: '-18%', width: '105vw', height: '22rem', borderRadius: '999px', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0), rgba(20, 184, 166, 0.58), rgba(250, 204, 21, 0.34), rgba(52, 211, 153, 0.42), rgba(16, 185, 129, 0))', filter: 'blur(16px)', animation: 'aurora-drift 14s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '17%', right: '-22%', width: '88vw', height: '17rem', borderRadius: '999px', background: 'linear-gradient(90deg, rgba(16, 185, 129, 0), rgba(6, 182, 212, 0.34), rgba(52, 211, 153, 0.46), rgba(250, 204, 21, 0.26), rgba(16, 185, 129, 0))', filter: 'blur(20px)', animation: 'aurora-drift 18s ease-in-out -5s infinite alternate-reverse' }} />
        <div style={{ position: 'absolute', bottom: '-14rem', left: '6%', width: '42rem', height: '42rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(250, 204, 21, 0.16), transparent 62%)', filter: 'blur(10px)' }} />
        {[['✦', '9%', '12%', '0s'], ['✧', '82%', '10%', '0.7s'], ['✶', '72%', '32%', '1.3s'], ['✦', '16%', '44%', '1.8s'], ['✧', '90%', '64%', '2.4s'], ['✶', '35%', '76%', '3s']].map(([star, left, top, delay]) => (
          <span key={`${star}-${left}-${top}`} style={{ position: 'absolute', left, top, color: '#fde68a', textShadow: '0 0 16px rgba(250, 204, 21, 0.9)', animation: `magical-star-twinkle 3.4s ease-in-out ${delay} infinite` }}>
            {star}
          </span>
        ))}
      </div>
      <LuckyRevealPopup reveal={purchasedReveal} />
      <section style={{ maxWidth: 1040, margin: '0 auto', position: 'relative', zIndex: 1, animation: 'page-fade-in 700ms ease both' }}>
        <span className="premium-maple-accent" aria-hidden="true" style={{ top: 22, right: -18 }}>✦</span>
        <span className="premium-maple-accent" aria-hidden="true" style={{ top: 370, left: -28, animationDelay: '-3s' }}>🍁</span>
        <div style={{ marginBottom: '1rem', padding: 'clamp(1.25rem, 4vw, 2.4rem)', borderRadius: 38, border: '1px solid rgba(255, 235, 160, 0.26)', background: 'radial-gradient(circle at 86% 12%, rgba(250, 204, 21, 0.22), transparent 27%), radial-gradient(circle at 12% 16%, rgba(16, 185, 129, 0.28), transparent 31%), linear-gradient(145deg, rgba(2, 8, 23, 0.8), rgba(4, 24, 22, 0.68))', boxShadow: '0 34px 110px rgba(0, 0, 0, 0.52), 0 0 52px rgba(16, 185, 129, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(18px) saturate(135%)', overflow: 'hidden', position: 'relative' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.12), transparent 18%, transparent 72%, rgba(250,204,21,0.12)), radial-gradient(circle at 72% 76%, rgba(16,185,129,0.18), transparent 28%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(1.25rem, 5vw, 3rem)', alignItems: 'center' }}>
            <div>
              <BrandLogo size={128} textColor="#facc15" tagline="Maple clover luck, made in Canada" />
              <h1 className="gold-text" style={{ fontSize: 'clamp(2.75rem, 8vw, 5.9rem)', lineHeight: 0.92, margin: '1rem 0 0.85rem', letterSpacing: '-0.06em', maxWidth: 900 }}>
                Discover Your Lucky Pick Today!
              </h1>
              <p style={{ fontSize: 'clamp(1.08rem, 2.4vw, 1.35rem)', maxWidth: 720, lineHeight: 1.65, color: 'rgba(255, 247, 214, 0.9)', marginBottom: '1rem' }}>
                Everyone could use a little extra luck. Welcome to LuckyPick Canada — a fun Canadian experience designed to add a little excitement to your day.
              </p>
              <p style={{ fontSize: '1.02rem', maxWidth: 720, lineHeight: 1.65, color: 'rgba(255, 247, 214, 0.82)', margin: '0 0 1.15rem' }}>
                No sign-up required to enjoy the free features. Tap, play, and see where your luck takes you — or unlock your own personalized Lucky Pick for just $1 CAD.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <a href="#luck-meter-title" className="aurora-gold-button" style={{ ...checkoutButtonStyle, width: 'auto', minWidth: 220, display: 'inline-flex', justifyContent: 'center', textDecoration: 'none' }}>Try the FREE Lucky Meter</a>
                <a href="#lucky-pick-checkout" style={{ ...premiumPillStyle, minWidth: 250, textDecoration: 'none' }}>Get Your Personalized Lucky Pick – $1 CAD</a>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                <span style={premiumPillStyle}>Free Lucky Meter</span>
                <span style={premiumPillStyle}>Lucky Card Reveal</span>
                <span style={premiumPillStyle}>Blackjack mini-game</span>
                <span style={premiumPillStyle}>Lucky colour and day</span>
              </div>
            </div>
            <div className="premium-phone" aria-hidden="true" style={{ justifySelf: 'center', width: 'min(100%, 330px)', minHeight: 520, padding: '1rem', borderRadius: 42, border: '2px solid rgba(255, 235, 160, 0.58)', background: 'linear-gradient(145deg, #05070a 0%, #061611 45%, #0a0f16 100%)', boxShadow: '0 30px 70px rgba(0,0,0,0.58), 0 0 54px rgba(250,204,21,0.26), inset 0 0 0 6px rgba(255,255,255,0.035)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 10, borderRadius: 34, background: 'radial-gradient(circle at 52% 28%, rgba(16,185,129,0.42), transparent 24%), linear-gradient(160deg, rgba(1,4,3,0.2), rgba(2,8,23,0.9)), radial-gradient(circle at 80% 88%, rgba(250,204,21,0.2), transparent 22%)' }} />
              <div style={{ position: 'absolute', top: 70, left: -80, width: 430, height: 120, borderRadius: 999, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.54), rgba(250,204,21,0.3), transparent)', filter: 'blur(12px)', transform: 'rotate(-14deg)' }} />
              <div style={{ position: 'relative', display: 'grid', gap: '1rem', padding: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#facc15', fontWeight: 950 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}><img src="/file_00000000e8b8722f909e901d9b84325d.png" alt="" width="34" height="34" />LuckyPickCanada.ca</span>
                  <span style={{ fontSize: '1.35rem' }}>☰</span>
                </div>
                <div style={{ minHeight: 190, borderRadius: 26, border: '1px solid rgba(255,235,160,0.26)', background: 'radial-gradient(circle at 50% 35%, rgba(16,185,129,0.42), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.08), rgba(2,8,23,0.42))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 18px 38px rgba(0,0,0,0.32)', display: 'grid', alignContent: 'end', padding: '1rem' }}>
                  <p className="gold-text" style={{ margin: 0, fontSize: '2rem', lineHeight: 1, fontWeight: 950, textTransform: 'uppercase' }}>Your Lucky Pick</p>
                  <p style={{ margin: '0.35rem 0 0', color: '#fff7d6', fontWeight: 900 }}>Just for you</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.42rem' }}>
                  {[7, 14, 23, 31, 36, 42].map((number) => <span key={number} className="premium-lucky-number" style={{ ...luckyNumberStyle, width: 38, height: 38, fontSize: '0.92rem' }}>{String(number).padStart(2, '0')}</span>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: 18, border: '1px solid rgba(255,235,160,0.24)', background: 'rgba(255,255,255,0.07)' }}><strong style={{ color: '#facc15' }}>Lucky Day</strong><br />Friday</div>
                  <div style={{ padding: '0.75rem', borderRadius: 18, border: '1px solid rgba(255,235,160,0.24)', background: 'rgba(255,255,255,0.07)' }}><strong style={{ color: '#facc15' }}>Lucky Color</strong><br />Emerald</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', perspective: 900 }}>
                  {[
                    { name: 'Clover', symbol: '♣', background: 'radial-gradient(circle at 50% 34%, rgba(250,204,21,0.32), transparent 26%), linear-gradient(150deg, #020a08, #064e3b 50%, #030712)' },
                    { name: 'Canada', symbol: '✦', background: 'linear-gradient(90deg, #8f1118 0 26%, #fff7ed 26% 74%, #991b1b 74%), radial-gradient(circle at 50% 36%, rgba(250,204,21,0.32), transparent 24%)' },
                    { name: 'Gold', symbol: '♣', background: 'linear-gradient(115deg, #6b3d07, #facc15 30%, #fff2a8 44%, #b7791f 62%, #ffe88d 84%, #5c3307)' },
                  ].map((card) => (
                    <div key={card.name} style={{ minHeight: 108, borderRadius: 18, border: '1px solid rgba(255,247,214,0.68)', background: card.background, display: 'grid', placeItems: 'center', alignContent: 'center', gap: '0.18rem', color: '#fff7d6', fontWeight: 950, fontSize: '0.7rem', letterSpacing: 0.4, textTransform: 'uppercase', textAlign: 'center', boxShadow: '0 16px 28px rgba(0,0,0,0.36), 0 0 24px rgba(250,204,21,0.2), inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -12px 22px rgba(0,0,0,0.24)', transform: 'rotateX(6deg)', position: 'relative', overflow: 'hidden' }}>
                      <span style={{ position: 'absolute', inset: 6, borderRadius: 13, border: '1px solid rgba(255,247,214,0.34)' }} />
                      <span style={{ fontSize: '1.7rem', color: '#facc15', textShadow: '0 0 14px rgba(250,204,21,0.78)' }}>{card.symbol}</span>
                      {card.name}<br />Card
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p style={{ maxWidth: 760, lineHeight: 1.6, padding: '0.9rem 1rem', borderRadius: 16, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 235, 160, 0.24)', boxShadow: '0 0 28px rgba(250, 204, 21, 0.12)', backdropFilter: 'blur(12px)' }}>
          Entertainment purposes only: Lucky Picks, Lucky Cards, Lucky Colours, and all other features are randomly generated for fun and enjoyment. Purchasing a personalized Lucky Pick does not increase the chances of winning any lottery, contest, or game of chance.
        </p>

        <LuckMeter />

        <LuckyBlackjackChallenge />

        <section className="aurora-glass-card premium-section" style={{ ...glassCardStyle, marginTop: '2rem' }}>
          <SectionKicker>Why People Visit LuckyPick Canada</SectionKicker>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0.5rem 0', letterSpacing: '-0.035em' }}>
            Start your lucky journey
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {[
              'Fun and interactive luck-themed experiences',
              'Beautiful animations and card reveals',
              'New lucky moments every visit',
              'Built in Canada',
              'Designed for entertainment and fun',
            ].map((reason) => (
              <div key={reason} style={{ padding: '1rem', borderRadius: 18, background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(16,185,129,0.08))', border: '1px solid rgba(255, 235, 160, 0.22)', fontWeight: 800 }}>
                {reason}
              </div>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <form id="lucky-pick-checkout" action="/api/checkout" method="POST" className="aurora-glass-card premium-section" style={glassCardStyle}>
            <input type="hidden" name="checkoutType" value="lucky_pick" />
            <h2 style={{ ...sectionHeadingStyle, marginTop: 0 }}>Personalized Lucky Pick</h2>
            <p style={{ lineHeight: 1.5 }}>Unlock your own $1 CAD Lucky Pick with either a 6 Pick or 7 Pick result and no duplicate numbers.</p>
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
            <button type="submit" className="aurora-gold-button" style={checkoutButtonStyle}>Get Your Personalized Lucky Pick – $1 CAD</button>
            <p style={{ lineHeight: 1.5, marginBottom: 0 }}>After checkout, you can add your name and province to the Little Luck Map.</p>
          </form>

          <form action="/api/checkout" method="POST" className="aurora-glass-card premium-section" style={glassCardStyle}>
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

          <form action="/api/checkout" method="POST" className="aurora-glass-card premium-section" style={glassCardStyle}>
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
                    <span key={number} className="premium-lucky-number" style={luckyNumberStyle}>
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

        <section id="lucky-stories" className="aurora-glass-card premium-section" style={{ ...glassCardStyle, marginTop: '2rem' }}>
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

        <section id="little-luck-map" className="aurora-glass-card premium-section" style={{ ...glassCardStyle, marginTop: '2rem' }}>
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
                <div key={province.code} style={{ padding: '1rem', minHeight: 78, borderRadius: 20, background: count ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.96), rgba(250, 204, 21, 0.92))' : 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(16, 185, 129, 0.06))', border: count ? '2px solid rgba(255, 235, 160, 0.78)' : '2px solid rgba(255, 255, 255, 0.16)', boxShadow: count ? '0 0 28px rgba(16, 185, 129, 0.38), inset 0 1px 0 rgba(255,255,255,0.28)' : 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
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

        <section id="suggestion-box" className="aurora-glass-card premium-section" style={{ ...glassCardStyle, marginTop: '2rem' }}>
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

        <section id="facebook-community" className="aurora-glass-card premium-section" style={{ ...glassCardStyle, marginTop: '2rem', textAlign: 'center' }}>
          <SectionKicker>Community</SectionKicker>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: '0.6rem auto 0.75rem', letterSpacing: '-0.035em', maxWidth: 760 }}>
            🍀 Join the LuckyPick Canada Community
          </h2>
          <p style={{ lineHeight: 1.7, maxWidth: 720, margin: '0 auto 1.5rem', color: 'rgba(255, 247, 214, 0.9)', fontSize: '1.05rem' }}>
            Share your luck, talk about your lucky picks, and connect with other Canadians who enjoy a little extra fun and positivity.
          </p>

          <a
            href={facebookGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the LuckyPick Canada Community Facebook group in a new tab"
            style={{ display: 'block', borderRadius: 28, border: '1px solid rgba(255, 235, 160, 0.42)', overflow: 'hidden', boxShadow: '0 26px 70px rgba(0, 0, 0, 0.42), 0 0 42px rgba(250, 204, 21, 0.18)', background: 'linear-gradient(145deg, rgba(250, 204, 21, 0.12), rgba(16, 185, 129, 0.08))' }}
          >
            <img
              src="/facebook-community-cover.png"
              alt="Lucky Pick Canada Community Facebook group cover"
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
          </a>

          <a
            href={facebookGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="aurora-gold-button"
            style={{ ...checkoutButtonStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'auto', minWidth: 260, marginTop: '1.3rem', textDecoration: 'none' }}
          >
            Join the Facebook Group 🍀
          </a>
        </section>

        <footer className="premium-section" style={{ marginTop: '2rem', padding: 'clamp(1.25rem, 4vw, 2rem)', borderRadius: 30, border: '1px solid rgba(255, 235, 160, 0.24)', background: 'linear-gradient(145deg, rgba(2, 8, 23, 0.68), rgba(4, 44, 40, 0.48))', boxShadow: '0 22px 70px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden' }}>
          <span aria-hidden="true" style={{ position: 'absolute', right: '1.2rem', top: '0.8rem', color: 'rgba(250,204,21,0.26)', fontSize: '3.2rem', lineHeight: 1 }}>🍁</span>
          <BrandLogo size={44} textColor="#fff7d6" />
          <p style={{ margin: '0.9rem 0 0', color: '#fde68a', fontWeight: 950, fontSize: 'clamp(1.08rem, 3vw, 1.45rem)', lineHeight: 1.35 }}>
            Thank You For Your Support! Enjoy Your Luck! 🍀
          </p>
          <p style={{ margin: '0.75rem 0 0', color: 'rgba(255, 245, 203, 0.76)', lineHeight: 1.65, maxWidth: 860 }}>
            LuckyPickCanada.ca provides fun personalized luck experiences for entertainment purposes only. Lucky Picks, Lucky Cards, Lucky Colours, and all other features are randomly generated for fun and enjoyment, and purchases do not increase the chances of winning any lottery, contest, or game of chance.
          </p>
        </footer>
      </section>
    </main>
  );
}

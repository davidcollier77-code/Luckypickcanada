'use client';

import { useMemo, useState } from 'react';

const provinces = [
  { code: 'BC', name: 'British Columbia', leaf: '🍁', x: 7, y: 50, w: 15, h: 24 },
  { code: 'AB', name: 'Alberta', leaf: '☘', x: 21, y: 48, w: 13, h: 25 },
  { code: 'SK', name: 'Saskatchewan', leaf: '✦', x: 33, y: 49, w: 12, h: 24 },
  { code: 'MB', name: 'Manitoba', leaf: '🍁', x: 44, y: 47, w: 13, h: 25 },
  { code: 'ON', name: 'Ontario', leaf: '☘', x: 56, y: 58, w: 18, h: 19 },
  { code: 'QC', name: 'Quebec', leaf: '✦', x: 69, y: 45, w: 19, h: 22 },
  { code: 'NB', name: 'New Brunswick', leaf: '🍁', x: 82, y: 66, w: 8, h: 7 },
  { code: 'NS', name: 'Nova Scotia', leaf: '☘', x: 89, y: 71, w: 8, h: 5 },
  { code: 'PE', name: 'Prince Edward Island', leaf: '✦', x: 88, y: 66, w: 5, h: 3 },
  { code: 'NL', name: 'Newfoundland and Labrador', leaf: '🍁', x: 88, y: 39, w: 10, h: 17 },
  { code: 'YT', name: 'Yukon', leaf: '☘', x: 8, y: 22, w: 15, h: 18 },
  { code: 'NT', name: 'Northwest Territories', leaf: '✦', x: 25, y: 18, w: 25, h: 19 },
  { code: 'NU', name: 'Nunavut', leaf: '🍁', x: 52, y: 14, w: 31, h: 24 },
];

const categories = [
  'A lucky coincidence',
  'A life-changing moment',
  'A family memory',
  'A surprising discovery',
  'A mysterious lucky moment',
];

const approvedStories = [];

const pageStyle = {
  minHeight: '100vh',
  padding: '1rem 1.5rem 4rem',
  color: '#fff7d6',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  background:
    'radial-gradient(circle at 12% 10%, rgba(250, 204, 21, 0.22), transparent 28%), radial-gradient(circle at 82% 8%, rgba(16, 185, 129, 0.28), transparent 31%), radial-gradient(circle at 50% 92%, rgba(185, 28, 28, 0.16), transparent 34%), linear-gradient(135deg, #010403 0%, #020817 35%, #071225 60%, #021a18 100%)',
  overflowX: 'hidden',
  position: 'relative',
};

const cardStyle = {
  borderRadius: 30,
  border: '1px solid rgba(255, 235, 160, 0.24)',
  background: 'linear-gradient(145deg, rgba(5, 13, 24, 0.9), rgba(8, 38, 36, 0.78) 48%, rgba(7, 18, 37, 0.86))',
  boxShadow:
    '0 28px 86px rgba(0, 0, 0, 0.5), 0 0 42px rgba(16, 185, 129, 0.16), 0 0 28px rgba(250, 204, 21, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(18px) saturate(130%)',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.9rem 1rem',
  borderRadius: 16,
  border: '1px solid rgba(255, 235, 160, 0.34)',
  background: 'linear-gradient(180deg, rgba(255, 253, 239, 0.97), rgba(239, 253, 245, 0.9))',
  color: '#071225',
  fontSize: '1rem',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.72), 0 10px 24px rgba(0, 0, 0, 0.16)',
};

function getProvinceStories(provinceCode) {
  return approvedStories.filter((story) => story.province === provinceCode && story.approved);
}

function Sparkles({ activeKey }) {
  return (
    <div key={activeKey} aria-hidden="true" className="luck-sparkle-burst">
      {Array.from({ length: 12 }, (_, index) => (
        <span key={index} style={{ '--spark-index': index }}>
          ✦
        </span>
      ))}
    </div>
  );
}

export default function LuckFoundCanadaMap() {
  const [selectedProvince, setSelectedProvince] = useState('NS');
  const [status, setStatus] = useState('');
  const [sparkleKey, setSparkleKey] = useState(0);
  const province = provinces.find((item) => item.code === selectedProvince) || provinces[0];
  const selectedStories = getProvinceStories(province.code);

  const counts = useMemo(
    () =>
      provinces.reduce((summary, item) => {
        summary[item.code] = getProvinceStories(item.code).length;
        return summary;
      }, {}),
    [],
  );

  function openProvince(code) {
    setSelectedProvince(code);
    setSparkleKey((value) => value + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const story = String(formData.get('story') || '').trim();
    const selected = String(formData.get('province') || '');
    const category = String(formData.get('category') || '');
    const provinceName = provinces.find((item) => item.code === selected)?.name || selected;

    if (!selected || !category || story.length < 20) {
      setStatus('Choose a province, category, and share at least 20 characters. Exact addresses are not accepted.');
      return;
    }

    const moderationForm = new FormData();
    moderationForm.set('name', formData.get('name') || '');
    moderationForm.set(
      'message',
      [
        'Lucky community story submission for Where Luck Has Been Found in Canada',
        `Province: ${provinceName} (${selected})`,
        `Category: ${category}`,
        '',
        story,
        '',
        'Moderation note: do not publish publicly unless approved. The visitor selected a province only; no exact address was requested.',
      ].join('\n'),
    );
    moderationForm.set('website', formData.get('website') || '');

    try {
      const response = await fetch('/api/suggestions', { method: 'POST', body: moderationForm });

      if (!response.ok) {
        setStatus('This story could not be submitted right now. Please try again later.');
        return;
      }

      form.reset();
      setStatus('Thank you. Your lucky story has been submitted for moderation and will not appear publicly unless approved.');
    } catch (error) {
      setStatus('This story could not be submitted right now. Please try again later.');
    }
  }

  return (
    <main style={pageStyle}>
      <style>{`
        html { scroll-behavior: smooth; }
        .aurora-ribbon { animation: aurora-drift 10s ease-in-out infinite alternate; }
        .province-tile, .story-card, .magic-button, .home-link { transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .province-tile:hover, .province-tile:focus-visible { transform: translateY(-4px) scale(1.02); outline: none; border-color: rgba(255, 235, 160, 0.72) !important; box-shadow: 0 0 32px rgba(250, 204, 21, 0.26), 0 18px 46px rgba(0,0,0,0.34) !important; }
        .story-card:hover { transform: translateY(-3px); border-color: rgba(255,235,160,0.44) !important; }
        .magic-button:hover, .magic-button:focus-visible, .home-link:hover, .home-link:focus-visible { transform: translateY(-2px); outline: none; box-shadow: 0 18px 40px rgba(0,0,0,0.32), 0 0 30px rgba(250,204,21,0.2); }
        .map-shell::before { content: '✦'; position: absolute; left: 7%; top: 12%; color: rgba(253, 230, 138, 0.72); animation: twinkle 2.4s ease-in-out infinite; }
        .map-shell::after { content: '🍁'; position: absolute; right: 8%; bottom: 10%; filter: drop-shadow(0 0 14px rgba(250,204,21,0.4)); animation: float-maple 5s ease-in-out infinite; }
        .luck-sparkle-burst { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .luck-sparkle-burst span { position: absolute; left: calc(16% + (var(--spark-index) * 6%)); top: calc(18% + ((var(--spark-index) % 4) * 14%)); color: #fde68a; opacity: 0; animation: sparkle-pop 760ms ease-out forwards; animation-delay: calc(var(--spark-index) * 28ms); }
        @keyframes aurora-drift { from { transform: translate3d(-7%, -3%, 0) rotate(-7deg); opacity: 0.42; } to { transform: translate3d(8%, 4%, 0) rotate(6deg); opacity: 0.76; } }
        @keyframes marker-glow { 0%, 100% { transform: scale(0.9); opacity: 0.72; } 50% { transform: scale(1.18); opacity: 1; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(0.86) rotate(0deg); } 50% { opacity: 1; transform: scale(1.14) rotate(18deg); } }
        @keyframes float-maple { 0%, 100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-10px) rotate(8deg); } }
        @keyframes sparkle-pop { 0% { opacity: 0; transform: translateY(16px) scale(0.7); } 45% { opacity: 1; } 100% { opacity: 0; transform: translateY(-18px) scale(1.14); } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; } }
      `}</style>

      <div className="aurora-ribbon" aria-hidden="true" style={{ position: 'absolute', inset: '5% -10% auto', height: 180, background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.23), rgba(250, 204, 21, 0.18), rgba(59, 130, 246, 0.2), transparent)', filter: 'blur(22px)', borderRadius: '50%', transformOrigin: 'center' }} />
      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <nav aria-label="Where Luck Has Been Found navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a href="/" className="home-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff7d6', textDecoration: 'none', fontWeight: 950, padding: '0.55rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.26)', background: 'rgba(1, 4, 3, 0.54)' }}>
            <img src="/file_00000000e8b8722f909e901d9b84325d.png" alt="" width="34" height="34" style={{ borderRadius: 10, filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.35))' }} />
            LuckyPickCanada.ca
          </a>
          <a href="#share-your-luck-story" className="magic-button" style={{ color: '#06110d', textDecoration: 'none', fontWeight: 950, padding: '0.75rem 1.05rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}>
            Share Your Luck Story
          </a>
        </nav>

        <header style={{ ...cardStyle, padding: 'clamp(1.35rem, 4vw, 3rem)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>Lucky Community Archive</p>
          <h1 style={{ maxWidth: 900, margin: '0.45rem 0', fontSize: 'clamp(2.5rem, 8vw, 5.5rem)', lineHeight: 0.95, letterSpacing: '-0.06em', textShadow: '0 0 28px rgba(250,204,21,0.22)' }}>
            Where Luck Has Been Found in Canada 🍀
          </h1>
          <p style={{ maxWidth: 760, margin: '1rem 0 0', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.7, color: 'rgba(255, 247, 214, 0.86)' }}>
            Explore a living Canadian collection of lucky memories, family moments, surprising discoveries, and beautiful coincidences. Stories are grouped by province only, never exact addresses or private locations.
          </p>
          <p style={{ display: 'inline-flex', margin: '1.25rem 0 0', padding: '0.65rem 0.9rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.28)', background: 'rgba(250,204,21,0.12)', fontWeight: 850 }}>
            Entertainment and community storytelling only. No guarantee of luck and not a lottery feature.
          </p>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="map-shell" style={{ ...cardStyle, padding: 'clamp(1rem, 3vw, 2rem)', position: 'relative', overflow: 'hidden', minHeight: 470 }}>
            <Sparkles activeKey={sparkleKey} />
            <div aria-label="Canada province story map" style={{ position: 'relative', minHeight: 430, borderRadius: 28, overflow: 'hidden', background: 'radial-gradient(circle at 50% 30%, rgba(34,197,94,0.18), transparent 36%), linear-gradient(180deg, rgba(15,23,42,0.54), rgba(3,7,18,0.26))', border: '1px solid rgba(255,255,255,0.1)' }}>
              {provinces.map((item) => {
                const count = counts[item.code] || 0;
                const active = item.code === selectedProvince;

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => openProvince(item.code)}
                    className="province-tile"
                    aria-pressed={active}
                    aria-label={`${item.name}. Lucky stories found here: ${count}`}
                    style={{
                      position: 'absolute',
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${item.w}%`,
                      height: `${item.h}%`,
                      minWidth: 54,
                      minHeight: 44,
                      cursor: 'pointer',
                      color: active ? '#06110d' : '#fff7d6',
                      borderRadius: item.code.length === 2 ? '35% 42% 38% 45%' : 22,
                      border: active ? '2px solid rgba(255,248,200,0.92)' : '1px solid rgba(255,235,160,0.28)',
                      background: active
                        ? 'linear-gradient(135deg, #fff8c8, #facc15 48%, #16a34a)'
                        : count
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(250,204,21,0.78))'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(16,185,129,0.08))',
                      boxShadow: count
                        ? '0 0 30px rgba(250,204,21,0.36), 0 0 22px rgba(16,185,129,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: 'clamp(0.82rem, 1.7vw, 1.08rem)' }}>{item.code}</strong>
                    <span aria-hidden="true" style={{ display: 'block', fontSize: '0.78rem' }}>{item.leaf}</span>
                    {count ? (
                      <span aria-hidden="true" style={{ position: 'absolute', right: 7, top: 7, width: 12, height: 12, borderRadius: '50%', background: '#fde68a', boxShadow: '0 0 18px #facc15', animation: 'marker-glow 1.8s ease-in-out infinite' }} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <aside style={{ ...cardStyle, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>{province.name} {province.leaf}</p>
            <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(1.85rem, 4vw, 3rem)', lineHeight: 1 }}>
              Lucky stories found here: {selectedStories.length}
            </h2>
            <p style={{ lineHeight: 1.65, color: 'rgba(255,247,214,0.82)' }}>
              Click any province or territory to open its approved community stories. New submissions stay private until reviewed.
            </p>
            <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
              {selectedStories.length ? (
                selectedStories.map((story) => (
                  <article key={story.id} className="story-card" style={{ padding: '1rem', borderRadius: 22, border: '1px solid rgba(255,235,160,0.22)', background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(16,185,129,0.08))' }}>
                    <p style={{ margin: 0, color: '#facc15', fontWeight: 900 }}>{story.category}</p>
                    <p style={{ lineHeight: 1.6 }}>{story.story}</p>
                    <p style={{ marginBottom: 0, fontWeight: 800 }}>— {story.firstName || 'A Lucky Canadian'}</p>
                  </article>
                ))
              ) : (
                <div style={{ padding: '1rem', borderRadius: 22, border: '1px dashed rgba(255,235,160,0.32)', background: 'rgba(255,255,255,0.06)' }}>
                  No approved stories are public here yet. Share a province-only memory and it can be reviewed for this archive.
                </div>
              )}
            </div>
          </aside>
        </section>

        <section id="share-your-luck-story" style={{ ...cardStyle, marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Share Your Luck Story</p>
          <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.04em' }}>Add to the Lucky Community</h2>
          <p style={{ maxWidth: 760, lineHeight: 1.65, color: 'rgba(255,247,214,0.84)' }}>
            Submit a first name if you want, choose a province only, pick a category, and tell the story. The form does not ask for addresses, exact places, payment details, accounts, or private location data.
          </p>
          {status ? <p role="status" style={{ padding: '0.9rem 1rem', borderRadius: 16, border: '1px solid rgba(52,211,153,0.34)', background: 'rgba(16,185,129,0.16)', color: '#d1fae5', fontWeight: 800 }}>{status}</p> : null}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.45rem', fontWeight: 800 }}>
                First name (optional)
                <input name="name" type="text" maxLength="40" placeholder="David" style={inputStyle} />
              </label>
              <label style={{ display: 'grid', gap: '0.45rem', fontWeight: 800 }}>
                Province or territory
                <select name="province" required defaultValue="" style={inputStyle}>
                  <option value="" disabled>Choose one</option>
                  {provinces.map((item) => (
                    <option key={item.code} value={item.code}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '0.45rem', fontWeight: 800 }}>
                Story category
                <select name="category" required defaultValue="" style={inputStyle}>
                  <option value="" disabled>Choose one</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ display: 'grid', gap: '0.45rem', fontWeight: 800 }}>
              Lucky story
              <textarea name="story" minLength="20" maxLength="700" rows={6} required placeholder="Tell us about a memorable lucky moment, coincidence, discovery, family memory, or mysterious bit of good fortune." style={{ ...inputStyle, resize: 'vertical' }} />
            </label>
            <label aria-hidden="true" style={{ display: 'none' }}>
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
            <button type="submit" className="magic-button" style={{ justifySelf: 'start', cursor: 'pointer', color: '#06110d', fontSize: '1rem', fontWeight: 950, padding: '0.95rem 1.25rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #f9d86c 22%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}>
              Share Your Luck Story
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

'use client';

import { useMemo, useState } from 'react';

const provinces = [
  { code: 'BC', name: 'British Columbia', x: 10, y: 52 },
  { code: 'AB', name: 'Alberta', x: 25, y: 54 },
  { code: 'SK', name: 'Saskatchewan', x: 37, y: 55 },
  { code: 'MB', name: 'Manitoba', x: 49, y: 54 },
  { code: 'ON', name: 'Ontario', x: 61, y: 66 },
  { code: 'QC', name: 'Quebec', x: 75, y: 52 },
  { code: 'NB', name: 'New Brunswick', x: 84, y: 70 },
  { code: 'NS', name: 'Nova Scotia', x: 90, y: 75 },
  { code: 'PE', name: 'Prince Edward Island', x: 88, y: 68 },
  { code: 'NL', name: 'Newfoundland and Labrador', x: 91, y: 43 },
  { code: 'YT', name: 'Yukon', x: 13, y: 27 },
  { code: 'NT', name: 'Northwest Territories', x: 32, y: 25 },
  { code: 'NU', name: 'Nunavut', x: 58, y: 21 },
];

const pageStyle = {
  minHeight: '100vh',
  padding: '1rem 1.5rem 4rem',
  color: '#fff7d6',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  background: 'radial-gradient(circle at 12% 10%, rgba(250, 204, 21, 0.22), transparent 28%), radial-gradient(circle at 82% 8%, rgba(16, 185, 129, 0.28), transparent 31%), radial-gradient(circle at 50% 92%, rgba(185, 28, 28, 0.16), transparent 34%), linear-gradient(135deg, #010403 0%, #020817 35%, #071225 60%, #021a18 100%)',
  overflowX: 'hidden',
  position: 'relative',
};

const cardStyle = {
  borderRadius: 30,
  border: '1px solid rgba(255, 235, 160, 0.24)',
  background: 'linear-gradient(145deg, rgba(5, 13, 24, 0.9), rgba(8, 38, 36, 0.78) 48%, rgba(7, 18, 37, 0.86))',
  boxShadow: '0 28px 86px rgba(0, 0, 0, 0.5), 0 0 42px rgba(16, 185, 129, 0.16), 0 0 28px rgba(250, 204, 21, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(18px) saturate(130%)',
};

function provinceStories(stories, provinceCode) {
  return stories.filter((story) => story.province === provinceCode);
}

export default function LuckyMapOfCanada({ mapData }) {
  const stories = mapData?.stories || [];
  const provinceCounts = mapData?.provinceCounts || {};
  const firstStoryProvince = stories[0]?.province || 'ON';
  const [selectedProvince, setSelectedProvince] = useState(firstStoryProvince);
  const [selectedStoryId, setSelectedStoryId] = useState(stories[0]?.id || '');
  const selectedProvinceInfo = provinces.find((province) => province.code === selectedProvince) || provinces[4];
  const selectedStories = provinceStories(stories, selectedProvince);
  const selectedStory = selectedStories.find((story) => story.id === selectedStoryId) || selectedStories[0] || null;

  const provinceSelections = useMemo(
    () => provinces.map((province) => ({ ...province, count: provinceCounts[province.code] || 0 })),
    [provinceCounts],
  );

  function selectProvince(provinceCode) {
    setSelectedProvince(provinceCode);
    setSelectedStoryId(provinceStories(stories, provinceCode)[0]?.id || '');
  }

  return (
    <main style={pageStyle}>
      <style>{`
        html { scroll-behavior: smooth; }
        .home-link, .story-link, .province-marker, .province-select-card { transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease; }
        .home-link:hover, .home-link:focus-visible, .story-link:hover, .story-link:focus-visible, .province-marker:hover, .province-marker:focus-visible, .province-select-card:hover, .province-select-card:focus-visible { transform: translateY(-2px); outline: none; filter: saturate(1.12); }
        .map-panel::before { content: ''; position: absolute; inset: 8% 6% 10% 4%; border-radius: 52% 48% 42% 58% / 42% 40% 60% 58%; background: radial-gradient(circle at 18% 38%, rgba(34,197,94,0.26), transparent 16%), radial-gradient(circle at 42% 26%, rgba(250,204,21,0.2), transparent 20%), radial-gradient(circle at 69% 42%, rgba(16,185,129,0.22), transparent 22%), radial-gradient(circle at 84% 58%, rgba(250,204,21,0.18), transparent 14%), linear-gradient(145deg, rgba(21,128,61,0.42), rgba(15,118,110,0.22)); border: 1px solid rgba(255,235,160,0.18); filter: drop-shadow(0 0 44px rgba(16,185,129,0.22)); clip-path: polygon(5% 43%, 13% 24%, 25% 18%, 38% 12%, 55% 17%, 70% 13%, 86% 25%, 95% 43%, 87% 59%, 77% 62%, 70% 80%, 58% 74%, 45% 84%, 33% 72%, 20% 77%, 12% 61%); }
        .map-panel::after { content: 'Canada story map'; position: absolute; right: 7%; top: 8%; color: rgba(253,230,138,0.84); font-weight: 950; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.75rem; }
        .province-marker { position: absolute; display: grid; place-items: center; min-width: clamp(46px, 5vw, 68px); min-height: clamp(42px, 4.8vw, 62px); padding: 0.45rem; border-radius: 20px; border: 1px solid rgba(255, 242, 180, 0.62); color: #fff7d6; background: linear-gradient(145deg, rgba(6,78,59,0.96), rgba(16,185,129,0.78)); box-shadow: 0 0 22px rgba(16,185,129,0.24), inset 0 2px 6px rgba(255,255,255,0.16); cursor: pointer; font-size: clamp(0.9rem, 2vw, 1.2rem); font-weight: 950; z-index: 2; }
        .province-marker.has-stories { color: #052e1c; background: radial-gradient(circle at 30% 20%, #fff8c8 0%, #facc15 35%, #22c55e 68%, #064e3b 100%); box-shadow: 0 0 32px rgba(250,204,21,0.55), 0 0 28px rgba(16,185,129,0.42), inset 0 2px 6px rgba(255,255,255,0.48); }
        .province-marker.is-active { border-color: rgba(255,248,200,0.92); box-shadow: 0 0 0 5px rgba(255,248,200,0.16), 0 0 48px rgba(250,204,21,0.78), 0 0 34px rgba(52,211,153,0.62); }
        .province-marker .marker-count { position: absolute; right: -0.2rem; top: -0.35rem; min-width: 1.45rem; height: 1.45rem; display: grid; place-items: center; padding: 0 0.28rem; border-radius: 999px; color: #fff7d6; background: #064e3b; border: 1px solid rgba(253,230,138,0.72); font-size: 0.76rem; font-weight: 950; box-shadow: 0 0 18px rgba(250,204,21,0.42); }
        .province-marker .marker-sparkle { position: absolute; inset: -0.35rem; border-radius: inherit; border: 1px solid rgba(253,230,138,0.38); animation: marker-pulse 1.9s ease-in-out infinite; }
        @keyframes marker-pulse { 0%, 100% { transform: scale(0.86); opacity: 0.35; } 50% { transform: scale(1.24); opacity: 0.95; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.35; transform: scale(0.82) rotate(0deg); } 50% { opacity: 1; transform: scale(1.18) rotate(18deg); } }
        @keyframes aurora-drift { from { transform: translate3d(-8%, -2%, 0) rotate(-7deg); opacity: 0.42; } to { transform: translate3d(8%, 3%, 0) rotate(6deg); opacity: 0.76; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; } }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: '5% -10% auto', height: 180, background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.23), rgba(250, 204, 21, 0.18), rgba(59, 130, 246, 0.2), transparent)', filter: 'blur(22px)', borderRadius: '50%', transformOrigin: 'center', animation: 'aurora-drift 10s ease-in-out infinite alternate' }} />

      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <nav aria-label="Lucky Map navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a href="/" className="home-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff7d6', textDecoration: 'none', fontWeight: 950, padding: '0.55rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.26)', background: 'rgba(1, 4, 3, 0.54)' }}>
            <img src="/file_00000000e8b8722f909e901d9b84325d.png" alt="LuckyPickCanada logo with maple leaf" width="34" height="34" style={{ borderRadius: 10, filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.35))' }} />
            LuckyPickCanada.ca
          </a>
          <a href="/#lucky-stories" className="story-link" style={{ color: '#06110d', textDecoration: 'none', fontWeight: 950, padding: '0.75rem 1.05rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}>
            View Lucky Community Stories
          </a>
        </nav>

        <header style={{ ...cardStyle, padding: 'clamp(1.35rem, 4vw, 3rem)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>Lucky Map of Canada</p>
          <h1 style={{ maxWidth: 900, margin: '0.45rem 0', fontSize: 'clamp(2.5rem, 8vw, 5.4rem)', lineHeight: 0.95, letterSpacing: '-0.06em', textShadow: '0 0 28px rgba(250,204,21,0.22)' }}>
            Where Luck Has Been Found Across Canada 🍀
          </h1>
          <p style={{ maxWidth: 760, margin: '1rem 0 0', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.7, color: 'rgba(255, 247, 214, 0.86)' }}>
            A living map powered by the existing Lucky Community stories. Approved stories with a province or territory in the story location automatically light up the map.
          </p>
          {!mapData?.isConfigured ? (
            <p style={{ margin: '1rem 0 0', padding: '0.85rem 1rem', borderRadius: 16, background: 'rgba(250, 204, 21, 0.14)', color: '#fde68a', border: '1px solid rgba(250, 204, 21, 0.32)', fontWeight: 800 }}>
              The Lucky Stories database needs to be available before the map can load community stories.
            </p>
          ) : null}
        </header>

        <section aria-label="Lucky Map statistics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem', marginTop: '1rem' }}>
          {[
            ['Total lucky stories shared', mapData?.totalStories || 0],
            ['Provinces with lucky moments', mapData?.provincesWithStories || 0],
            ['Mapped story markers', stories.length],
          ].map(([label, value]) => (
            <div key={label} style={{ ...cardStyle, padding: '1rem' }}>
              <p style={{ margin: 0, color: '#facc15', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '0.78rem' }}>{label}</p>
              <strong style={{ display: 'block', marginTop: '0.35rem', fontSize: 'clamp(2rem, 6vw, 3.2rem)', lineHeight: 1 }}>{value}</strong>
            </div>
          ))}
        </section>

        <section aria-label="LuckyPickCanada lucky stories map" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(min(100%, 340px), 0.75fr)', gap: '1rem', marginTop: '1rem' }}>
          <div className="map-panel" style={{ ...cardStyle, minHeight: 560, padding: '1rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 460, padding: '0.9rem 1rem', borderRadius: 22, background: 'rgba(2,8,23,0.58)', border: '1px solid rgba(255,235,160,0.22)', lineHeight: 1.55 }}>
              <strong style={{ color: '#fde68a' }}>Click a province or territory</strong><br />
              Select an area on the Canada story map to see Lucky Stories shared from that part of Canada.
            </div>
            {provinceSelections.map((province) => {
              const provinceCount = provinceCounts[province.code] || 0;
              const active = selectedProvince === province.code;

              return (
                <button
                  key={province.code}
                  type="button"
                  className={`province-marker ${provinceCount ? 'has-stories' : ''} ${active ? 'is-active' : ''}`}
                  onClick={() => selectProvince(province.code)}
                  aria-label={`${province.name}: ${provinceCount} ${provinceCount === 1 ? 'lucky story' : 'lucky stories'}`}
                  aria-pressed={active}
                  style={{ left: `${province.x}%`, top: `${province.y}%` }}
                >
                  {provinceCount ? <span className="marker-sparkle" aria-hidden="true" /> : null}
                  <span>{province.code}</span>
                  {provinceCount ? <span className="marker-count">{provinceCount}</span> : null}
                </button>
              );
            })}
            {!stories.length ? (
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '16rem auto 0', padding: '1rem', borderRadius: 24, border: '1px dashed rgba(255,235,160,0.34)', background: 'rgba(2,8,23,0.58)', textAlign: 'center', lineHeight: 1.65 }}>
                No community stories with a province are ready for the map yet. Stories submitted in the existing Lucky Stories section will appear here automatically when their location includes a Canadian province or territory.
              </div>
            ) : null}
          </div>

          <aside style={{ ...cardStyle, padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>{selectedProvinceInfo.name}</p>
            <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(1.85rem, 4vw, 3rem)', lineHeight: 1 }}>
              {selectedStories.length} {selectedStories.length === 1 ? 'lucky story' : 'lucky stories'}
            </h2>
            {selectedStories.length ? (
              <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
                {selectedStories.map((story) => (
                  <article key={story.id} style={{ padding: '1rem', borderRadius: 22, border: selectedStory?.id === story.id ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(16,185,129,0.08))' }}>
                    <button type="button" onClick={() => setSelectedStoryId(story.id)} style={{ padding: 0, border: 0, background: 'transparent', color: '#facc15', fontWeight: 900, cursor: 'pointer', textAlign: 'left' }}>
                      Story from {story.firstName || 'a Lucky Canadian'}
                    </button>
                    <p style={{ lineHeight: 1.65 }}>{selectedStory?.id === story.id ? story.story : story.preview}</p>
                    {selectedStory?.id !== story.id ? (
                      <button type="button" onClick={() => setSelectedStoryId(story.id)} style={{ padding: 0, border: 0, background: 'transparent', color: '#fde68a', fontWeight: 900, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}>
                        View full lucky story
                      </button>
                    ) : null}
                    <p style={{ margin: 0, fontWeight: 850 }}>
                      {story.firstName ? `— ${story.firstName}, ` : '— '}{story.provinceName}
                    </p>
                  </article>
                ))}
                <a href="/#lucky-stories" className="story-link" style={{ display: 'inline-flex', width: 'fit-content', color: '#06110d', textDecoration: 'none', fontWeight: 950, padding: '0.75rem 1rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}>
                  Share or view Lucky Stories
                </a>
              </div>
            ) : (
              <p style={{ lineHeight: 1.65, color: 'rgba(255,247,214,0.82)' }}>No Lucky Stories have been shared from {selectedProvinceInfo.name} yet. Select another province or share a story from the Lucky Stories section.</p>
            )}
          </aside>
        </section>

        <section style={{ ...cardStyle, marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Province selection</p>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1 }}>Lucky Stories by province</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {provinceSelections.map((province) => (
              <button key={province.code} type="button" className="province-select-card" onClick={() => selectProvince(province.code)} style={{ textAlign: 'left', padding: '0.9rem', borderRadius: 18, border: selectedProvince === province.code ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', color: '#fff7d6', background: selectedProvince === province.code ? 'linear-gradient(135deg, rgba(250,204,21,0.3), rgba(16,185,129,0.22))' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <strong style={{ display: 'block', color: '#fde68a' }}>{province.name}</strong>
                <span>{province.count} {province.count === 1 ? 'story' : 'stories'}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

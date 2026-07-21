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

  const storyStats = useMemo(
    () => provinces.map((province) => ({ ...province, count: provinceCounts[province.code] || 0 })).filter((province) => province.count > 0),
    [provinceCounts],
  );

  return (
    <main style={pageStyle}>
      <style>{`
        html { scroll-behavior: smooth; }
        .home-link, .story-link, .province-marker { transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease; }
        .home-link:hover, .home-link:focus-visible, .story-link:hover, .story-link:focus-visible, .province-marker:hover, .province-marker:focus-visible { transform: translateY(-2px); outline: none; filter: saturate(1.12); }
        .map-panel::before { content: ''; position: absolute; inset: 7% 8%; border-radius: 44% 56% 46% 54%; background: radial-gradient(circle at 25% 35%, rgba(16,185,129,0.22), transparent 20%), radial-gradient(circle at 72% 44%, rgba(250,204,21,0.2), transparent 22%), linear-gradient(145deg, rgba(21,128,61,0.38), rgba(15,118,110,0.18)); border: 1px solid rgba(255,235,160,0.16); filter: drop-shadow(0 0 44px rgba(16,185,129,0.2)); }
        .map-panel::after { content: '✦'; position: absolute; right: 11%; top: 13%; color: rgba(253,230,138,0.84); animation: twinkle 2.4s ease-in-out infinite; }
        .province-marker { position: absolute; display: grid; place-items: center; width: clamp(42px, 5vw, 62px); height: clamp(42px, 5vw, 62px); border-radius: 999px; border: 1px solid rgba(255, 242, 180, 0.82); color: #052e1c; background: radial-gradient(circle at 30% 20%, #fff8c8 0%, #facc15 30%, #22c55e 62%, #064e3b 100%); box-shadow: 0 0 32px rgba(250,204,21,0.55), 0 0 28px rgba(16,185,129,0.42), inset 0 2px 6px rgba(255,255,255,0.48); cursor: pointer; font-size: clamp(1.25rem, 2.8vw, 1.75rem); }
        .province-marker.is-active { box-shadow: 0 0 0 5px rgba(255,248,200,0.16), 0 0 48px rgba(250,204,21,0.78), 0 0 34px rgba(52,211,153,0.62); }
        .province-marker .marker-count { position: absolute; right: -0.2rem; top: -0.35rem; min-width: 1.45rem; height: 1.45rem; display: grid; place-items: center; padding: 0 0.28rem; border-radius: 999px; color: #fff7d6; background: #064e3b; border: 1px solid rgba(253,230,138,0.72); font-size: 0.76rem; font-weight: 950; box-shadow: 0 0 18px rgba(250,204,21,0.42); }
        .province-marker .marker-sparkle { position: absolute; inset: -0.45rem; border-radius: inherit; border: 1px solid rgba(253,230,138,0.52); animation: marker-pulse 1.9s ease-in-out infinite; }
        .province-marker .marker-twinkle { position: absolute; left: -0.35rem; bottom: -0.25rem; color: #fde68a; text-shadow: 0 0 14px rgba(250,204,21,0.8); animation: twinkle 1.7s ease-in-out infinite; }
        @keyframes marker-pulse { 0%, 100% { transform: scale(0.86); opacity: 0.35; } 50% { transform: scale(1.24); opacity: 0.95; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.35; transform: scale(0.82) rotate(0deg); } 50% { opacity: 1; transform: scale(1.18) rotate(18deg); } }
        @keyframes aurora-drift { from { transform: translate3d(-8%, -2%, 0) rotate(-7deg); opacity: 0.42; } to { transform: translate3d(8%, 3%, 0) rotate(6deg); opacity: 0.76; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; } }
      `}</style>

      <div aria-hidden="true" style={{ position: 'absolute', inset: '5% -10% auto', height: 180, background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.23), rgba(250, 204, 21, 0.18), rgba(59, 130, 246, 0.2), transparent)', filter: 'blur(22px)', borderRadius: '50%', transformOrigin: 'center', animation: 'aurora-drift 10s ease-in-out infinite alternate' }} />

      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <nav aria-label="Lucky Map navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a href="/" className="home-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff7d6', textDecoration: 'none', fontWeight: 950, padding: '0.55rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.26)', background: 'rgba(1, 4, 3, 0.54)' }}>
            <img src="/file_00000000e8b8722f909e901d9b84325d.png" alt="" width="34" height="34" style={{ borderRadius: 10, filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.35))' }} />
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
            A living map powered by the existing Lucky Community stories. Approved stories with a province in the story location automatically light up the map.
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

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(min(100%, 320px), 0.75fr)', gap: '1rem', marginTop: '1rem' }}>
          <div className="map-panel" style={{ ...cardStyle, minHeight: 560, padding: '1rem', position: 'relative', overflow: 'hidden' }}>
            {stories.map((story, index) => {
              const province = provinces.find((item) => item.code === story.province);

              if (!province) {
                return null;
              }

              const provinceCount = provinceCounts[province.code] || 0;
              const siblingIndex = provinceStories(stories.slice(0, index + 1), province.code).length - 1;
              const xOffset = provinceCount > 1 ? ((siblingIndex % 3) - 1) * 2.2 : 0;
              const yOffset = provinceCount > 1 ? (Math.floor(siblingIndex / 3) % 3) * 2.4 : 0;
              const active = selectedStory?.id === story.id;

              return (
                <button
                  key={story.id}
                  type="button"
                  className={`province-marker ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedProvince(province.code);
                    setSelectedStoryId(story.id);
                  }}
                  aria-label={`${province.name}: lucky story preview from ${story.firstName || 'a Lucky Canadian'}`}
                  aria-pressed={active}
                  style={{ left: `${province.x + xOffset}%`, top: `${province.y + yOffset}%` }}
                >
                  <span className="marker-sparkle" aria-hidden="true" />
                  <span aria-hidden="true">☘</span>
                  {provinceCount > 1 ? <span className="marker-count">{provinceCount}</span> : null}
                  <span className="marker-twinkle" aria-hidden="true">✦</span>
                </button>
              );
            })}
            {!stories.length ? (
              <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '10rem auto 0', padding: '1rem', borderRadius: 24, border: '1px dashed rgba(255,235,160,0.34)', background: 'rgba(2,8,23,0.58)', textAlign: 'center', lineHeight: 1.65 }}>
                No approved community stories with a province are ready for the map yet. Stories submitted in the existing Lucky Community section will appear here automatically when their location includes a Canadian province or territory.
              </div>
            ) : null}
          </div>

          <aside style={{ ...cardStyle, padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>{selectedProvinceInfo.name}</p>
            <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(1.85rem, 4vw, 3rem)', lineHeight: 1 }}>
              {selectedStories.length} {selectedStories.length === 1 ? 'lucky moment' : 'lucky moments'}
            </h2>
            {selectedStory ? (
              <article style={{ marginTop: '1rem', padding: '1rem', borderRadius: 22, border: '1px solid rgba(255,235,160,0.24)', background: 'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(16,185,129,0.08))' }}>
                <p style={{ margin: 0, color: '#facc15', fontWeight: 900 }}>Story preview</p>
                <p style={{ lineHeight: 1.65 }}>{selectedStory.preview}</p>
                <p style={{ margin: 0, fontWeight: 850 }}>
                  {selectedStory.firstName ? `— ${selectedStory.firstName}, ` : '— '}{selectedStory.provinceName}
                </p>
                <a href="/#lucky-stories" className="story-link" style={{ display: 'inline-flex', marginTop: '1rem', color: '#06110d', textDecoration: 'none', fontWeight: 950, padding: '0.75rem 1rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}>
                  View full story in Lucky Community
                </a>
              </article>
            ) : (
              <p style={{ lineHeight: 1.65, color: 'rgba(255,247,214,0.82)' }}>Select a glowing clover marker to preview a community story from that province.</p>
            )}
          </aside>
        </section>

        <section style={{ ...cardStyle, marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Stories by province</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {storyStats.length ? storyStats.map((province) => (
              <button key={province.code} type="button" onClick={() => { setSelectedProvince(province.code); setSelectedStoryId(provinceStories(stories, province.code)[0]?.id || ''); }} style={{ textAlign: 'left', padding: '0.9rem', borderRadius: 18, border: '1px solid rgba(255,235,160,0.24)', color: '#fff7d6', background: selectedProvince === province.code ? 'linear-gradient(135deg, rgba(250,204,21,0.3), rgba(16,185,129,0.22))' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <strong style={{ display: 'block', color: '#fde68a' }}>{province.name}</strong>
                <span>{province.count} {province.count === 1 ? 'story' : 'stories'}</span>
              </button>
            )) : <p style={{ margin: 0 }}>No province counts are available yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

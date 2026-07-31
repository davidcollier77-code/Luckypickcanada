'use client';

import Image from 'next/image';
import TurnstileField from '../turnstile-field';
import { DEFAULT_THEME } from '../../themes/default/theme';
import { DEFAULT_MAP_THEME } from '../../themes/default/map-theme';

import { useEffect, useMemo, useState } from 'react';

const provinces = [
  { code: 'YT', name: 'Yukon', x: 14, y: 30 },
  { code: 'NT', name: 'Northwest Territories', x: 32, y: 27 },
  { code: 'NU', name: 'Nunavut', x: 46, y: 15 },
  { code: 'BC', name: 'British Columbia', x: 16, y: 58 },
  { code: 'AB', name: 'Alberta', x: 29, y: 61 },
  { code: 'SK', name: 'Saskatchewan', x: 39, y: 62 },
  { code: 'MB', name: 'Manitoba', x: 49, y: 64 },
  { code: 'ON', name: 'Ontario', x: 60, y: 71 },
  { code: 'QC', name: 'Quebec', x: 74, y: 57 },
  { code: 'NB', name: 'New Brunswick', x: 77, y: 75 },
  { code: 'PE', name: 'Prince Edward Island', x: 80.5, y: 72.5 },
  { code: 'NS', name: 'Nova Scotia', x: 81.5, y: 78 },
  { code: 'NL', name: 'Newfoundland and Labrador', x: 87.5, y: 61.5 },
];

const { pageStyle, cardStyle } = DEFAULT_MAP_THEME;

function provinceStories(stories, provinceCode) {
  return stories.filter((story) => story.province === provinceCode);
}

export default function LuckyMapOfCanada({ mapData }) {
  const [liveMapData, setLiveMapData] = useState(mapData);
  const currentMapData = liveMapData || mapData;
  const stories = currentMapData?.stories || [];
  const provinceCounts = currentMapData?.provinceCounts || {};
  const firstStoryProvince = stories[0]?.province || 'ON';
  const [selectedProvince, setSelectedProvince] = useState(firstStoryProvince);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [reactions, setReactions] = useState({});
  const selectedProvinceInfo = provinces.find((province) => province.code === selectedProvince) || provinces[4];
  const selectedStories = provinceStories(stories, selectedProvince);
  const selectedStory = selectedStoryId ? selectedStories.find((story) => story.id === selectedStoryId) || null : null;
  const recentStoriesByProvince = useMemo(() => stories.reduce((groups, story) => {
    (groups[story.province] ||= []).push(story);
    return groups;
  }, {}), [stories]);

  const provinceSelections = useMemo(
    () => provinces.map((province) => ({ ...province, count: provinceCounts[province.code] ?? 0 })),
    [provinceCounts],
  );

  useEffect(() => {
    setLiveMapData(mapData);
  }, [mapData]);

  useEffect(() => {
    let isActive = true;

    async function refreshMapData() {
      try {
        const response = await fetch('/api/lucky-stories', { cache: 'no-store' });

        if (!response.ok) return;

        const nextMapData = await response.json();

        if (isActive && nextMapData.isConfigured) {
          setLiveMapData(nextMapData);
        }
      } catch {
        // Keep the server-rendered map values visible until the next refresh succeeds.
      }
    }

    const interval = window.setInterval(refreshMapData, 60_000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storyId = new URLSearchParams(window.location.search).get('story');
    const linkedStory = stories.find((story) => story.id === storyId);

    if (linkedStory) {
      setSelectedProvince(linkedStory.province);
      setSelectedStoryId(linkedStory.id);
    }
  }, [stories]);

  function storyUrl(storyId) {
    if (typeof window === 'undefined') return '/lucky-map-of-canada';

    const url = new URL(window.location.href);
    url.pathname = '/lucky-map-of-canada';
    url.searchParams.set('story', storyId);
    url.hash = 'lucky-story-map';
    return url.toString();
  }

  function selectProvince(provinceCode) {
    setSelectedProvince(provinceCode);
    setSelectedStoryId('');
    setShareStatus('');
  }

  function openStory(story) {
    setSelectedProvince(story.province);
    setSelectedStoryId(story.id);
    setShareStatus('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = '/lucky-map-of-canada';
      url.searchParams.set('story', story.id);
      url.hash = 'lucky-story-map';
      window.history.replaceState(null, '', url);
    }
  }

  function reactToStory(storyId) {
    setReactions((current) => ({ ...current, [storyId]: (current[storyId] || 0) + 1 }));
  }

  function returnToMap() {
    setSelectedStoryId('');
    setShareStatus('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.pathname = '/lucky-map-of-canada';
      url.searchParams.delete('story');
      url.hash = 'lucky-story-map';
      window.history.replaceState(null, '', url);
    }
  }

  async function shareStory(story) {
    const url = storyUrl(story.id);
    const shareData = {
      title: `Lucky story from ${story.firstName || story.provinceName}`,
      text: story.preview || 'Explore this LuckyPickCanada community story.',
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Share menu opened.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareStatus('Native sharing is unavailable, so the story link was copied.');
        return;
      }

      window.prompt('Copy this Lucky Story link:', url);
      setShareStatus('Copy the story link to share it.');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareStatus('Unable to open sharing. Copy the story link and share it with your own apps.');
      }
    }
  }

  return (
    <main className="lucky-map-shell" style={pageStyle}>

      <div aria-hidden="true" style={{ position: 'absolute', inset: '5% -10% auto', height: 220, background: 'linear-gradient(90deg, transparent, rgba(62, 178, 126, 0.2), rgba(247, 202, 82, 0.18), rgba(70, 133, 177, 0.16), transparent)', filter: 'blur(22px)', borderRadius: '50%', transformOrigin: 'center', animation: 'aurora-drift 10s ease-in-out infinite alternate' }} />

      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <nav aria-label="Lucky Map navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a href="/" className="home-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff7d6', textDecoration: 'none', fontWeight: 950, padding: '0.55rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.26)', background: 'rgba(1, 4, 3, 0.54)' }}>
            <Image src={DEFAULT_THEME.assets.logo} alt="LuckyPickCanada logo with maple leaf" width={40} height={40} sizes="40px" quality={85} priority style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            Back to Home Page
          </a>
        </nav>

        <header className="premium-surface" style={{ ...cardStyle, padding: 'clamp(1.35rem, 4vw, 3rem)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>Lucky Map of Canada</p>
          <h1 style={{ maxWidth: 900, margin: '0.45rem 0', fontSize: 'clamp(2.5rem, 8vw, 5.4rem)', lineHeight: 0.95, letterSpacing: '-0.06em', textShadow: '0 0 28px rgba(250,204,21,0.22)' }}>
            Where Luck Has Been Found Across Canada 🍀
          </h1>
          <p style={{ maxWidth: 760, margin: '1rem 0 0', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.7, color: 'rgba(255, 247, 214, 0.86)' }}>
            The Lucky Story Map is for discovering and sharing community stories from across Canada.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.35rem' }}>
            <a href="#lucky-story-map" className="story-link" style={{ color: '#06110d', textDecoration: 'none', fontWeight: 950, padding: '0.85rem 1.1rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)' }}>
              🍀 View Lucky Stories
            </a>
            <button type="button" onClick={() => setIsStoryFormOpen(true)} className="story-link" style={{ color: '#06110d', fontWeight: 950, padding: '0.85rem 1.1rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)', cursor: 'pointer' }}>Share your lucky story</button>
          </div>
          {!currentMapData?.isConfigured ? (
            <p style={{ margin: '1rem 0 0', padding: '0.85rem 1rem', borderRadius: 16, background: 'rgba(250, 204, 21, 0.14)', color: '#fde68a', border: '1px solid rgba(250, 204, 21, 0.32)', fontWeight: 800 }}>
              The Lucky Stories database needs to be available before the map can load community stories.
            </p>
          ) : null}
        </header>

        <section aria-label="Lucky Map statistics" className="map-statistics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem', marginTop: '1rem' }}>
          {[
            ['Total lucky stories shared', currentMapData?.totalStories || 0],
            ['Provinces with lucky moments', currentMapData?.provincesWithStories || 0],
            ['Mapped story markers', stories.length],
          ].map(([label, value]) => (
            <div key={label} className="premium-surface map-statistic" style={{ ...cardStyle, padding: '1rem' }}>
              <p style={{ margin: 0, color: '#facc15', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.4, fontSize: '0.78rem' }}>{label}</p>
              <strong style={{ display: 'block', marginTop: '0.35rem', fontSize: 'clamp(2rem, 6vw, 3.2rem)', lineHeight: 1 }}>{value}</strong>
            </div>
          ))}
        </section>

        <p style={{ ...cardStyle, margin: '1rem 0 0', padding: '1rem 1.15rem', lineHeight: 1.65, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 750 }}>
          Explore lucky stories shared by people across Canada. Find yours on the map or share your own lucky moment.
        </p>

        <section id="lucky-story-map" aria-label="LuckyPickCanada lucky stories map" className="lucky-story-map" style={{ gap: '1rem', marginTop: '1rem' }}>
          <div className="map-panel" style={{ ...cardStyle }}>
            <div className="official-map-artwork" role="group" aria-label="Interactive Canada story map">
              <Image
                src="/IMG_20260731_055452_187611.png"
                alt="Official LuckyPickCanada community map of Canada"
                width={569}
                height={464}
                sizes="(max-width: 560px) calc(100vw - 2rem), (max-width: 860px) min(100vw - 2rem, 44rem), 44rem"
                quality={100}
                priority
                className="official-map-image"
              />
              {provinceSelections.map((province) => {
                const provinceCount = province.count;
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
                    <span className="province-marker-code" aria-hidden="true">{province.code}</span>
                    <span className="marker-count">{provinceCount}</span>
                  </button>
                );
              })}
              {!stories.length ? (
                <p className="map-empty-state">No community stories with a province are ready for the map yet.</p>
              ) : null}
            </div>
          </div>

          <aside className="premium-surface map-story-panel" style={{ ...cardStyle, padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>{selectedProvinceInfo.name}</p>
            <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(1.85rem, 4vw, 3rem)', lineHeight: 1 }}>
              {selectedStories.length} {selectedStories.length === 1 ? 'lucky story' : 'lucky stories'}
            </h2>
            <div className="map-province-details" key={selectedProvince}>
            {selectedStories.length ? (
              <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
                {selectedStories.map((story) => (
                  <article key={story.id} className="map-story-card" style={{ padding: '1rem', borderRadius: 22, border: selectedStory?.id === story.id ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(41,148,107,0.11))' }}>
                    <button type="button" onClick={() => openStory(story)} style={{ padding: 0, border: 0, background: 'transparent', color: '#facc15', fontWeight: 900, cursor: 'pointer', textAlign: 'left' }}>
                      Story from {story.firstName || 'a Lucky Canadian'}
                    </button>
                    <p style={{ display: 'inline-flex', margin: '0.55rem 0 0', padding: '0.28rem 0.55rem', border: '1px solid rgba(250,204,21,0.5)', borderRadius: 999, color: '#fde68a', fontSize: '0.72rem', fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase' }}>Community Lucky Story</p>
                    <p style={{ lineHeight: 1.65 }}>{selectedStory?.id === story.id ? story.story : story.preview}</p>
                    {selectedStory?.id === story.id ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', margin: '0.65rem 0 0.85rem' }}>
                        <button type="button" onClick={() => shareStory(story)} className="story-link" style={{ color: '#06110d', fontWeight: 950, padding: '0.65rem 0.9rem', borderRadius: 999, background: 'linear-gradient(135deg, #fff8c8 0%, #facc15 48%, #b7791f 100%)', border: '1px solid rgba(255, 242, 180, 0.86)', cursor: 'pointer' }}>
                          🍀 Share This Story
                        </button>
                        <button type="button" onClick={() => reactToStory(story.id)} style={{ padding: 0, border: 0, background: 'transparent', color: '#d1fae5', fontWeight: 900, cursor: 'pointer' }}>
                          Celebrate {reactions[story.id] ? `(${reactions[story.id]})` : ''}
                        </button>
                        <button type="button" onClick={returnToMap} style={{ padding: 0, border: 0, background: 'transparent', color: '#fde68a', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline' }}>
                          ← Back to Lucky Story Map
                        </button>
                        {shareStatus ? <span style={{ color: '#d1fae5', fontWeight: 800 }}>{shareStatus}</span> : null}
                      </div>
                    ) : (
                      <button type="button" onClick={() => openStory(story)} style={{ padding: 0, border: 0, background: 'transparent', color: '#fde68a', fontWeight: 900, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}>
                        View full lucky story
                      </button>
                    )}
                    <p style={{ margin: 0, fontWeight: 850 }}>
                      {story.firstName ? `— ${story.firstName}, ` : '— '}{story.provinceName}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p style={{ lineHeight: 1.65, color: 'rgba(255,247,214,0.82)' }}>No Lucky Stories have been shared from {selectedProvinceInfo.name} yet. Select another province to keep exploring the Lucky Story Map.</p>
            )}
            </div>
          </aside>
        </section>

        <section className="premium-surface map-community-section" aria-labelledby="recent-activity-heading" style={{ ...cardStyle, marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Community</p>
          <h2 id="recent-activity-heading" style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1 }}>Recent Canadian Activity</h2>
          {stories.length ? (
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              {provinceSelections.filter((province) => recentStoriesByProvince[province.code]?.length).map((province) => (
                <section key={province.code} aria-label={`${province.name} recent stories`}>
                  <h3 style={{ margin: 0, color: '#fde68a', fontSize: '1rem' }}>{province.name}</h3>
                  <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.55rem' }}>
                    {recentStoriesByProvince[province.code].slice(0, 3).map((story) => (
                      <button key={story.id} type="button" onClick={() => openStory(story)} style={{ display: 'grid', gap: '0.35rem', padding: '0.8rem', border: '1px solid rgba(255,235,160,0.24)', borderRadius: 16, color: '#fff7d6', background: 'rgba(255,255,255,0.055)', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}>
                        <strong>{story.firstName || 'A Lucky Canadian'}</strong>
                        <span style={{ color: 'rgba(255,247,214,0.82)', lineHeight: 1.55 }}>{story.preview}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p style={{ margin: '1rem 0 0', color: 'rgba(255,247,214,0.82)', lineHeight: 1.65 }}>Community stories will appear here as they are shared.</p>
          )}
        </section>

        <section className="premium-surface map-province-section" style={{ ...cardStyle, marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Province selection</p>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1 }}>Lucky Stories by province</h2>
          <label className="mobile-province-select">Choose a province or territory<select value={selectedProvince} onChange={(event) => selectProvince(event.target.value)}>{provinceSelections.map((province) => <option key={province.code} value={province.code}>{province.name} ({province.count})</option>)}</select></label>
          <div className="province-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
            {provinceSelections.map((province) => (
              <button key={province.code} type="button" className="province-select-card map-province-card" onClick={() => selectProvince(province.code)} style={{ textAlign: 'left', padding: '0.9rem', borderRadius: 18, border: selectedProvince === province.code ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', color: '#fff7d6', background: selectedProvince === province.code ? 'linear-gradient(135deg, rgba(244,195,70,0.35), rgba(35,140,101,0.25))' : 'rgba(255,255,255,0.055)', cursor: 'pointer' }}>
                <strong style={{ display: 'block', color: '#fde68a' }}>{province.name}</strong>
                <span>{province.count} {province.count === 1 ? 'story' : 'stories'}</span>
              </button>
            ))}
          </div>
        </section>
        {isStoryFormOpen ? <div className="story-modal-backdrop" onMouseDown={() => setIsStoryFormOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="story-form-title" className="story-modal" onMouseDown={(event) => event.stopPropagation()}><button type="button" aria-label="Close story form" onClick={() => setIsStoryFormOpen(false)}>×</button><h2 id="story-form-title">Share your lucky story</h2><form action="/api/lucky-stories" method="post"><input name="website" tabIndex="-1" autoComplete="off" style={{ display: 'none' }} /><label>Name<input name="name" required maxLength="40" /></label><label>Province or territory<input name="location" maxLength="80" /></label><label>Your story<textarea name="story" required minLength="20" maxLength="1500" rows="5" /></label><TurnstileField siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAD6xRRyXK4C4YQ1x'} submitButtonId="lucky-story-submit" /><button id="lucky-story-submit" type="submit">Submit story</button></form></section></div> : null}
      </div>
    </main>
  );
}

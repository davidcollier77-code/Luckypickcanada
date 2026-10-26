'use client';
import { playButtonClick } from '../lib/audio';


import dynamic from 'next/dynamic';
const TurnstileField = dynamic(() => import('../turnstile-field'), { ssr: false });
import { DEFAULT_THEME } from '../../themes/default/theme';
import { DEFAULT_MAP_THEME } from '../../themes/default/map-theme';
import { startLuckyStoriesRefresh } from './lucky-stories-refresh';

import { useEffect, useMemo, useState, useRef } from 'react';

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

const { pageStyle: origPageStyle, cardStyle } = DEFAULT_MAP_THEME;
const { background: _bg, backgroundColor: _bgc, ...pageStyle } = origPageStyle;

/**
 * Formats a story timestamp as elapsed minutes, hours, or days.
 * @param {string} dateString - Timestamp accepted by the Date constructor.
 * @returns {string} Relative time, 'just now' for times under a minute, or an
 * empty string for missing or invalid timestamps.
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
}

/**
 * Selects stories matching a province or territory code, preserving their order.
 * @param {Array<{province: string}>} stories - Community stories to filter.
 * @param {string} provinceCode - Province or territory code to match.
 * @returns {Array<{province: string}>} Stories belonging to the requested region.
 */
function provinceStories(stories, provinceCode) {
  return stories.filter((story) => story.province === provinceCode);
}

/**
 * Renders the interactive Canada map with story filtering, sharing, and submission.
 * @param {Object} props - Component properties.
 * @param {Object} props.mapData - Initial story list, statistics, and database
 * availability, refreshed from the stories API while the component is mounted.
 * @returns {import('react').ReactElement} The map and community story interface.
 */
export default function LuckyMapOfCanada({ mapData }) {
  const [liveMapData, setLiveMapData] = useState(mapData);
  const currentMapData = liveMapData || mapData;
  const allStories = currentMapData?.stories || [];

  const [timeframeFilter, setTimeframeFilter] = useState('all-time');
  const [storyFormText, setStoryFormText] = useState('');
  const storyPanelRef = useRef(null);

  const stories = useMemo(() => {
    if (timeframeFilter === 'all-time') return allStories;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return allStories.filter(story => new Date(story.createdAt) >= twentyFourHoursAgo);
  }, [allStories, timeframeFilter]);

  const provinceCounts = useMemo(() => {
    return stories.reduce((counts, story) => {
      counts[story.province] = (counts[story.province] || 0) + 1;
      return counts;
    }, {});
  }, [stories]);

  const firstStoryProvince = stories[0]?.province || 'ON';
  const [selectedProvince, setSelectedProvince] = useState(firstStoryProvince);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingTimeoutRef = useRef(null);
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

  useEffect(() => startLuckyStoriesRefresh(setLiveMapData), [setLiveMapData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storyId = new URLSearchParams(window.location.search).get('story');
    const linkedStory = stories.find((story) => story.id === storyId);

    if (linkedStory) {
      setSelectedProvince(linkedStory.province);
      setSelectedStoryId(linkedStory.id);
    }
  }, [stories]);

  useEffect(() => {
    if (!isStoryFormOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsStoryFormOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoryFormOpen]);

  useEffect(() => {
    const handlePageShow = (e) => {
        clearTimeout(submittingTimeoutRef.current);
      if (e.persisted) {
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  function handleFormSubmit(event) {
  useEffect(() => {
    return () => clearTimeout(submittingTimeoutRef.current);
  }, []);

    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    setIsSubmitting(true);
    // Timeout to reset state in case the form submission hangs
    setTimeout(() => setIsSubmitting(false), 8000);
    if (submittingTimeoutRef.current) clearTimeout(submittingTimeoutRef.current);
    submittingTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 8000);

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
    setTimeout(() => {
      storyPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

      setTimeout(() => {
        const storyCard = document.getElementById(`story-${story.id}`);
        if (storyCard) {
          storyCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (storyPanelRef.current) {
          storyPanelRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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

      setTimeout(() => {
        if (storyPanelRef.current) {
          storyPanelRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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
    <div className="lucky-map-shell" style={pageStyle}>
      <div className="homepage-sky-backdrop" aria-hidden="true" />


      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
        <nav aria-label="Lucky Map navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a href="/" className="home-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff7d6', textDecoration: 'none', fontWeight: 950, padding: '0.55rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.26)', background: 'rgba(1, 4, 3, 0.54)' }}>
            <img src="/map-logo-small.png" alt="LuckyPickCanada logo with maple leaf" width={40} height={40} sizes="40px" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            Back to Home Page
          </a>
        </nav>

        <header className="premium-surface" style={{ ...cardStyle, padding: 'clamp(1.35rem, 4vw, 3rem)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>Lucky Map of Canada</p>
          <h1 style={{ maxWidth: 900, margin: '0.45rem 0', fontSize: 'clamp(2.5rem, 8vw, 5.4rem)', lineHeight: 0.95, letterSpacing: '-0.06em', textShadow: '0 0 28px rgba(250,204,21,0.22)' }}>
            Where Luck Has Been Found Across Canada <span className="clover-3d">🍀</span>
          </h1>
          <p style={{ maxWidth: 760, margin: '1rem 0 0', fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', lineHeight: 1.7, color: 'rgba(255, 247, 214, 0.86)' }}>
            Explore lucky stories from across Canada. Browse by province, discover community highlights, and switch between all-time stories and the latest 24 hours.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.35rem' }}>
            <a href="#lucky-story-map" className="story-link" style={{ color: '#06110d', textDecoration: 'none', fontWeight: 900, padding: '0.85rem 1.4rem', borderRadius: 999, background: 'linear-gradient(180deg, #fef0a5 0%, #d4981a 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(139, 79, 7, 0.8)', borderLeft: '1px solid rgba(255, 215, 100, 0.5)', borderRight: '1px solid rgba(255, 215, 100, 0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.8)' }}>
              <span className="clover-3d">🍀</span> View Lucky Stories
            </a>
            <button type="button" onClick={() => { playButtonClick(); setIsStoryFormOpen(true); }} className="story-link" style={{ color: '#06110d', fontWeight: 900, padding: '0.85rem 1.4rem', borderRadius: 999, background: 'linear-gradient(180deg, #fef0a5 0%, #d4981a 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(139, 79, 7, 0.8)', borderLeft: '1px solid rgba(255, 215, 100, 0.5)', borderRight: '1px solid rgba(255, 215, 100, 0.5)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.8)' }}>Share your lucky story</button>
          </div>
          {!currentMapData?.isConfigured ? (
            <p style={{ margin: '1rem 0 0', padding: '0.85rem 1rem', borderRadius: 16, background: 'rgba(250, 204, 21, 0.14)', color: '#fde68a', border: '1px solid rgba(250, 204, 21, 0.32)', fontWeight: 800 }}>
              The Lucky Stories database needs to be available before the map can load community stories.
            </p>
          ) : null}
        </header>

        <section aria-label="Lucky Map statistics" className="map-statistics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          {[
            ['Total lucky stories shared', currentMapData?.totalStories || 0],
            ['Provinces with lucky moments', currentMapData?.provincesWithStories || 0],
            ['Mapped story markers', stories.length],
          ].map(([label, value]) => (
            <div key={label} className="premium-surface map-statistic" style={{ ...cardStyle, padding: '1.2rem 1.4rem' }}>
              <p style={{ margin: 0, color: '#fde68a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.72rem', opacity: 0.9 }}>{label}</p>
              <strong style={{ display: 'block', marginTop: '0.45rem', fontSize: 'clamp(2rem, 6vw, 2.8rem)', lineHeight: 1, color: '#fff', textShadow: '0 2px 10px rgba(255, 255, 255, 0.1)' }}>{value}</strong>
            </div>
          ))}
        </section>

        <p style={{ ...cardStyle, margin: '1rem 0 0', padding: '1rem 1.15rem', lineHeight: 1.65, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 750 }}>
          Explore lucky stories shared by people across Canada. Find yours on the map or share your own lucky moment.
        </p>


        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.15)' }}>
            <button
              type="button"
              onClick={() => setTimeframeFilter('all-time')}
              style={{ padding: '0.65rem 1.45rem', borderRadius: 999, border: timeframeFilter === 'all-time' ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.1)', background: timeframeFilter === 'all-time' ? 'linear-gradient(135deg, rgba(255,248,200,0.15), rgba(250,204,21,0.25))' : 'rgba(255,255,255,0.05)', color: timeframeFilter === 'all-time' ? '#facc15' : '#fdf6e3', fontWeight: timeframeFilter === 'all-time' ? 900 : 700, cursor: 'pointer', transition: 'all 0.2s ease-in-out', boxShadow: timeframeFilter === 'all-time' ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px rgba(255,255,255,0.1)' : 'none' }}
            >
              All-Time
            </button>
            <button
              type="button"
              onClick={() => setTimeframeFilter('24h')}
              style={{ padding: '0.65rem 1.45rem', borderRadius: 999, border: timeframeFilter === '24h' ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.1)', background: timeframeFilter === '24h' ? 'linear-gradient(135deg, rgba(255,248,200,0.15), rgba(250,204,21,0.25))' : 'rgba(255,255,255,0.05)', color: timeframeFilter === '24h' ? '#facc15' : '#fdf6e3', fontWeight: timeframeFilter === '24h' ? 900 : 700, cursor: 'pointer', transition: 'all 0.2s ease-in-out', boxShadow: timeframeFilter === '24h' ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px rgba(255,255,255,0.1)' : 'none' }}
            >
              Last 24 Hours
            </button>
          </div>
        </div>

        <section id="lucky-story-map" aria-label="LuckyPickCanada lucky stories map" className="lucky-story-map" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
          <div className="map-panel" style={{ ...cardStyle }}>
            <div className="official-map-artwork" role="group" aria-label="Interactive Canada story map">
              <picture className="w-full">
                <source srcSet="/IMG_20260731_055452_187611.avif" type="image/avif" sizes="(max-width: 560px) calc(100vw - 2rem), (max-width: 860px) min(100vw - 2rem, 44rem), 44rem" />
                <source srcSet="/IMG_20260731_055452_187611.webp" type="image/webp" sizes="(max-width: 560px) calc(100vw - 2rem), (max-width: 860px) min(100vw - 2rem, 44rem), 44rem" />
                <img
                src="/IMG_20260731_055452_187611.png"
                alt="Lucky Pick Canada interactive map displaying community stories across Canadian provinces"
                width={569}
                height={464}
                sizes="(max-width: 560px) calc(100vw - 2rem), (max-width: 860px) min(100vw - 2rem, 44rem), 44rem"
                loading="eager"
                fetchPriority="high"
                priority
                className="official-map-image"
              />
              </picture>
              {provinceSelections.map((province) => {
                const provinceCount = province.count;
                const active = selectedProvince === province.code;

                if (stories.length === 0) return null;
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
                <div className="map-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 16 }}>
                  <p style={{ margin: 0, color: '#fde68a', fontSize: '1.2rem', fontWeight: 700 }}>{timeframeFilter === '24h' ? "No stories in the last 24 hours yet. Be the first to share!" : "No community stories with a province are ready for the map yet."}</p>
                  {timeframeFilter === '24h' && (
                    <button type="button" onClick={() => { playButtonClick(); setIsStoryFormOpen(true); }} className="story-link" style={{ color: '#06110d', fontWeight: 900, padding: '0.65rem 1.25rem', borderRadius: 999, background: 'linear-gradient(180deg, #fef0a5 0%, #d4981a 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(139, 79, 7, 0.8)', borderLeft: '1px solid rgba(255, 215, 100, 0.5)', borderRight: '1px solid rgba(255, 215, 100, 0.5)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                      Share your lucky story
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <aside ref={storyPanelRef} className="premium-surface map-story-panel" style={{ ...cardStyle, padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>{selectedProvinceInfo.name}</p>
            <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(1.85rem, 4vw, 3rem)', lineHeight: 1 }}>
              {selectedStories.length} {selectedStories.length === 1 ? 'lucky story' : 'lucky stories'}
            </h2>
            <div className="map-province-details" key={selectedProvince}>
            {selectedStories.length ? (
              <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
                {selectedStories.map((story) => (
                  <article key={story.id} id={`story-${story.id}`} className="map-story-card" style={{ padding: '1.2rem', borderRadius: 24, border: selectedStory?.id === story.id ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(250, 204, 21, 0.38)', background: selectedStory?.id === story.id ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95))' : 'linear-gradient(145deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.25)', transition: 'all 0.2s ease-in-out' }}>
                    <button type="button" onClick={() => openStory(story)} style={{ padding: 0, border: 0, background: 'transparent', color: '#facc15', fontWeight: 900, cursor: 'pointer', textAlign: 'left' }}>
                      Story from {story.firstName || 'a Lucky Canadian'}
                    </button>
                    <p style={{ display: 'inline-flex', margin: '0.55rem 0 0', padding: '0.28rem 0.55rem', border: '1px solid rgba(250,204,21,0.5)', borderRadius: 999, color: '#fde68a', fontSize: '0.72rem', fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase' }}>Community Lucky Story</p>
                    <p style={{ lineHeight: 1.65 }}>{selectedStory?.id === story.id ? story.story : story.preview}</p>
                    <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>{formatRelativeTime(story.createdAt)}</p>
                    {selectedStory?.id === story.id ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', margin: '0.65rem 0 0.85rem' }}>
                        <button type="button" onClick={() => shareStory(story)} className="story-link" style={{ color: '#06110d', fontWeight: 900, padding: '0.65rem 1.25rem', borderRadius: 999, background: 'linear-gradient(180deg, #fef0a5 0%, #d4981a 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(139, 79, 7, 0.8)', borderLeft: '1px solid rgba(255, 215, 100, 0.5)', borderRight: '1px solid rgba(255, 215, 100, 0.5)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.8)' }}>
                          <span className="clover-3d">🍀</span> Share This Story
                        </button>
                        <button type="button" className="secondary-action-btn" onClick={() => reactToStory(story.id)} style={{ padding: '0.65rem 1.25rem', borderRadius: 999, border: '1px solid rgba(250, 204, 21, 0.4)', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#d1fae5', fontWeight: 900, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                          Celebrate {reactions[story.id] ? `(${reactions[story.id]})` : ''}
                        </button>
                        <button type="button" className="secondary-action-btn" onClick={returnToMap} style={{ padding: '0.65rem 1.25rem', borderRadius: 999, border: '1px solid rgba(250, 204, 21, 0.4)', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#fde68a', fontWeight: 900, cursor: 'pointer', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                          ← Back to Lucky Story Map
                        </button>
                        {shareStatus ? <span style={{ color: '#d1fae5', fontWeight: 800 }}>{shareStatus}</span> : null}
                      </div>
                    ) : (
                      <button type="button" className="secondary-action-btn" onClick={() => openStory(story)} style={{ padding: '0.5rem 1rem', borderRadius: 999, border: '1px solid rgba(250, 204, 21, 0.4)', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#fde68a', fontWeight: 900, cursor: 'pointer', textAlign: 'left', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'inline-block' }}>
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
                      <button key={story.id} type="button" onClick={() => openStory(story)} style={{ display: 'grid', gap: '0.35rem', padding: '1rem', border: '1px solid rgba(250, 204, 21, 0.38)', borderRadius: 20, color: '#fff7d6', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.8))', cursor: 'pointer', font: 'inherit', textAlign: 'left', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.15)' }}>
                        <strong>{story.firstName || 'A Lucky Canadian'}</strong>
                        <span style={{ color: 'rgba(255,247,214,0.82)', lineHeight: 1.55 }}>{story.preview}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}><span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{formatRelativeTime(story.createdAt)}</span><span style={{ color: '#fde68a', fontSize: '0.85rem', fontWeight: 700 }}>Read full story &rarr;</span></div>
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
          <div className="province-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {provinceSelections.map((province) => (
              <button key={province.code} type="button" className="province-select-card map-province-card" onClick={() => selectProvince(province.code)} style={{ textAlign: 'left', padding: '0.9rem', borderRadius: 18, border: selectedProvince === province.code ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(255,235,160,0.24)', color: '#fff7d6', background: selectedProvince === province.code ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95))' : 'linear-gradient(145deg, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.6))', cursor: 'pointer' }}>
                <strong style={{ display: 'block', color: '#fde68a' }}>{province.name}</strong>
                <span>{province.count} {province.count === 1 ? 'story' : 'stories'}</span>
              </button>
            ))}
          </div>
        </section>
                {isStoryFormOpen ? (
          <div className="story-modal-backdrop" onMouseDown={() => setIsStoryFormOpen(false)}>
            <section role="dialog" aria-modal="true" aria-labelledby="story-form-title" className="story-modal" onMouseDown={(event) => event.stopPropagation()}>

              {/* Independent Starry Background layer */}
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', zIndex: 0 }}>
                <div style={{ position: 'absolute', inset: 0, background: "image-set(url('/assets/lucky-map-sky.avif') type('image/avif'), url('/assets/lucky-map-sky.webp') type('image/webp')) center / cover no-repeat", zIndex: -1 }} />
                {/* Inner gradient to ensure legibility */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(6, 20, 36, 0.45), rgba(2, 8, 16, 0.65))', zIndex: 0 }} />
              </div>

              {/* Form Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <button type="button" aria-label="Close story form" onClick={() => setIsStoryFormOpen(false)} autoFocus className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" style={{ padding: '8px', minWidth: '44px', minHeight: '44px', position: 'absolute', top: '-0.5rem', right: '-0.5rem' }}><span aria-hidden="true" style={{ fontSize: '1.8rem' }}>×</span></button>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900, fontSize: '0.85rem' }}>Share your moment</p>
                <h2 id="story-form-title" style={{ margin: "0.2rem 0 0", color: "#fff", fontSize: '2rem', lineHeight: 1.1 }}>Community Stories</h2>
                <p style={{ margin: "0.8rem 0 1.5rem", color: "#cbd5e1", lineHeight: 1.6, fontSize: '1.05rem' }}>Share your lucky moments, funny experiences, memorable days, or little wins with the LuckyPickCanada community.</p>
                <form action="/api/lucky-stories" method="post" onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
                  <input name="website" tabIndex="-1" autoComplete="off" style={{ display: 'none' }} />
                  <label style={{ color: "#f8fafc", fontWeight: 700 }}>Name<input name="name" required maxLength="40" style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(250, 204, 21, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.9rem 1rem', color: '#fff', fontSize: '1.05rem' }} /></label>
                  <label style={{ color: "#f8fafc", fontWeight: 700 }}>Province or territory<input name="location" maxLength="80" style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(250, 204, 21, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.9rem 1rem', color: '#fff', fontSize: '1.05rem' }} /></label>
                  <label style={{ color: "#f8fafc", fontWeight: 700 }}>Tell us your story...<textarea name="story" required minLength="20" maxLength="600" rows="5" onChange={(e) => setStoryFormText(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(250, 204, 21, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.9rem 1rem', color: '#fff', fontSize: '1.05rem', resize: 'vertical' }} /><div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem' }}>{storyFormText.length}/600 characters</div></label>
                  <TurnstileField submitButtonId="lucky-story-submit" action="lucky-story" />
                  <button id="lucky-story-submit" type="submit" disabled={isSubmitting} onClick={playButtonClick} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.8)', borderBottom: '1px solid rgba(139, 79, 7, 0.8)', borderLeft: '1px solid rgba(255, 215, 100, 0.5)', borderRight: '1px solid rgba(255, 215, 100, 0.5)', borderRadius: 999, color: '#0f172a', background: 'linear-gradient(180deg, #fef0a5 0%, #d4981a 100%)', fontWeight: 900, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '0.5rem', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.35), inset 0 1px 2px rgba(255,255,255,0.5)', fontSize: '1.1rem', transition: 'all 0.2s' }}>{isSubmitting ? 'Please wait...' : 'Submit Story'}</button>
                </form>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

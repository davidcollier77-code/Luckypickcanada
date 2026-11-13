'use client';
import "../../themes/default/map.css";

import { playButtonClick } from '../lib/audio';
import { storyProvinces } from '../lucky-story-provinces';


import dynamic from 'next/dynamic';
const TurnstileField = dynamic(() => import('../turnstile-field'), { ssr: false });
import { DEFAULT_THEME } from '../../themes/default/theme';
import { DEFAULT_MAP_THEME } from '../../themes/default/map-theme';
import { startLuckyStoriesRefresh } from './lucky-stories-refresh';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

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

const STORED_PROVINCE_KEY = 'luckyStoriesProvince';
const STORY_PAGE_SIZE = 3;
const storyProvinceOptions = [...storyProvinces].sort((left, right) => left.name.localeCompare(right.name));

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
 * Renders the interactive Canada map with story filtering, sharing, and submission.
 * @param {Object} props - Component properties.
 * @param {Object} props.mapData - Initial story list, statistics, and database
 * availability, refreshed from the stories API while the component is mounted.
 * @returns {import('react').ReactElement} The map and community story interface.
 */
export default function LuckyMapOfCanada({ mapData }) {
  const initialProvince = mapData?.selectedProvince || mapData?.defaultProvince || 'ON';
  const initialStories = mapData?.stories || [];

  const [summary, setSummary] = useState(() => ({
    provinceCounts: mapData?.provinceCounts || {},
    allTimeProvinceCounts: mapData?.allTimeProvinceCounts || mapData?.provinceCounts || {},
    totalStories: mapData?.totalStories || 0,
    provincesWithStories: mapData?.provincesWithStories || 0,
    recentStories: mapData?.recentStories || [],
    defaultProvince: mapData?.defaultProvince || initialProvince,
    isConfigured: mapData?.isConfigured !== false,
  }));

  const [timeframeFilter, setTimeframeFilter] = useState('all-time');
  const [storyFormText, setStoryFormText] = useState('');
  const storyPanelRef = useRef(null);
  const feedSentinelRef = useRef(null);
  const feedRequestRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [feedStories, setFeedStories] = useState(() => initialStories.filter((story) => story.province === initialProvince));
  const [feedLoaded, setFeedLoaded] = useState(initialStories.length);
  const [feedHasMore, setFeedHasMore] = useState(Boolean(mapData?.hasMore));
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [pinnedStory, setPinnedStory] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingTimeoutRef = useRef(null);
  const [reactions, setReactions] = useState({});
  const [localCelebrated, setLocalCelebrated] = useState(new Set());

  const hoursWindow = timeframeFilter === '24h' ? 24 : null;
  const provinceCounts = summary.provinceCounts || {};

  const displayStories = useMemo(() => {
    const provinceStoriesInFeed = feedStories.filter((story) => story.province === selectedProvince);
    if (pinnedStory && pinnedStory.province === selectedProvince && !provinceStoriesInFeed.some((story) => story.id === pinnedStory.id)) {
      return [pinnedStory, ...provinceStoriesInFeed];
    }
    return provinceStoriesInFeed;
  }, [feedStories, pinnedStory, selectedProvince]);

  const loadProvincePage = useCallback(async ({ province, offset = 0, hours = null, replace = true }) => {
    if (replace) feedRequestRef.current += 1;
    const requestId = feedRequestRef.current;
    setIsLoadingFeed(true);

    try {
      const params = new URLSearchParams({
        province,
        offset: String(offset),
        limit: String(STORY_PAGE_SIZE),
      });
      if (hours) params.set('hours', '24');

      const response = await fetch(`/api/lucky-stories?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Lucky Stories request failed with ${response.status}`);

      const payload = await response.json();
      if (requestId !== feedRequestRef.current) return;

      const pageStories = Array.isArray(payload.stories) ? payload.stories : [];

      setSummary((current) => ({
        provinceCounts: payload.provinceCounts || current.provinceCounts,
        allTimeProvinceCounts: payload.allTimeProvinceCounts || current.allTimeProvinceCounts,
        totalStories: typeof payload.totalStories === 'number' ? payload.totalStories : current.totalStories,
        provincesWithStories: typeof payload.provincesWithStories === 'number' ? payload.provincesWithStories : current.provincesWithStories,
        recentStories: Array.isArray(payload.recentStories) ? payload.recentStories : current.recentStories,
        defaultProvince: payload.defaultProvince || current.defaultProvince,
        isConfigured: payload.isConfigured !== false,
      }));

      setFeedStories((current) => {
        if (replace) return pageStories;
        const seen = new Set(current.map((story) => story.id));
        return [...current, ...pageStories.filter((story) => !seen.has(story.id))];
      });
      setFeedLoaded(offset + pageStories.length);
      setFeedHasMore(Boolean(payload.hasMore));
      setFeedError('');
    } catch (error) {
      if (requestId !== feedRequestRef.current) return;
      console.error('Failed to load a Lucky Stories page', error);
      setFeedError('Unable to load lucky stories right now. Please try again.');
    } finally {
      if (requestId === feedRequestRef.current) setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('celebratedStories');
        if (stored) {
          setLocalCelebrated(new Set(JSON.parse(stored)));
        }
      } catch (e) { /* ignore */ }
    }
  }, []);

  const selectedProvinceInfo = provinces.find((province) => province.code === selectedProvince) || provinces[4];
  const selectedProvinceTotal = provinceCounts[selectedProvince] ?? 0;
  const selectedStory = selectedStoryId
    ? displayStories.find((story) => story.id === selectedStoryId) || null
    : null;
  const mappedStoryCount = useMemo(
    () => Object.values(provinceCounts).reduce((total, count) => total + (Number(count) || 0), 0),
    [provinceCounts],
  );
  const recentStoriesByProvince = useMemo(() => (summary.recentStories || []).reduce((groups, story) => {
    (groups[story.province] ||= []).push(story);
    return groups;
  }, {}), [summary.recentStories]);

  const provinceSelections = useMemo(
    () => provinces.map((province) => ({ ...province, count: provinceCounts[province.code] ?? 0 })),
    [provinceCounts],
  );

  // Initialize reactions state from the server data when it changes
  useEffect(() => {
    setReactions((current) => {
      const merged = { ...current };
      displayStories.forEach(s => {
        // Only update if the server value is higher, preserving optimistic increments
        if ((s.reactionCount || 0) > (merged[s.id] || 0)) {
          merged[s.id] = s.reactionCount || 0;
        } else if (!(s.id in merged)) {
          merged[s.id] = s.reactionCount || 0;
        }
      });
      return merged;
    });
  }, [displayStories]);

  // Restore a manually chosen province, otherwise use the highest-count province.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(STORED_PROVINCE_KEY);
    const validStored = stored && provinces.some((province) => province.code === stored) ? stored : null;
    let target = validStored || summary.defaultProvince || initialProvince;

    if (validStored && summary.totalStories > 0 && (summary.allTimeProvinceCounts[validStored] || 0) === 0) {
      window.localStorage.removeItem(STORED_PROVINCE_KEY);
      target = summary.defaultProvince || initialProvince;
    }

    const serverFeedCoversTarget = initialStories.length > 0 && initialStories.every((story) => story.province === target);

    if (target !== initialProvince) setSelectedProvince(target);
    if (!serverFeedCoversTarget) {
      setFeedStories([]);
      setFeedLoaded(0);
      setFeedHasMore(false);
      void loadProvincePage({ province: target, offset: 0, hours: null, replace: true });
    }
  }, []);

  // Keep summary counts current without replacing the visitor's paged feed.
  useEffect(() => {
    return startLuckyStoriesRefresh(
      (nextMapData) => {
        setSummary((current) => ({
          provinceCounts: nextMapData.provinceCounts || current.provinceCounts,
          allTimeProvinceCounts: nextMapData.allTimeProvinceCounts || current.allTimeProvinceCounts,
          totalStories: typeof nextMapData.totalStories === 'number' ? nextMapData.totalStories : current.totalStories,
          provincesWithStories: typeof nextMapData.provincesWithStories === 'number' ? nextMapData.provincesWithStories : current.provincesWithStories,
          recentStories: Array.isArray(nextMapData.recentStories) ? nextMapData.recentStories : current.recentStories,
          defaultProvince: nextMapData.defaultProvince || current.defaultProvince,
          isConfigured: nextMapData.isConfigured !== false,
        }));
      },
      { getQueryParams: () => (hoursWindow ? { hours: '24' } : {}) },
    );
  }, [hoursWindow]);

  // Shared story links resolve one story, then pin it above that province's first page.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const linkedId = new URLSearchParams(window.location.search).get('story');
    if (!linkedId) return;

    let cancelled = false;
    async function openLinkedStory() {
      try {
        const response = await fetch(`/api/lucky-stories?story=${encodeURIComponent(linkedId)}&limit=0`, { cache: 'no-store' });
        if (!response.ok) return;

        const payload = await response.json();
        const linked = payload?.linkedStory;
        if (cancelled || !linked) return;

        setPinnedStory(linked);
        setSelectedProvince(linked.province);
        setSelectedStoryId(linked.id);
        setShareStatus('');
        await loadProvincePage({ province: linked.province, offset: 0, hours: null, replace: true });

        window.setTimeout(() => {
          document.getElementById(`story-${linked.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } catch (error) {
        console.error('Failed to open the linked Lucky Story', error);
      }
    }

    void openLinkedStory();
    return () => {
      cancelled = true;
    };
  }, [loadProvincePage]);

  // Load the next page when the visitor approaches the end of the province feed.
  useEffect(() => {
    if (!feedHasMore || isLoadingFeed) return;

    const sentinel = feedSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (loadingMoreRef.current) return;

      loadingMoreRef.current = true;
      void loadProvincePage({
        province: selectedProvince,
        offset: feedLoaded,
        hours: hoursWindow,
        replace: false,
      }).finally(() => {
        loadingMoreRef.current = false;
      });
    }, { rootMargin: '400px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feedHasMore, isLoadingFeed, selectedProvince, feedLoaded, hoursWindow, loadProvincePage]);

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
      if (e.persisted) {
        clearTimeout(submittingTimeoutRef.current);
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    return () => clearTimeout(submittingTimeoutRef.current);
  }, []);

  function handleFormSubmit(event) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    setIsSubmitting(true);
    if (submittingTimeoutRef.current) clearTimeout(submittingTimeoutRef.current);
    submittingTimeoutRef.current = setTimeout(() => setIsSubmitting(false), 8000);
  }

  function storyUrl(storyId) {
    if (typeof window === 'undefined') return '/lucky-map-of-canada';

    const url = new URL(window.location.href);
    url.pathname = '/lucky-map-of-canada';
    url.searchParams.set('story', storyId);
    url.hash = 'lucky-story-map';
    return url.toString();
  }

  function selectProvince(provinceCode) {
    if (!provinces.some((province) => province.code === provinceCode)) return;

    setSelectedProvince(provinceCode);
    setSelectedStoryId('');
    setPinnedStory(null);
    setShareStatus('');
    setFeedError('');
    setFeedStories([]);
    setFeedLoaded(0);
    setFeedHasMore(false);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORED_PROVINCE_KEY, provinceCode);
    }

    void loadProvincePage({ province: provinceCode, offset: 0, hours: hoursWindow, replace: true });

    setTimeout(() => {
      storyPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function changeTimeframe(nextFilter) {
    if (nextFilter === timeframeFilter) return;

    setTimeframeFilter(nextFilter);
    setSelectedStoryId('');
    setPinnedStory(null);
    setShareStatus('');
    setFeedError('');
    setFeedStories([]);
    setFeedLoaded(0);
    setFeedHasMore(false);

    void loadProvincePage({
      province: selectedProvince,
      offset: 0,
      hours: nextFilter === '24h' ? 24 : null,
      replace: true,
    });
  }

  function openStory(story) {
    const provinceChanged = story.province !== selectedProvince;
    const storyLoaded = feedStories.some((entry) => entry.id === story.id);

    setPinnedStory(story);
    setSelectedProvince(story.province);
    setSelectedStoryId(story.id);
    setShareStatus('');

    if (provinceChanged || !storyLoaded) {
      setFeedStories([]);
      setFeedLoaded(0);
      setFeedHasMore(false);
      void loadProvincePage({ province: story.province, offset: 0, hours: hoursWindow, replace: true });
    }

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

  async function reactToStory(storyId) {
    if (localCelebrated.has(storyId)) return;

    // Optimistically update locally
    setReactions((current) => ({ ...current, [storyId]: (current[storyId] || 0) + 1 }));
    setLocalCelebrated(prev => {
      const next = new Set(prev);
      next.add(storyId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('celebratedStories', JSON.stringify(Array.from(next)));
      }
      return next;
    });

    try {
      const res = await fetch('/api/lucky-stories/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update with server authoritative count
        if (typeof data.count === 'number') {
          setReactions((current) => ({ ...current, [storyId]: data.count }));
        }
      } else {
        // Revert the optimistic update on failure
        setReactions((current) => ({ ...current, [storyId]: (current[storyId] || 1) - 1 }));
        setLocalCelebrated(prev => {
          const next = new Set(prev);
          next.delete(storyId);
          if (typeof window !== 'undefined') {
            localStorage.setItem('celebratedStories', JSON.stringify(Array.from(next)));
          }
          return next;
        });
      }
    } catch (e) {
      console.error('Failed to celebrate story', e);
    }
  }

  function returnToMap() {
    setSelectedStoryId('');
    setShareStatus('');
    setPinnedStory(null);
    setFeedStories([]);
    setFeedLoaded(0);
    setFeedHasMore(false);
    void loadProvincePage({ province: selectedProvince, offset: 0, hours: hoursWindow, replace: true });

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
        <nav aria-label="Lucky Community Stories navigation" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <a href="/" className="home-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#fff7d6', textDecoration: 'none', fontWeight: 950, padding: '0.55rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.26)', background: 'rgba(1, 4, 3, 0.54)' }}>
            <img src="/map-logo-small.png" alt="LuckyPickCanada logo with maple leaf" width={40} height={40} sizes="40px" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            Back to Home Page
          </a>
        </nav>

        <header className="premium-surface" style={{ ...cardStyle, padding: 'clamp(1.35rem, 4vw, 3rem)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: 2, color: '#facc15', fontWeight: 900 }}>Lucky Community Stories</p>
          <h1 style={{ maxWidth: 900, margin: '0.45rem 0', fontSize: 'clamp(2.5rem, 8vw, 5.4rem)', lineHeight: 0.95, letterSpacing: '-0.06em', textShadow: '0 0 28px rgba(250,204,21,0.22)' }}>
            Where Luck Has Been Found Across Canada <span className="clover-3d">🍀</span>
          </h1>
          <div className="map-community-intro">
            <p>Luck means something different to everyone. It might be a funny coincidence, an unexpected helping hand, a life-changing moment, a second chance, or simply being lucky to be here. Every story, big or small, has a place in our community.</p>
            <p>Explore stories shared across Canada, browse by province and territory, and see how our community is growing province by province. Read the experiences people have shared, celebrate the stories that resonate with you, and see each story's celebration count. Then share a lucky story of your own.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.35rem' }}>
            <a href="#lucky-story-map" className="story-link gold-3d-btn" style={{ textDecoration: 'none', fontWeight: 900, padding: '0.85rem 1.4rem', borderRadius: 999 }}>
              <span className="clover-3d gold-cta-emoji" aria-hidden="true">🍀</span> View Lucky Community Stories
            </a>
            <button type="button" onClick={() => { playButtonClick(); setIsStoryFormOpen(true); }} className="story-link gold-3d-btn" style={{ fontWeight: 900, padding: '0.85rem 1.4rem', borderRadius: 999, cursor: 'pointer' }}><span className="gold-cta-emoji" aria-hidden="true">✍️</span>Share your lucky story</button>
          </div>
          {!summary.isConfigured ? (
            <p style={{ margin: '1rem 0 0', padding: '0.85rem 1rem', borderRadius: 16, background: 'rgba(250, 204, 21, 0.14)', color: '#fde68a', border: '1px solid rgba(250, 204, 21, 0.32)', fontWeight: 800 }}>
              The Lucky Community Stories database needs to be available before the map can load community stories.
            </p>
          ) : null}
        </header>

        <section aria-label="Lucky Community Stories statistics" className="map-statistics" style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1fr)', gap: '1rem', marginTop: '1.25rem' }}>
          <div className="premium-surface map-statistic" style={{ ...cardStyle, padding: '1.2rem 1.4rem' }}>
            <p style={{ margin: 0, color: '#fde68a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.8rem', opacity: 0.9 }}>Total lucky stories shared (All-time)</p>
            <strong style={{ display: 'block', marginTop: '0.45rem', fontSize: 'clamp(2rem, 6vw, 2.8rem)', lineHeight: 1, color: '#fff', textShadow: '0 2px 10px rgba(255, 255, 255, 0.1)' }}>{summary.totalStories || 0}</strong>
          </div>
        </section>

        <p style={{ ...cardStyle, margin: '1rem 0 0', padding: '1rem 1.15rem', lineHeight: 1.65, color: 'rgba(255, 247, 214, 0.9)', fontWeight: 750 }}>
          Explore lucky stories shared by people across Canada. Find yours on the map or share your own lucky moment.
        </p>


        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem', borderRadius: 999, border: '1px solid rgba(255,235,160,0.15)' }}>
            <button
              type="button"
              onClick={() => changeTimeframe('all-time')}
              style={{ padding: '0.65rem 1.45rem', borderRadius: 999, border: timeframeFilter === 'all-time' ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.1)', background: timeframeFilter === 'all-time' ? 'linear-gradient(135deg, rgba(255,248,200,0.15), rgba(250,204,21,0.25))' : 'rgba(255,255,255,0.05)', color: timeframeFilter === 'all-time' ? '#facc15' : '#fdf6e3', fontWeight: timeframeFilter === 'all-time' ? 900 : 700, cursor: 'pointer', transition: 'all 0.2s ease-in-out', boxShadow: timeframeFilter === 'all-time' ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px rgba(255,255,255,0.1)' : 'none' }}
            >
              All-Time
            </button>
            <button
              type="button"
              onClick={() => changeTimeframe('24h')}
              style={{ padding: '0.65rem 1.45rem', borderRadius: 999, border: timeframeFilter === '24h' ? '1px solid rgba(250,204,21,0.3)' : '1px solid rgba(255,255,255,0.1)', background: timeframeFilter === '24h' ? 'linear-gradient(135deg, rgba(255,248,200,0.15), rgba(250,204,21,0.25))' : 'rgba(255,255,255,0.05)', color: timeframeFilter === '24h' ? '#facc15' : '#fdf6e3', fontWeight: timeframeFilter === '24h' ? 900 : 700, cursor: 'pointer', transition: 'all 0.2s ease-in-out', boxShadow: timeframeFilter === '24h' ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px rgba(255,255,255,0.1)' : 'none' }}
            >
              Last 24 Hours
            </button>
          </div>
        </div>

        <section id="lucky-story-map" aria-label="LuckyPickCanada lucky community stories map" className="lucky-story-map" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
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
                className="official-map-image"
              />
              </picture>
              {provinceSelections.map((province) => {
                const provinceCount = province.count;
                const active = selectedProvince === province.code;

                if (mappedStoryCount === 0) return null;
                return (
                  <button
                    key={province.code}
                    type="button"
                    className={`province-marker ${provinceCount ? 'has-stories' : ''} ${active ? 'is-active' : ''}`}
                    data-province={province.code}
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
              {mappedStoryCount === 0 ? (
                <div className="map-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 16 }}>
                  <p style={{ margin: 0, color: '#fde68a', fontSize: '1.2rem', fontWeight: 700 }}>{timeframeFilter === '24h' ? "No stories in the last 24 hours yet. Be the first to share!" : "No community stories with a province are ready for the map yet."}</p>
                  {timeframeFilter === '24h' && (
                    <button type="button" onClick={() => { playButtonClick(); setIsStoryFormOpen(true); }} className="story-link gold-3d-btn" style={{ fontWeight: 900, padding: '0.65rem 1.25rem', borderRadius: 999, cursor: 'pointer' }}>
                      <span className="gold-cta-emoji" aria-hidden="true">✍️</span>Share your lucky story
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <aside ref={storyPanelRef} className="premium-surface map-story-panel" style={{ ...cardStyle, padding: '1.2rem', position: 'relative', overflow: 'hidden' }}>
            <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>{selectedProvinceInfo.name}</p>
            <h2 style={{ margin: '0.45rem 0', fontSize: 'clamp(1.85rem, 4vw, 3rem)', lineHeight: 1 }}>
              {selectedProvinceTotal} {selectedProvinceTotal === 1 ? 'lucky story' : 'lucky stories'}
            </h2>
            <div className="map-province-details" key={selectedProvince}>
            {displayStories.length ? (
              <div style={{ display: 'grid', gap: '0.85rem', marginTop: '1rem' }}>
                {displayStories.map((story) => (
                  <article key={story.id} id={`story-${story.id}`} className="map-story-card" style={{ padding: '1.2rem', borderRadius: 24, border: selectedStory?.id === story.id ? '1px solid rgba(250,204,21,0.72)' : '1px solid rgba(250, 204, 21, 0.38)', background: selectedStory?.id === story.id ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95))' : 'linear-gradient(145deg, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.75))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.25)', transition: 'all 0.2s ease-in-out' }}>
                    <button type="button" onClick={() => openStory(story)} style={{ padding: 0, border: 0, background: 'transparent', color: '#facc15', fontWeight: 900, cursor: 'pointer', textAlign: 'left' }}>
                      Story from {story.firstName || 'a Lucky Canadian'}
                    </button>
                    <p style={{ display: 'inline-flex', margin: '0.55rem 0 0', padding: '0.28rem 0.55rem', border: '1px solid rgba(250,204,21,0.5)', borderRadius: 999, color: '#fde68a', fontSize: '0.8rem', fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase' }}>Community Lucky Story</p>
                    <p style={{ lineHeight: 1.65 }}>{selectedStory?.id === story.id ? story.story : story.preview}</p>
                    <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>{formatRelativeTime(story.createdAt)}</p>
                    {selectedStory?.id === story.id ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', margin: '0.65rem 0 0.85rem' }}>
                        <button type="button" onClick={() => shareStory(story)} className="story-link gold-3d-btn" style={{ fontWeight: 900, padding: '0.65rem 1.25rem', borderRadius: 999, cursor: 'pointer' }}>
                          <span className="clover-3d gold-cta-emoji" aria-hidden="true">🍀</span> Share This Story
                        </button>
                        <button type="button" className={localCelebrated.has(story.id) ? "" : "secondary-action-btn"} onClick={() => reactToStory(story.id)} disabled={localCelebrated.has(story.id)} style={{ padding: '0.65rem 1.25rem', borderRadius: 999, border: '1px solid rgba(250, 204, 21, 0.4)', background: localCelebrated.has(story.id) ? 'rgba(30, 41, 59, 0.8)' : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: localCelebrated.has(story.id) ? '#9ca3af' : '#d1fae5', fontWeight: 900, cursor: localCelebrated.has(story.id) ? 'default' : 'pointer', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s ease' }}>
                          {localCelebrated.has(story.id) ? 'Celebrated 🎉' : 'Celebrate'} {reactions[story.id] ? `(${reactions[story.id]})` : ''}
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
              <p style={{ lineHeight: 1.65, color: 'rgba(255,247,214,0.82)' }}>No Lucky Community Stories have been shared from {selectedProvinceInfo.name} yet. Select another province to keep exploring the Lucky Community Stories map.</p>
            )}
            <div ref={feedSentinelRef} className="map-feed-sentinel" aria-live="polite" style={{ marginTop: '1rem', textAlign: 'center', color: '#fde68a', fontWeight: 800 }}>
              {feedError ? 'Unable to load lucky stories right now. Please try again.' : null}
              {!feedError && isLoadingFeed && displayStories.length > 0 ? 'Loading more lucky stories…' : null}
              {!feedError && !isLoadingFeed && feedHasMore ? 'Scroll for more lucky stories' : null}
            </div>
            </div>
          </aside>
        </section>

        <section className="premium-surface map-community-section" aria-labelledby="recent-activity-heading" style={{ ...cardStyle, marginTop: '1rem', padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ margin: 0, color: '#facc15', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Community</p>
          <h2 id="recent-activity-heading" style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1 }}>Recent Canadian Activity</h2>
          {summary.recentStories.length ? (
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
          <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1 }}>Lucky Community Stories by province</h2>
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
                  <label style={{ color: "#f8fafc", fontWeight: 700 }}>Province or territory<select name="location" required defaultValue="" style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(250, 204, 21, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.9rem 1rem', color: '#fff', fontSize: '1.05rem' }}><option value="" disabled>Select your province or territory</option>{storyProvinceOptions.map((province) => <option key={province.code} value={province.name}>{province.name}</option>)}</select></label>
                  <label style={{ color: "#f8fafc", fontWeight: 700 }}>Tell us your story...<textarea name="story" required minLength="20" maxLength="600" rows="5" onChange={(e) => setStoryFormText(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(250, 204, 21, 0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRadius: '12px', padding: '0.9rem 1rem', color: '#fff', fontSize: '1.05rem', resize: 'vertical' }} /><div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem' }}>{storyFormText.length}/600 characters</div></label>
                  <TurnstileField submitButtonId="lucky-story-submit" action="lucky-story" />
                  <button id="lucky-story-submit" type="submit" disabled={isSubmitting} onClick={playButtonClick} className="gold-3d-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400" style={{ padding: '1rem', borderRadius: 999, fontWeight: 900, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '0.5rem', fontSize: '1.1rem' }}><span className="gold-cta-emoji" aria-hidden="true">📜</span>{isSubmitting ? 'Please wait...' : 'Submit Story'}</button>
                </form>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

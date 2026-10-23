/**
 * Starts immediate and periodic refreshes for the Lucky Map's story payload.
 * Only one request is allowed at a time so slow responses cannot pile up.
 *
 * @param {(mapData: Object) => void} setMapData
 * @returns {() => void} Cleanup function for the active effect.
 */
export function startLuckyStoriesRefresh(setMapData) {
  let isActive = true;
  let isRefreshing = false;

  async function refreshMapData() {
    if (!isActive || isRefreshing) return;
    isRefreshing = true;

    try {
      // The API route is dynamic and sends no-store headers; keep the URL stable for clean logs.
      const response = await fetch('/api/lucky-stories', { cache: 'no-store' });

      if (!response.ok) return;

      const nextMapData = await response.json();

      if (isActive && nextMapData.isConfigured) {
        setMapData(nextMapData);
      }
    } catch {
      // Keep the server-rendered map values visible until the next refresh succeeds.
    } finally {
      isRefreshing = false;
    }
  }

  // Refresh now so stale server-rendered props do not leave the map empty until the first interval.
  void refreshMapData();
  const interval = window.setInterval(refreshMapData, 60_000);

  return () => {
    isActive = false;
    window.clearInterval(interval);
  };
}

export function isLuckyCardTestModeEnabled() {
  if (typeof window === 'undefined') return false;
  const val = window.localStorage.getItem('luckyCardTestModeEnabled');
  return val === 'true';
}


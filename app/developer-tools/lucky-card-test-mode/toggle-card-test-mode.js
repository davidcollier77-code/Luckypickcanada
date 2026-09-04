export const CARD_TEST_MODE = true;

export function isLuckyCardTestModeEnabled() {
  return CARD_TEST_MODE && process.env.NODE_ENV === 'development';
}

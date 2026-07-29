// LUCKY CARD DEVELOPER TEST MODE
// ON = unlimited test reveals
// OFF = normal one-per-day user limit
//
// This switch only takes effect in a local `next dev` session. Production and
// preview builds always keep the public once-per-day behavior, even if set true.
export const CARD_TEST_MODE = false;

export const isLuckyCardTestModeEnabled =
  CARD_TEST_MODE && process.env.NODE_ENV === 'development';

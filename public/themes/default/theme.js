/**
 * Visual-only asset contract for the active Default Theme.
 * Future themes can supply the same shape without changing application behavior.
 */
export const DEFAULT_THEME = Object.freeze({
  id: 'default',
  name: 'Default Theme',
  assets: Object.freeze({
    logo: '/BackgroundEraser_20260724_163638777.png',
    heroCards: Object.freeze([
      '/1784862459046.png',
      '/1784889264858.png',
      '/1784931654864.png',
    ]),
    communityCover: '/FB_IMG_1785107325979.jpg',
  }),
});

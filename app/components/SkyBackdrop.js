/**
 * The shared Milky Way / starfield backdrop.
 *
 * The artwork used to be delivered by a CSS `image-set()` background, which the
 * browser fetches while the stylesheet is being applied and which no client-side
 * adaptive decision can influence. It is now plain responsive markup rendered on
 * the server, so the browser selects the mobile or desktop artwork itself from
 * the `<source media>` list, honours the artwork's intrinsic ratio, and fetches
 * it at low priority: the atmosphere never competes with the hero artwork that
 * carries the largest contentful paint.
 *
 * The artwork, its order of preference (AVIF, then WebP, then JPEG), the focal
 * position and every overlay are unchanged. `.homepage-sky-backdrop` keeps the
 * gradient and the `::after` glow in `themes/default/homepage.css`.
 *
 * @returns {import('react').ReactElement} The decorative sky layer.
 */
const MOBILE_ARTWORK_MEDIA = '(max-width: 820px)';

export default function SkyBackdrop() {
  return (
    <div className="homepage-sky-backdrop" aria-hidden="true">
      <picture className="homepage-sky-backdrop__picture">
        <source
          media={MOBILE_ARTWORK_MEDIA}
          type="image/avif"
          srcSet="/assets/crystal-ball-bg-mobile.avif"
          sizes="100vw"
        />
        <source
          media={MOBILE_ARTWORK_MEDIA}
          type="image/webp"
          srcSet="/assets/crystal-ball-bg-mobile.webp"
          sizes="100vw"
        />
        <source
          media={MOBILE_ARTWORK_MEDIA}
          type="image/jpeg"
          srcSet="/assets/crystal-ball-bg-mobile.jpeg"
          sizes="100vw"
        />
        <source type="image/avif" srcSet="/assets/crystal-ball-bg-desktop.avif" sizes="100vw" />
        <source type="image/webp" srcSet="/assets/crystal-ball-bg-desktop.webp" sizes="100vw" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="homepage-sky-backdrop__art"
          src="/assets/crystal-ball-bg-desktop.jpeg"
          alt=""
          width={1920}
          height={1280}
          loading="eager"
          fetchPriority="low"
          decoding="async"
        />
      </picture>
    </div>
  );
}

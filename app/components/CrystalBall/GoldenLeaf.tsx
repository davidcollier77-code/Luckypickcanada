import type { CSSProperties } from 'react';

const AVIF_SRC = '/assets/golden-maple-leaf.avif';
const WEBP_SRC = '/assets/golden-maple-leaf.webp';
const FALLBACK_SRC = '/assets/golden-maple-leaf.svg';

export default function GoldenLeaf({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <picture
      className={className}
      style={style}
      role="presentation"
      aria-hidden="true"
    >
      <source srcSet={AVIF_SRC} type="image/avif" />
      <source srcSet={WEBP_SRC} type="image/webp" />
      <img
        src={FALLBACK_SRC}
        alt=""
        width={112}
        height={122}
        decoding="async"
        draggable={false}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </picture>
  );
}

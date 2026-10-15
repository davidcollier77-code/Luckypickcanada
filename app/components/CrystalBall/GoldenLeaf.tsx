import { useId, CSSProperties } from 'react';

export default function GoldenLeaf({ className, style }: { className?: string; style?: CSSProperties }) {
  const goldFillId = useId();
  const goldStemId = useId();
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="goldFill" cx="38%" cy="22%" r="95%">
        <radialGradient id={goldFillId} cx="38%" cy="22%" r="95%">
          <stop offset="40%" stopColor="#ffd700" />
          <stop offset="75%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#aa831b" />
        </radialGradient>
        <linearGradient id="goldStem" x1="0%" y1="0%" x2="100%" y2="0%">
        <linearGradient id={goldStemId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#aa831b" />
        </linearGradient>
      </defs>
      <g transform="translate(0, -6)">
        <path fill="url(#goldStem)" stroke="#5c4500" strokeWidth="0.5"
        <path fill={`url(#${goldStemId})`} stroke="#5c4500" strokeWidth="0.5"
        <path fill="url(#goldFill)" stroke="#5c4500" strokeWidth="0.5" strokeLinejoin="round"
        <path fill={`url(#${goldFillId})`} stroke="#5c4500" strokeWidth="0.5" strokeLinejoin="round"
      </g>
    </svg>
  );
}

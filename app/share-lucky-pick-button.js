'use client';

import { useMemo, useState } from 'react';

const buttonStyle = {
  padding: '0.9rem 1.25rem',
  border: 0,
  borderRadius: 999,
  background: 'linear-gradient(135deg, #fff8c8 0%, #f9d86c 22%, #facc15 48%, #b7791f 100%)',
  color: '#071225',
  fontSize: '1rem',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 0 24px rgba(250, 204, 21, 0.44), 0 14px 28px rgba(183, 121, 31, 0.22)',
  transition: 'transform 180ms ease, filter 180ms ease, box-shadow 180ms ease',
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(16, 185, 129, 0.08))',
  color: '#fff7d6',
  border: '1px solid rgba(255, 235, 160, 0.28)',
};

function getShareUrl() {
  if (typeof window === 'undefined') {
    return 'https://luckypickcanada.ca';
  }

  return window.location.origin || 'https://luckypickcanada.ca';
}

export default function ShareLuckyPickButton({ reveal }) {
  const [status, setStatus] = useState('');
  const shareText = useMemo(() => {
    const numbers = reveal.game.numbers.join(', ');

    return `My Lucky Pick Canada ${reveal.game.name}: ${numbers}. Lucky color: ${reveal.luckyColor}. Lucky day: ${reveal.luckyDay}.`;
  }, [reveal]);

  async function copyShareText() {
    const url = getShareUrl();
    const textToCopy = `${shareText}\n${url}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setStatus('Copied. Paste it into Instagram, Facebook, or a message.');
        return;
      }
    } catch (error) {
      // Fall through to the manual copy prompt.
    }

    window.prompt('Copy your lucky pick:', textToCopy);
    setStatus('Copy your pick, then paste it into Instagram, Facebook, or a message.');
  }

  async function shareLuckyPick() {
    const url = getShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Lucky Pick Canada result',
          text: shareText,
          url,
        });
        setStatus('Shared. Good luck.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
      }
    }

    await copyShareText();
  }

  function shareToFacebook() {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
    setStatus('Facebook opened. Add your lucky pick text if you want to personalize the post.');
  }

  return (
    <div style={{ marginTop: '1.4rem', display: 'grid', gap: '0.75rem' }}>
      <style>{`.share-lucky-button:hover { transform: translateY(-2px); filter: saturate(1.1); }`}</style>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <button type="button" onClick={shareLuckyPick} className="share-lucky-button" style={buttonStyle}>
          Share my lucky pick
        </button>
        <button type="button" onClick={shareToFacebook} className="share-lucky-button" style={secondaryButtonStyle}>
          Facebook
        </button>
        <button type="button" onClick={copyShareText} className="share-lucky-button" style={secondaryButtonStyle}>
          Copy for Instagram
        </button>
      </div>
      <p style={{ margin: 0, color: 'rgba(255, 245, 203, 0.78)', lineHeight: 1.5 }}>
        Instagram web sharing is limited, so copy your pick and paste it into a post, story, or message.
      </p>
      {status ? <p role="status" style={{ margin: 0, color: '#facc15', fontWeight: 900 }}>{status}</p> : null}
    </div>
  );
}

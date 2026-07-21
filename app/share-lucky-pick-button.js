'use client';

import { useEffect, useMemo, useState } from 'react';

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
  boxShadow: '0 12px 26px rgba(0, 0, 0, 0.24)',
};

const quietButtonStyle = {
  ...secondaryButtonStyle,
  padding: '0.78rem 1rem',
  fontSize: '0.95rem',
};

function getShareUrl() {
  if (typeof window === 'undefined') {
    return 'https://luckypickcanada.ca';
  }

  return window.location.origin || 'https://luckypickcanada.ca';
}

function openShareWindow(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function ShareLuckyPickButton({ reveal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [shareUrl, setShareUrl] = useState('https://luckypickcanada.ca');

  useEffect(() => {
    setShareUrl(getShareUrl());
  }, []);

  const shareDetails = useMemo(() => {
    const numbers = reveal.game.numbers.join(', ');
    const message = `I just revealed my ${reveal.game.name} on LuckyPickCanada.ca: ${numbers}. My lucky day is ${reveal.luckyDay}, and my lucky color of the week is ${reveal.luckyColor}. Sending a little Canadian luck your way from LuckyPickCanada.ca.`;

    return {
      numbers,
      message,
      title: 'Share Your Luck from LuckyPickCanada.ca',
    };
  }, [reveal]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(shareDetails.message);
  const encodedTitle = encodeURIComponent(shareDetails.title);

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setStatus(successMessage);
        return;
      }
    } catch (error) {
      // Fall through to the manual copy prompt.
    }

    window.prompt('Copy your LuckyPickCanada share:', text);
    setStatus(successMessage);
  }

  async function copyShareLink() {
    await copyText(shareUrl, 'Share link copied. Send it to friends and family whenever you like.');
  }

  async function copyShareCardMessage() {
    await copyText(`${shareDetails.message}\n${shareUrl}`, 'Share message copied. Paste it into a post, story, text, or group chat.');
  }

  async function shareDirectly() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareDetails.title,
          text: shareDetails.message,
          url: shareUrl,
        });
        setStatus('Shared. Keep the luck going.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
      }
    }

    await copyShareCardMessage();
  }

  function shareToFacebook() {
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
    setStatus('Facebook opened. Add your LuckyPickCanada message to personalize the post.');
  }

  function shareToX() {
    openShareWindow(`https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`);
    setStatus('Social post opened with your lucky message.');
  }

  function shareToWhatsApp() {
    openShareWindow(`https://wa.me/?text=${encodedMessage}%20${encodedUrl}`);
    setStatus('WhatsApp opened for friends and family sharing.');
  }

  return (
    <div style={{ marginTop: '1.4rem', display: 'grid', gap: '0.75rem' }}>
      <style>{`
        .share-lucky-button:hover { transform: translateY(-2px); filter: saturate(1.1); }
        .share-luck-card { position: relative; overflow: hidden; }
        .share-luck-card::before { content: ''; position: absolute; inset: -35% -20% auto; height: 75%; border-radius: 999px; background: linear-gradient(90deg, rgba(16,185,129,0), rgba(16,185,129,0.45), rgba(250,204,21,0.34), rgba(16,185,129,0)); filter: blur(10px); transform: rotate(-8deg); pointer-events: none; }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <button type="button" onClick={() => setIsOpen((current) => !current)} className="share-lucky-button" style={buttonStyle} aria-expanded={isOpen}>
          Share Your Luck 🍀
        </button>
        <p style={{ margin: 0, color: 'rgba(255, 245, 203, 0.78)', lineHeight: 1.5 }}>
          Optional: create a shareable LuckyPickCanada card after your reveal.
        </p>
      </div>

      {isOpen ? (
        <section aria-label="Share Your Luck options" className="share-luck-card" style={{ padding: '1rem', borderRadius: 24, border: '1px solid rgba(255, 235, 160, 0.32)', background: 'radial-gradient(circle at 15% 10%, rgba(250,204,21,0.2), transparent 24%), linear-gradient(145deg, rgba(255,255,255,0.12), rgba(16,185,129,0.1))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 48px rgba(0,0,0,0.24)' }}>
          <div style={{ position: 'relative', display: 'grid', gap: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <img src="/file_00000000e8b8722f909e901d9b84325d.png" alt="LuckyPickCanada logo" width="48" height="48" style={{ borderRadius: 14, filter: 'drop-shadow(0 0 14px rgba(250,204,21,0.42))' }} />
              <div>
                <p style={{ margin: 0, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: '0.78rem', fontWeight: 950 }}>LuckyPickCanada.ca</p>
                <h3 style={{ margin: '0.1rem 0 0', fontSize: 'clamp(1.45rem, 5vw, 2.2rem)', lineHeight: 1 }}>My LuckyPick reveal</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {reveal.game.numbers.map((number) => (
                <span key={number} style={{ display: 'inline-grid', placeItems: 'center', width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle at 30% 25%, #fff7d6, #facc15 48%, #b7791f 100%)', color: '#071225', fontWeight: 950, boxShadow: '0 0 20px rgba(250, 204, 21, 0.54)' }}>
                  {number}
                </span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.8rem', borderRadius: 18, background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(52,211,153,0.3)' }}>
                <p style={{ margin: '0 0 0.25rem', color: '#34d399', fontWeight: 850 }}>Lucky day</p>
                <strong>{reveal.luckyDay}</strong>
              </div>
              <div style={{ padding: '0.8rem', borderRadius: 18, background: 'rgba(253,230,138,0.14)', border: '1px solid rgba(253,230,138,0.3)' }}>
                <p style={{ margin: '0 0 0.25rem', color: '#fde68a', fontWeight: 850 }}>Lucky color of the week</p>
                <strong>{reveal.luckyColor}</strong>
              </div>
            </div>

            <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,247,214,0.9)', fontWeight: 750 }}>
              {shareDetails.message}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
              <button type="button" onClick={shareDirectly} className="share-lucky-button" style={secondaryButtonStyle}>
                Share directly
              </button>
              <button type="button" onClick={copyShareLink} className="share-lucky-button" style={quietButtonStyle}>
                Copy share link
              </button>
              <button type="button" onClick={copyShareCardMessage} className="share-lucky-button" style={quietButtonStyle}>
                Copy card message
              </button>
              <button type="button" onClick={shareToFacebook} className="share-lucky-button" style={quietButtonStyle}>
                Facebook
              </button>
              <button type="button" onClick={shareToX} className="share-lucky-button" style={quietButtonStyle}>
                X
              </button>
              <button type="button" onClick={shareToWhatsApp} className="share-lucky-button" style={quietButtonStyle}>
                Friends and family
              </button>
              <a href={`mailto:?subject=${encodedTitle}&body=${encodedMessage}%0A${encodedUrl}`} className="share-lucky-button" style={{ ...quietButtonStyle, display: 'inline-flex', textDecoration: 'none' }}>
                Email
              </a>
              <a href={`sms:?&body=${encodedMessage}%20${encodedUrl}`} className="share-lucky-button" style={{ ...quietButtonStyle, display: 'inline-flex', textDecoration: 'none' }}>
                Text
              </a>
            </div>

            {status ? <p role="status" style={{ margin: 0, color: '#facc15', fontWeight: 900 }}>{status}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

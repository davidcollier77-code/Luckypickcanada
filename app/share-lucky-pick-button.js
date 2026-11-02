'use client';
import { playButtonClick } from './lib/audio';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLuckyRevealShareImage } from './lucky-reveal-share-image';
import { LUCKY_SITE_HOST, LUCKY_SITE_URL, buildShareMessage } from './lucky-reveal-presentation';

const buttonStyle = {
  padding: '1rem 2rem',
  border: '1px solid #fff2a8',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #fff2a8 0%, #fbe59a 14%, #e8c970 38%, #dcae4e 62%, #c8942c 82%, #b8801f 100%)',
  color: '#1c1200',
  fontSize: '1rem',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 3px 0 #8a550c, 0 6px 0 rgba(95, 55, 5, 0.45), 0 10px 25px rgba(138, 85, 12, 0.34), 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  touchAction: 'manipulation',
};

const optionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  padding: '0.85rem 1.1rem',
  borderRadius: 14,
  border: '1px solid rgba(255, 235, 160, 0.3)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(16, 185, 129, 0.1) 100%)',
  color: '#fff7d6',
  fontSize: '0.95rem',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, transform 0.2s ease, background 0.2s ease',
};

async function copyImageToClipboard(file) {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    return false;
  }

  try {
    await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
    return true;
  } catch {
    return false;
  }
}

export default function ShareLuckyPickButton({ reveal }) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [isFallbackOpen, setIsFallbackOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [shareFile, setShareFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [canCopyImage, setCanCopyImage] = useState(false);
  const fileRef = useRef(null);
  const fallbackRef = useRef(null);

  useEffect(() => {
    setCanCopyImage(typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write));
  }, []);

  // The same object URL powers the preview and the download, and is revoked when
  // the sharing window closes or the reveal unmounts.
  useEffect(() => {
    if (!isFallbackOpen || !shareFile) {
      setPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(shareFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isFallbackOpen, shareFile]);

  useEffect(() => {
    if (!isFallbackOpen) return undefined;

    fallbackRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsFallbackOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFallbackOpen]);

  const prepareShareFile = useCallback(async () => {
    if (fileRef.current) return fileRef.current;
    const file = await createLuckyRevealShareImage(reveal);
    fileRef.current = file;
    return file;
  }, [reveal]);

  async function handleShare() {
    if (isPreparing) return;

    playButtonClick();
    setIsPreparing(true);
    setStatus('');

    try {
      const file = await prepareShareFile();
      const shareData = {
        files: [file],
        title: 'My LuckyPickCanada reveal',
        text: buildShareMessage(reveal),
      };

      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(shareData))) {
        try {
          await navigator.share(shareData);
          setStatus('Shared. Keep the luck going. 🍀');
          return;
        } catch (error) {
          if (error?.name === 'AbortError') {
            setStatus('Sharing cancelled.');
            return;
          }
          // The device refused the native share, so use the compact fallback.
        }
      }

      setShareFile(file);
      setIsFallbackOpen(true);
    } catch {
      setStatus('We could not prepare your reveal image. Please try again.');
    } finally {
      setIsPreparing(false);
    }
  }

  async function copyImage() {
    if (!shareFile) return;
    const copied = await copyImageToClipboard(shareFile);
    setStatus(
      copied
        ? 'Reveal image copied. Paste it into your message, post, or story.'
        : 'Copying images is not supported on this device. Download the image instead.',
    );
  }

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(LUCKY_SITE_URL);
        setStatus('Website link copied.');
        return;
      }
    } catch {
      // Fall through to the manual copy prompt.
    }

    window.prompt('Copy the LuckyPickCanada link:', LUCKY_SITE_URL);
    setStatus('Website link copied.');
  }

  return (
    <div style={{ marginTop: '1.4rem', display: 'grid', gap: '0.75rem' }}>
      <style>{`
        .share-lucky-button-main {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .share-lucky-button-main:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.03) !important;
          box-shadow: 0 5px 0 #8a550c, 0 8px 0 rgba(95, 55, 5, 0.42), 0 16px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          filter: brightness(1.05);
        }
        .share-lucky-button-main:active:not(:disabled) {
          transform: translateY(1px) scale(0.97) !important;
          box-shadow: 0 1px 0 #8a550c, 0 2px 5px rgba(0, 0, 0, 0.36) !important;
          filter: brightness(0.95);
        }
        .share-lucky-button-main:disabled { cursor: progress; opacity: 0.82; }

        .share-lucky-option { touch-action: manipulation; }
        .share-lucky-option:hover {
          border-color: rgba(255, 235, 160, 0.55) !important;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(16, 185, 129, 0.18) 100%) !important;
          transform: translateY(-1px);
        }

        .share-lucky-sheet {
          position: relative;
          width: min(100%, 420px);
          padding: 1.1rem;
          border-radius: 22px;
          border: 1px solid rgba(255, 235, 160, 0.34);
          background: radial-gradient(circle at 15% 8%, rgba(250, 204, 21, 0.18), transparent 30%), linear-gradient(150deg, rgba(9, 20, 32, 0.96), rgba(3, 10, 18, 0.98));
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(18px);
          max-height: 92vh;
          overflow: auto;
        }

        @media (prefers-reduced-motion: reduce) {
          .share-lucky-button-main:hover:not(:disabled),
          .share-lucky-button-main:active:not(:disabled),
          .share-lucky-option:hover { transform: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={handleShare}
        className="share-lucky-button-main gold-3d-btn"
        style={buttonStyle}
        disabled={isPreparing}
        aria-busy={isPreparing}
      >
        {isPreparing ? 'Preparing your reveal…' : 'Share My Reveal'}
      </button>
      <p style={{ margin: 0, color: 'rgba(255, 245, 203, 0.78)', lineHeight: 1.5 }}>
        Sends your static lucky reveal image and its results to any app on your device.
      </p>

      {status ? <p role="status" style={{ margin: 0, color: '#facc15', fontWeight: 800 }}>{status}</p> : null}

      {isFallbackOpen ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            background: 'rgba(2, 5, 10, 0.72)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-reveal-title"
            tabIndex={-1}
            ref={fallbackRef}
            className="share-lucky-sheet"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.9rem' }}>
              <div>
                <p style={{ margin: 0, color: '#34d399', fontSize: '0.72rem', fontWeight: 900, letterSpacing: 1.6, textTransform: 'uppercase' }}>LuckyPickCanada.ca</p>
                <h3 id="share-reveal-title" style={{ margin: '0.15rem 0 0', color: '#fff7d6', fontSize: '1.2rem', lineHeight: 1.2 }}>Share your reveal</h3>
              </div>
              <button
                type="button"
                aria-label="Close sharing options"
                onClick={() => setIsFallbackOpen(false)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 235, 160, 0.24)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  color: '#fff7d6',
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Your ${reveal.game.name} reveal image`}
                width="1200"
                height="1500"
                style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 16, border: '1px solid rgba(255, 235, 160, 0.24)', marginBottom: '0.9rem' }}
              />
            ) : null}

            <div style={{ display: 'grid', gap: '0.55rem' }}>
              <a
                href={previewUrl || undefined}
                download="lucky-reveal.png"
                className="share-lucky-option"
                style={{ ...optionStyle, textDecoration: 'none' }}
              >
                <span aria-hidden="true">⬇</span> Download the image
              </a>
              {canCopyImage ? (
                <button type="button" className="share-lucky-option" style={optionStyle} onClick={copyImage}>
                  <span aria-hidden="true">⧉</span> Copy the image
                </button>
              ) : null}
              <button type="button" className="share-lucky-option" style={optionStyle} onClick={copyLink}>
                <span aria-hidden="true">🔗</span> Copy the website link
              </button>
            </div>

            <p style={{ margin: '0.8rem 0 0', color: 'rgba(255, 247, 214, 0.62)', fontSize: '0.78rem', lineHeight: 1.45 }}>
              Image includes your numbers, lucky colour, lucky day, and {LUCKY_SITE_HOST} branding.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

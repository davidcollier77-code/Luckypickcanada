'use client';
import { playButtonClick } from './lib/audio';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLuckyRevealShareImage } from './lucky-reveal-share-image';
import { LUCKY_SITE_URL, buildShareMessage, getShareLink } from './lucky-reveal-presentation';

const buttonStyle = {
  minHeight: 52,
  padding: '1rem 2rem',
  border: '1px solid #fff2a8',
  borderRadius: 999,
  background: 'linear-gradient(180deg, #fff2a8 0%, #fbe59a 14%, #e8c970 38%, #dcae4e 62%, #c8942c 82%, #b8801f 100%)',
  color: '#1c1200',
  fontSize: '1rem',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 3px 0 #8a550c, 0 6px 0 rgba(95, 55, 5, 0.45), 0 10px 25px rgba(138, 85, 12, 0.34), 0 4px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.6rem',
  width: '100%',
  touchAction: 'manipulation',
};

const optionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  minHeight: 48,
  padding: '0.85rem 1.1rem',
  borderRadius: 14,
  border: '1px solid rgba(255, 235, 160, 0.3)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(16, 185, 129, 0.1) 100%)',
  color: '#fff7d6',
  fontSize: '0.95rem',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'border-color 0.2s ease, transform 0.2s ease, background 0.2s ease',
  touchAction: 'manipulation',
};

// Android (and other mobile browsers) only open the native share sheet while the
// tap still holds transient user activation. Drawing the 1200x1500 reveal image
// takes long enough to lose it, so the image is prepared shortly after the
// reveal appears and the tap handler shares it without awaiting anything.
const SHARE_IMAGE_WARMUP_MS = 1200;

// Recognisable share marks: three connected nodes for "Share to Apps" and a
// simple glyph for each preserved action.
const shareIcon = (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.6" y1="10.7" x2="15.4" y2="6.3" />
    <line x1="8.6" y1="13.3" x2="15.4" y2="17.7" />
  </svg>
);

const linkIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 4.93" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.8 13.12a5 5 0 0 0 7.07 7.07L13 19.07" />
  </svg>
);

const copyIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

const downloadIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M4 21h16" />
  </svg>
);

const NO_NATIVE_SHARE =
  'App sharing is not available in this browser. Use Copy link, Copy image, or Download below.';
const NATIVE_SHARE_FAILED =
  'Your device could not open the share panel for this result. Use Copy link, Copy image, or Download below.';

/**
 * Reports whether the browser accepts a native payload. A throwing `canShare`
 * is treated as a refusal rather than a reason to try anyway.
 *
 * @param {object} payload Native share payload.
 * @returns {boolean} True when the payload can be handed to `navigator.share`.
 */
function canShareNative(payload) {
  if (typeof navigator.share !== 'function') return false;
  // Browsers without canShare() get the one attempt; the share call decides.
  if (typeof navigator.canShare !== 'function') return true;

  try {
    return navigator.canShare(payload);
  } catch {
    return false;
  }
}

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
  const [isSharing, setIsSharing] = useState(false);
  const [status, setStatus] = useState('');
  const [canCopyImage, setCanCopyImage] = useState(false);
  const [canUseNativeShare, setCanUseNativeShare] = useState(true);
  // The prepared image, the message and the link are all ready before the tap,
  // so the tap handler can call navigator.share synchronously.
  const fileRef = useRef(null);
  const filePromiseRef = useRef(null);

  useEffect(() => {
    setCanCopyImage(typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write));
    setCanUseNativeShare(typeof navigator.share === 'function');
  }, []);

  // One reveal image is drawn once and reused by every option. Preparing it
  // ahead of the tap is what keeps the native share sheet inside the tap's
  // transient activation window on Android.
  const prepareShareFile = useCallback(() => {
    if (fileRef.current) return Promise.resolve(fileRef.current);
    if (!filePromiseRef.current) {
      filePromiseRef.current = createLuckyRevealShareImage(reveal)
        .then((file) => {
          fileRef.current = file;
          return file;
        })
        .catch((error) => {
          filePromiseRef.current = null;
          throw error;
        });
    }
    return filePromiseRef.current;
  }, [reveal]);

  useEffect(() => {
    if (fileRef.current) return undefined;

    const timer = window.setTimeout(() => {
      prepareShareFile().catch(() => {
        // The three local actions report their own failure if it is still broken.
      });
    }, SHARE_IMAGE_WARMUP_MS);

    return () => window.clearTimeout(timer);
  }, [prepareShareFile]);

  function shareToApps() {
    if (isSharing) return;

    playButtonClick();
    setStatus('');

    if (typeof navigator.share !== 'function') {
      // Graceful fallback: nothing is hidden and the three local options still work.
      setStatus(NO_NATIVE_SHARE);
      return;
    }

    const title = 'My LuckyPickCanada reveal';
    const text = buildShareMessage(reveal);
    const link = getShareLink(reveal);
    const file = fileRef.current;

    // One payload, chosen synchronously, and exactly one navigator.share call.
    // No await happens before it, so Android still sees the tap's activation.
    const imagePayload = file ? { files: [file], title, text, url: link } : null;
    const payload = imagePayload && canShareNative(imagePayload)
      ? imagePayload
      : { title, text, url: link };

    if (!canShareNative(payload)) {
      setStatus(NATIVE_SHARE_FAILED);
      return;
    }

    setIsSharing(true);

    let shareResult;
    try {
      shareResult = navigator.share(payload);
    } catch {
      // A synchronous throw is a failure, not a cancellation, and is not retried.
      setIsSharing(false);
      setStatus(NATIVE_SHARE_FAILED);
      return;
    }

    Promise.resolve(shareResult)
      .then(() => {
        setIsSharing(false);
        setStatus('Shared. Keep the luck going. 🍀');
      })
      .catch((error) => {
        setIsSharing(false);
        setStatus(
          error?.name === 'AbortError'
            ? 'Sharing cancelled.'
            : NATIVE_SHARE_FAILED,
        );
      });
  }

  async function copyImage() {
    setStatus('');

    let file = null;
    try {
      file = await prepareShareFile();
    } catch {
      file = null;
    }

    if (!file) {
      setStatus('We could not prepare your reveal image. Try Download instead.');
      return;
    }

    const copied = await copyImageToClipboard(file);
    setStatus(
      copied
        ? 'Reveal image copied. Paste it into your message, post, or story.'
        : 'Copying images is not supported on this device. Download the image instead.',
    );
  }

  async function downloadImage() {
    setStatus('');

    let file = null;
    try {
      file = await prepareShareFile();
    } catch {
      file = null;
    }

    if (!file) {
      setStatus('We could not prepare your reveal image. Please try again.');
      return;
    }

    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name || 'lucky-reveal.png';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Reveal image download started.');
  }

  async function copyLink() {
    setStatus('');
    const link = getShareLink(reveal);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setStatus(link === LUCKY_SITE_URL ? 'Website link copied.' : 'Result link copied.');
        return;
      }
    } catch {
      // Fall through to the manual fallback; never claim a copy that failed.
    }

    // The link stays visible and selectable so it can still be copied by hand.
    setStatus(`Automatic copying is unavailable. Your reveal link: ${link}`);
  }

  return (
    <div
      role="group"
      aria-label="Share your reveal"
      style={{ marginTop: '1.4rem', display: 'grid', gap: '0.75rem' }}
    >
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

        @media (prefers-reduced-motion: reduce) {
          .share-lucky-button-main:hover:not(:disabled),
          .share-lucky-button-main:active:not(:disabled),
          .share-lucky-option:hover { transform: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={shareToApps}
        className="share-lucky-button-main gold-3d-btn"
        style={buttonStyle}
        disabled={isSharing}
        aria-busy={isSharing}
      >
        {shareIcon}
        {isSharing ? 'Opening your share panel…' : 'Share to Apps'}
      </button>
      <p style={{ margin: 0, color: 'rgba(255, 245, 203, 0.78)', lineHeight: 1.5 }}>
        {canUseNativeShare
          ? 'Opens your device’s share panel with your static lucky reveal image, its numbers, and a link — send it to any installed app, including messaging apps.'
          : 'Your device has no app share panel, so your reveal image and link are ready to copy or download below.'}
      </p>

      {status ? <p role="status" style={{ margin: 0, color: '#facc15', fontWeight: 800 }}>{status}</p> : null}

      {/* The three existing actions are always visible, never hidden behind the
          native share panel, so sharing still works without Web Share. */}
      <div
        className="share-lucky-actions"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.6rem' }}
      >
        <button type="button" className="share-lucky-option" style={optionStyle} onClick={copyLink}>
          {linkIcon} Copy the website link
        </button>
        {canCopyImage ? (
          <button type="button" className="share-lucky-option" style={optionStyle} onClick={copyImage}>
            {copyIcon} Copy the image
          </button>
        ) : null}
        <button type="button" className="share-lucky-option" style={optionStyle} onClick={downloadImage}>
          {downloadIcon} Download the image
        </button>
      </div>

      <p style={{ margin: 0, color: 'rgba(255, 247, 214, 0.62)', fontSize: '0.78rem', lineHeight: 1.45 }}>
        Image includes your numbers, lucky colour, lucky day, and {LUCKY_SITE_URL.replace('https://', '')} branding.
      </p>
    </div>
  );
}

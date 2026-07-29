'use client';

import { useState } from 'react';

const SHARE_TEXT = 'I revealed a Lucky Card from LuckyPickCanada.ca.';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

function wrapText(context, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function drawCoverImage(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

async function createShareImage(card) {
  const width = 1200;
  const height = 1500;
  const padding = 88;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#102f2b');
  background.addColorStop(0.52, '#0a1723');
  background.addColorStop(1, '#24132e');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(width * 0.78, height * 0.06, 0, width * 0.78, height * 0.06, 600);
  glow.addColorStop(0, 'rgba(250, 204, 21, 0.34)');
  glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(255, 235, 160, 0.32)';
  context.lineWidth = 3;
  drawRoundedRect(context, 36, 36, width - 72, height - 72, 48);
  context.stroke();

  context.fillStyle = '#f8d575';
  context.font = '800 34px system-ui, sans-serif';
  context.fillText('LUCKYPICKCANADA.CA', padding, 125);

  context.fillStyle = '#fff6cf';
  context.font = '800 62px Georgia, serif';
  context.fillText('My Lucky Card', padding, 202);

  try {
    const logo = await loadImage('/BackgroundEraser_20260724_163638777.png');
    context.drawImage(logo, width - padding - 104, 74, 104, 104);
  } catch {
    // The text branding remains visible if the logo cannot be loaded.
  }

  const artworkX = padding;
  const artworkY = 260;
  const artworkWidth = width - padding * 2;
  const artworkHeight = 680;
  context.save();
  drawRoundedRect(context, artworkX, artworkY, artworkWidth, artworkHeight, 34);
  context.clip();
  const artworkBackground = context.createLinearGradient(artworkX, artworkY, artworkX + artworkWidth, artworkY + artworkHeight);
  artworkBackground.addColorStop(0, '#1d6a59');
  artworkBackground.addColorStop(1, '#25152f');
  context.fillStyle = artworkBackground;
  context.fillRect(artworkX, artworkY, artworkWidth, artworkHeight);

  if (card.image) {
    try {
      const artwork = await loadImage(card.image);
      drawCoverImage(context, artwork, artworkX, artworkY, artworkWidth, artworkHeight);
      context.fillStyle = 'rgba(4, 12, 18, 0.3)';
      context.fillRect(artworkX, artworkY, artworkWidth, artworkHeight);
    } catch {
      // Use the branded background when an artwork file is unavailable.
    }
  }

  context.restore();
  context.strokeStyle = 'rgba(255, 235, 160, 0.55)';
  context.lineWidth = 3;
  drawRoundedRect(context, artworkX, artworkY, artworkWidth, artworkHeight, 34);
  context.stroke();

  context.fillStyle = '#fff4c8';
  context.font = '800 54px Georgia, serif';
  const titleLines = wrapText(context, card.title, artworkWidth);
  titleLines.slice(0, 2).forEach((line, index) => context.fillText(line, padding, 1030 + index * 65));

  context.fillStyle = '#d9f8df';
  context.font = 'italic 38px Georgia, serif';
  const quoteLines = wrapText(context, `“${card.quote || 'A little Canadian luck for your day.'}”`, artworkWidth);
  quoteLines.slice(0, 4).forEach((line, index) => context.fillText(line, padding, 1180 + index * 52));

  context.fillStyle = '#f8d575';
  context.font = '700 30px system-ui, sans-serif';
  context.fillText('A little Canadian magic for today', padding, 1410);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Unable to create the share image.');

  return new File([blob], 'my-lucky-card.png', { type: 'image/png' });
}

export default function LuckyCardShare({ card }) {
  const [status, setStatus] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  async function shareCard() {
    setIsSharing(true);
    setStatus('');

    try {
      const file = await createShareImage(card);
      const shareData = { title: card.title, text: SHARE_TEXT, files: [file] };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setStatus('Your card is ready to share.');
        return;
      }

      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setStatus('Your card image was downloaded. You can share it from your photos.');
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setStatus('We could not prepare your card image. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="lucky-card-share">
      <button type="button" className="lucky-card-share-button" onClick={shareCard} disabled={isSharing}>
        {isSharing ? 'Preparing Your Card…' : 'Share Your Lucky Card'}
      </button>
      {status && <p className="lucky-card-share-status" role="status">{status}</p>}
    </div>
  );
}

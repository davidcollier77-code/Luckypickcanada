'use client';

import {
  LUCKY_SITE_HOST,
  getLuckyColorSwatch,
  splitLuckyNumberRows,
} from './lucky-reveal-presentation';

// The static share image is drawn from the reveal data already on screen. It
// never generates numbers: the exact stored pick, colour, and day are drawn.

const WIDTH = 1200;
const HEIGHT = 1500;
const PADDING = 96;
const LOGO_SRC = '/BackgroundEraser_20260724_163638777.png';

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

function seededStars(count) {
  let seed = 20261102;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  return Array.from({ length: count }, () => ({
    x: next() * WIDTH,
    y: next() * HEIGHT,
    radius: 0.8 + next() * 2.4,
    alpha: 0.16 + next() * 0.55,
  }));
}

function drawBackground(context) {
  const sky = context.createLinearGradient(0, 0, WIDTH * 0.4, HEIGHT);
  sky.addColorStop(0, '#041019');
  sky.addColorStop(0.5, '#071a26');
  sky.addColorStop(1, '#030b14');
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const goldGlow = context.createRadialGradient(WIDTH * 0.82, HEIGHT * 0.04, 0, WIDTH * 0.82, HEIGHT * 0.04, 620);
  goldGlow.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
  goldGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
  context.fillStyle = goldGlow;
  context.fillRect(0, 0, WIDTH, HEIGHT * 0.5);

  const greenGlow = context.createRadialGradient(WIDTH * 0.12, HEIGHT * 0.9, 0, WIDTH * 0.12, HEIGHT * 0.9, 560);
  greenGlow.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
  greenGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  context.fillStyle = greenGlow;
  context.fillRect(0, HEIGHT * 0.5, WIDTH, HEIGHT * 0.5);

  for (const star of seededStars(110)) {
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(255, 249, 219, ${star.alpha})`;
    context.fill();
  }

  context.strokeStyle = 'rgba(255, 235, 160, 0.34)';
  context.lineWidth = 3;
  drawRoundedRect(context, 34, 34, WIDTH - 68, HEIGHT - 68, 52);
  context.stroke();
}

function fitFontSize(context, text, maxWidth, startSize, weight, family, minimum = 18) {
  let size = startSize;

  do {
    context.font = `${weight} ${size}px ${family}`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > minimum);

  return size;
}

function drawHeader(context, reveal, logo) {
  context.fillStyle = '#f8d575';
  context.font = '800 30px system-ui, sans-serif';
  context.fillText('LUCKYPICKCANADA.CA', PADDING, 168);

  context.fillStyle = '#fff6cf';
  context.font = '800 82px Georgia, serif';
  context.fillText('My Lucky Reveal', PADDING, 262);

  context.fillStyle = '#6ee7b7';
  context.font = '700 34px system-ui, sans-serif';
  context.fillText(reveal.game.name, PADDING, 322);

  if (logo) {
    context.drawImage(logo, WIDTH - PADDING - 116, 84, 116, 116);
  }
}

function drawNumbers(context, numbers) {
  const rows = splitLuckyNumberRows(numbers);
  const rowTop = 404;

  rows.forEach((row, rowIndex) => {
    const ballSize = row.length >= 4 ? 132 : 156;
    const gap = 28;
    const rowWidth = row.length * ballSize + (row.length - 1) * gap;
    const startX = (WIDTH - rowWidth) / 2;
    const y = rowTop + rowIndex * (ballSize + 34);

    row.forEach((number, columnIndex) => {
      const x = startX + columnIndex * (ballSize + gap);
      const centreX = x + ballSize / 2;
      const centreY = y + ballSize / 2;

      context.save();
      context.shadowColor = 'rgba(250, 204, 21, 0.55)';
      context.shadowBlur = 28;
      const ball = context.createRadialGradient(
        x + ballSize * 0.34,
        y + ballSize * 0.28,
        4,
        centreX,
        centreY,
        ballSize * 0.72,
      );
      ball.addColorStop(0, '#fff7d6');
      ball.addColorStop(0.48, '#facc15');
      ball.addColorStop(1, '#b7791f');
      context.fillStyle = ball;
      context.beginPath();
      context.arc(centreX, centreY, ballSize / 2, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.strokeStyle = 'rgba(255, 245, 203, 0.75)';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(centreX, centreY, ballSize / 2 - 2, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = '#071225';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const numberSize = number >= 10 ? 52 : 58;
      context.font = `900 ${numberSize}px system-ui, sans-serif`;
      context.fillText(String(number), centreX, centreY + 2);
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
    });
  });

  return rowTop + rows.length * 170;
}

function drawSwatch(context, centreX, centreY, radius, luckyColor) {
  const swatch = getLuckyColorSwatch(luckyColor);

  context.save();
  context.shadowColor = swatch.ring;
  context.shadowBlur = 24;
  const gradient = context.createRadialGradient(
    centreX - radius * 0.36,
    centreY - radius * 0.4,
    radius * 0.1,
    centreX,
    centreY,
    radius,
  );
  gradient.addColorStop(0, swatch.from);
  gradient.addColorStop(1, swatch.to);
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(centreX, centreY, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.strokeStyle = 'rgba(255, 245, 203, 0.7)';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centreX, centreY, radius - 1.5, 0, Math.PI * 2);
  context.stroke();
}

function drawDayMarker(context, centreX, centreY, radius) {
  context.save();
  context.shadowColor = 'rgba(253, 230, 138, 0.6)';
  context.shadowBlur = 20;
  context.strokeStyle = 'rgba(253, 230, 138, 0.85)';
  context.fillStyle = 'rgba(253, 230, 138, 0.2)';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centreX, centreY, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();

  context.save();
  context.translate(centreX, centreY);
  context.rotate(Math.PI / 4);
  context.fillStyle = '#fde68a';
  context.fillRect(-9, -9, 18, 18);
  context.restore();
}

function drawResultCards(context, reveal) {
  const cardY = 872;
  const cardHeight = 264;
  const gap = 48;
  const cardWidth = (WIDTH - PADDING * 2 - gap) / 2;

  const cards = [
    {
      x: PADDING,
      label: 'LUCKY COLOUR',
      value: reveal.luckyColor,
      accent: '#6ee7b7',
      fill: 'rgba(16, 185, 129, 0.16)',
      stroke: 'rgba(52, 211, 153, 0.38)',
    },
    {
      x: PADDING + cardWidth + gap,
      label: 'LUCKY DAY',
      value: reveal.luckyDay,
      accent: '#fde68a',
      fill: 'rgba(253, 230, 138, 0.14)',
      stroke: 'rgba(253, 230, 138, 0.36)',
    },
  ];

  cards.forEach((card, index) => {
    drawRoundedRect(context, card.x, cardY, cardWidth, cardHeight, 30);
    context.fillStyle = card.fill;
    context.fill();
    context.strokeStyle = card.stroke;
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle = card.accent;
    context.font = '800 25px system-ui, sans-serif';
    context.fillText(card.label, card.x + 38, cardY + 68);

    const markerX = card.x + 84;
    const markerY = cardY + 164;
    if (index === 0) {
      drawSwatch(context, markerX, markerY, 40, reveal.luckyColor);
    } else {
      drawDayMarker(context, markerX, markerY, 40);
    }

    const nameSize = fitFontSize(context, card.value, cardWidth - 178, 44, '800', 'Georgia, serif', 24);
    context.fillStyle = '#ffffff';
    context.font = `800 ${nameSize}px Georgia, serif`;
    context.textBaseline = 'middle';
    context.fillText(card.value, card.x + 148, markerY);
    context.textBaseline = 'alphabetic';
  });
}

function drawFooter(context) {
  context.textAlign = 'center';

  context.fillStyle = '#d9f8df';
  context.font = 'italic 36px Georgia, serif';
  context.fillText('A little Canadian luck for today', WIDTH / 2, 1240);

  context.fillStyle = '#f8d575';
  context.font = '800 32px system-ui, sans-serif';
  context.fillText(LUCKY_SITE_HOST, WIDTH / 2, 1306);

  context.fillStyle = 'rgba(255, 247, 214, 0.6)';
  context.font = '500 23px system-ui, sans-serif';
  context.fillText('For fun and entertainment only. Not affiliated with any lottery.', WIDTH / 2, 1368);

  context.textAlign = 'left';
}

/**
 * Draws the shareable Lucky Reveal image and returns it as a PNG file.
 *
 * @param {{game: {name: string, numbers: number[]}, luckyColor: string, luckyDay: string}} reveal Reveal shown to the customer.
 * @returns {Promise<File>} Static share image.
 */
export async function createLuckyRevealShareImage(reveal) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create the share image.');
  }

  drawBackground(context);

  let logo = null;
  try {
    logo = await loadImage(LOGO_SRC);
  } catch {
    // The wordmark branding remains when the logo cannot be loaded.
  }

  drawHeader(context, reveal, logo);
  drawNumbers(context, reveal.game.numbers);
  drawResultCards(context, reveal);
  drawFooter(context);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error('Unable to create the share image.');
  }

  return new File([blob], 'lucky-reveal.png', { type: 'image/png' });
}

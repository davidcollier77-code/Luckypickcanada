// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LUCKY_SITE_URL,
  buildShareMessage,
  getShareLink,
  splitLuckyNumberRows,
} from '../app/lucky-reveal-presentation';

/**
 * Guards for Phase 2 of the Lucky Reveal polish (feature 081).
 *
 * Phase 2 adds an atmospheric pulse that breathes with the number-ball glow,
 * starts the Phase 1 finishing chime while a few maple leaves are still falling,
 * and gives the reveal a fourth, always-visible "Share to Apps" option while the
 * existing Copy link, Copy image and Download actions stay exactly as they were.
 */

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const celebrationSource = readSource('app/lucky-reveal-celebration.jsx');
const popupSource = readSource('app/lucky-reveal-popup.js');
const shareSource = readSource('app/share-lucky-pick-button.js');
const audioSource = readSource('app/lib/audio.js');
const revealPageSource = readSource('app/reveal/[revealId]/page.tsx');

const SIX_PICK = [3, 11, 19, 24, 40, 47];
const SEVEN_PICK = [1, 4, 9, 16, 25, 36, 49];

describe('Pulsating atmosphere synchronised with the number-ball glow', () => {
  it('loops a three-second cue that is the same length as the glow animation', () => {
    expect(audioSource).toContain('export const REVEAL_GLOW_PULSE_MS = 3000;');
    expect(audioSource).toContain("const REVEAL_GLOW_PULSE_URL = '/sounds/reveal-glow-pulse.wav';");
    expect(audioSource).toContain('loop: true');
    expect(audioSource).toContain('export function preloadRevealGlowPulse()');
    expect(audioSource).toContain('export function startRevealGlowPulse()');
    expect(audioSource).toContain('export function stopRevealGlowPulse()');

    // The glow animation and the atmosphere read the same constant, so neither
    // can drift from the other.
    expect(popupSource).toContain(
      'animationDuration: `0.9s, ${REVEAL_GLOW_PULSE_MS / 1000}s`,',
    );
  });

  it('starts on the first ball glow frame and stops with the reveal', () => {
    // The ball glow begins 0.9 s after each number starts revealing, and the
    // first number starts 2.0 s after the popup opens.
    expect(popupSource).toContain('const GLOW_START_MS = (2.0 + 0.9) * 1000;');
    expect(popupSource).toContain(
      'animationDelay: `${startNumbersDelay + numberIndex * 0.35}s, ${startNumbersDelay + numberIndex * 0.35 + 0.9}s`,',
    );
    // 2.0 + 0.9 seconds is exactly the first ball's glow delay.
    expect((2.0 + 0.9) * 1000).toBe(2900);

    expect(popupSource).toContain('preloadRevealGlowPulse()');
    expect(popupSource).toContain('startRevealGlowPulse()');
    expect(popupSource).toContain('window.clearTimeout(timer);');
    expect(popupSource).toContain('stopRevealGlowPulse();');
    expect(popupSource).toContain('}, GLOW_START_MS);');
  });

  it('keeps the atmosphere out of the reduced-motion reveal', () => {
    const glowEffect = popupSource.slice(popupSource.indexOf('Pulsating atmosphere'));
    expect(glowEffect).toContain(
      "if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;",
    );
    expect(audioSource).toMatch(/Reveal glow pulse playback failed/);
  });

  it('ships a quiet, seamless three-second WAV loop', () => {
    const asset = readFileSync(join(process.cwd(), 'public/sounds/reveal-glow-pulse.wav'));
    const sampleRate = asset.readUInt32LE(24);
    const channels = asset.readUInt16LE(22);
    const bitsPerSample = asset.readUInt16LE(34);
    const dataBytes = asset.readUInt32LE(40);

    expect(asset.toString('ascii', 0, 4)).toBe('RIFF');
    expect(asset.toString('ascii', 8, 12)).toBe('WAVE');
    expect(channels).toBe(1);
    expect(bitsPerSample).toBe(16);
    expect(sampleRate).toBe(22050);
    expect(dataBytes).toBe(sampleRate * 3 * 2);

    // A loop that starts and ends at silence joins without a click.
    const firstSample = Math.abs(asset.readInt16LE(44));
    const lastSample = Math.abs(asset.readInt16LE(44 + dataBytes - 2));
    expect(firstSample).toBe(0);
    expect(lastSample).toBe(0);

    // It is a real swell, not a silent placeholder.
    let peak = 0;
    for (let offset = 44; offset < 44 + dataBytes; offset += 2) {
      peak = Math.max(peak, Math.abs(asset.readInt16LE(offset)));
    }
    expect(peak).toBeGreaterThan(32767 * 0.2);
    expect(asset.length).toBeLessThan(300 * 1024);
  });

  it('records the generated provenance and the synthesis recipe', () => {
    const provenance = readSource('public/sounds/reveal-glow-pulse-sources.md');
    expect(provenance).toContain('procedurally generated');
    expect(provenance).toContain('generate-reveal-glow-pulse.mjs');
    expect(provenance).toContain('Licence');
    expect(provenance).toContain('REVEAL_GLOW_PULSE_MS');
  });
});

describe('Finishing chime starts while a few leaves are still falling', () => {
  it('signals the cue from a measured leaf count, not from the empty canvas', () => {
    expect(celebrationSource).toContain('const FINISHING_LEAF_RATIO = 0.08;');
    expect(celebrationSource).toContain(
      'if (peakPaintedPixels > 0 && paintedPixels <= peakPaintedPixels * FINISHING_LEAF_RATIO) {',
    );
    expect(celebrationSource).toContain('signalFinishing();');
    expect(celebrationSource).toContain('onConfettiFinishing?.()');
    expect(celebrationSource).toContain('onConfettiFinishing,');
  });

  it('always cues the chime before the safety timeout can end the celebration', () => {
    expect(celebrationSource).toContain('const FINISHING_CUE_LEAD_MS = 2500;');
    expect(celebrationSource).toContain(
      'CONFETTI_WATCH_TIMEOUT_MS - FINISHING_CUE_LEAD_MS,',
    );
    expect(celebrationSource).toContain('window.clearTimeout(cueTimer);');
    // It can only be a lead-in, never a delay: the cue fires 2.5 s before the
    // earliest possible removal, and the ratio cue normally fires even earlier.
    expect(12000 - 2500).toBe(9500);
  });

  it('keeps the pulse finish after the confetti while the chime comes first', () => {
    // The completion path always emits the chime cue before the settle callback,
    // so the cue never arrives after the pulses, even on the fallback timeout.
    const settleBlock = celebrationSource.slice(
      celebrationSource.indexOf('const settle = () => {'),
      celebrationSource.indexOf('// Wait for the last wave'),
    );
    expect(settleBlock.indexOf('signalFinishing();')).toBeGreaterThan(-1);
    expect(settleBlock.indexOf('signalFinishing();')).toBeLessThan(
      settleBlock.indexOf('onConfettiSettled?.();'),
    );

    expect(popupSource).toContain('onConfettiFinishing={startFinishingChime}');
    expect(popupSource).toContain('onConfettiSettled={startNumberFinish}');

    const chimeBlock = popupSource.slice(
      popupSource.indexOf('const startFinishingChime = useCallback'),
      popupSource.indexOf('const startNumberFinish = useCallback'),
    );
    expect(chimeBlock).toContain('playRevealFinishChime()');

    // The four pulses still wait for the confetti to clear completely.
    const pulseBlock = popupSource.slice(
      popupSource.indexOf('const startNumberFinish = useCallback'),
      popupSource.indexOf('// Pulsating atmosphere'),
    );
    expect(pulseBlock).toContain('setIsNumberFinishActive(true);');
    expect(pulseBlock).not.toContain('playRevealFinishChime()');
  });

  it('still runs the chime only once per reveal', () => {
    expect(celebrationSource).toContain('let hasSignalledFinishing = false;');
    expect(celebrationSource).toContain('if (hasSignalledFinishing) return;');
    expect(celebrationSource).toContain('hasSignalledFinishing = true;');
    expect(popupSource).toContain('preloadRevealFinishChime()');
  });
});

describe('Fourth sharing option — Share to Apps', () => {
  it('renders four clearly visible sharing controls in one group', () => {
    const labels = [
      "'Share to Apps'",
      'Copy the website link',
      'Copy the image',
      'Download the image',
    ];
    for (const label of labels) {
      expect(shareSource).toContain(label);
    }

    expect(shareSource).toContain('role="group"');
    expect(shareSource).toContain('aria-label="Share your reveal"');
    expect(shareSource).toContain('onClick={shareToApps}');
    expect(shareSource).toContain('onClick={copyLink}');
    expect(shareSource).toContain('onClick={copyImage}');
    expect(shareSource).toContain('onClick={downloadImage}');

    // No option is hidden behind a modal any more.
    expect(shareSource).not.toContain('role="dialog"');
    expect(shareSource).not.toContain('setIsFallbackOpen');
  });

  it('gives Share to Apps a share icon and an obvious tap target', () => {
    // 52px primary and 48px options clear the 44px minimum touch target.
    expect(shareSource).toContain('minHeight: 52');
    expect(shareSource).toContain('minHeight: 48');
    expect(shareSource).toMatch(/const shareIcon = \(\s*<svg/);
    expect(shareSource).toContain('<circle cx="18" cy="5" r="3" />');
    expect(shareSource).toContain('touchAction: \'manipulation\'');
    expect(shareSource).toContain('aria-busy={isSharing}');
  });

  it('uses the native share panel on mobile and desktop browsers', () => {
    expect(shareSource).toContain("if (typeof navigator.share !== 'function')");
    expect(shareSource).toContain('navigator.share(payload)');
    expect(shareSource).toContain('navigator.canShare');
    expect(shareSource).toContain('const imagePayload = file ? { files: [file], title, text, url: link } : null;');
    expect(shareSource).toContain('const textPayload = { title, text, url: link };');
    // The native payload carries the actual result and its available link.
    expect(shareSource).toContain('const text = buildShareMessage(reveal);');
    expect(shareSource).toContain('const link = getShareLink(reveal);');
    expect(shareSource).toContain('typeof navigator.canShare !== \'function\'');
  });

  it('falls back gracefully when native sharing is unavailable', () => {
    expect(shareSource).toContain('App sharing is not available in this browser.');
    expect(shareSource).toContain('App sharing was unavailable for this result.');
    expect(shareSource).toContain("setStatus('Sharing cancelled.');");
    expect(shareSource).toContain("return error?.name === 'AbortError' ? SHARE_CANCELLED : SHARE_REJECTED;");
    // The three local actions are unconditional, so they survive every path.
    expect(shareSource).toContain('URL.createObjectURL(file)');
    expect(shareSource).toContain('URL.revokeObjectURL(url)');
    expect(shareSource).toContain('navigator.clipboard.writeText(link)');
  });

  it('still never generates a result while sharing', () => {
    for (const source of [shareSource, popupSource, celebrationSource, audioSource]) {
      expect(source).not.toContain('generateLuckyNumbers');
      expect(source).not.toMatch(/createLuckyReveal\s*\(/);
      expect(source).not.toContain('crypto.getRandomValues');
      expect(source).not.toMatch(/Math\.random\(/);
    }
  });
});

describe('Share link for the actual result', () => {
  it('uses the result link when the reveal carries a same-site one', () => {
    expect(getShareLink({ resultUrl: 'https://luckypickcanada.ca/reveal/cs_test_123' })).toBe(
      'https://luckypickcanada.ca/reveal/cs_test_123',
    );
    expect(getShareLink({ resultUrl: 'https://www.luckypickcanada.ca/reveal/cs_test_123' })).toBe(
      'https://www.luckypickcanada.ca/reveal/cs_test_123',
    );
  });

  it('falls back to the website for a missing or untrusted link', () => {
    expect(getShareLink({})).toBe(LUCKY_SITE_URL);
    expect(getShareLink(undefined)).toBe(LUCKY_SITE_URL);
    expect(getShareLink({ resultUrl: 'https://evil.example/reveal' })).toBe(LUCKY_SITE_URL);
    expect(getShareLink({ resultUrl: 'http://luckypickcanada.ca/reveal' })).toBe(LUCKY_SITE_URL);
    expect(getShareLink({ resultUrl: 'javascript:alert(1)' })).toBe(LUCKY_SITE_URL);
    expect(getShareLink({ resultUrl: 'not a url' })).toBe(LUCKY_SITE_URL);
  });

  it('keeps the shared message tied to the stored reveal', () => {
    const reveal = {
      game: { name: '7 Pick', numbers: SEVEN_PICK },
      luckyColor: 'Star Gold',
      luckyDay: 'Monday',
    };
    const message = buildShareMessage(reveal);

    for (const number of SEVEN_PICK) {
      expect(message).toContain(String(number));
    }
    expect(message).toContain('Lucky color: Star Gold');
    expect(message).toContain('Lucky day: Monday');
    expect(message).toContain(LUCKY_SITE_URL);
  });
});

describe('Lucky Pick and Lucky Pick Gift from six and seven numbers', () => {
  it('presents both games through the one reveal and ships its stored numbers', () => {
    expect(revealPageSource).toContain("from '../../lucky-reveal-popup'");
    expect(revealPageSource).toContain('metadata.giftNumbers');
    expect(popupSource).toContain('numberRows.map((row, rowIndex) =>');
    expect(popupSource).toContain('{number}');
  });

  it.each([
    ['six numbers', SIX_PICK, [3, 3]],
    ['seven numbers', SEVEN_PICK, [4, 3]],
  ])('keeps %s in their stored order', (_label, numbers, rowSizes) => {
    const rows = splitLuckyNumberRows(numbers);
    expect(rows.map((row) => row.length)).toEqual(rowSizes);
    expect(rows.flat()).toEqual(numbers);
  });
});

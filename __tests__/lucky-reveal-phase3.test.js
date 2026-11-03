// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LUCKY_SITE_URL,
  buildShareMessage,
  getShareLink,
  splitLuckyNumberRows,
} from '../app/lucky-reveal-presentation';

/**
 * Guards for Phase 3 of the Lucky Reveal polish (feature 081).
 *
 * Phase 3 replaces the synthesised atmosphere and the finishing chime with one
 * real recording of applause and cheers, plays it exactly once per reveal and
 * never after the reveal has closed, and repairs Share to Apps so Android opens
 * the native sheet inside the tap's user activation with a single attempt.
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

const applauseBlock = audioSource.slice(
  audioSource.indexOf('const REVEAL_APPLAUSE_URL'),
  audioSource.indexOf('/*\n * Crystal Ball sound design.'),
);
const popupApplauseBlock = popupSource.slice(
  popupSource.indexOf('const startFinishingApplause = useCallback'),
  popupSource.indexOf('const startNumberFinish = useCallback'),
);
const shareToAppsBlock = shareSource.slice(
  shareSource.indexOf('function shareToApps()'),
  shareSource.indexOf('async function copyImage()'),
);

describe('Recorded applause replaces the synthesised cue', () => {
  it('ships a real recorded applause asset, not a generated one', () => {
    const assetPath = join(process.cwd(), 'public/sounds/reveal-applause.wav');
    expect(existsSync(assetPath)).toBe(true);
    const asset = readFileSync(assetPath);

    expect(asset.toString('ascii', 0, 4)).toBe('RIFF');
    expect(asset.toString('ascii', 8, 12)).toBe('WAVE');
    expect(asset.readUInt16LE(22)).toBe(1); // mono
    expect(asset.readUInt32LE(24)).toBe(44100);
    expect(asset.readUInt16LE(34)).toBe(16);

    const dataBytes = asset.readUInt32LE(40);
    expect(dataBytes).toBe(Math.round(44100 * 5.6) * 2);
    expect(asset.length).toBeLessThan(600 * 1024);

    // It is a real performance, not silence: healthy peaks across the excerpt.
    let peak = 0;
    for (let offset = 44; offset < 44 + dataBytes; offset += 2) {
      peak = Math.max(peak, Math.abs(asset.readInt16LE(offset)));
    }
    expect(peak).toBeGreaterThan(32767 * 0.3);
  });

  it('records the source, creator, licence and commercial-use permission', () => {
    const provenance = readSource('public/sounds/reveal-applause-sources.md');
    for (const field of ['Title', 'Provider', 'Sound page', 'Original audio file', 'Licence', 'Acquired']) {
      expect(provenance).toContain(field);
    }
    expect(provenance).toContain('Small group cheer and applause');
    expect(provenance).toContain('https://assets.mixkit.co/active_storage/sfx/478/478.wav');
    expect(provenance).toContain('https://mixkit.co/license/modal/sfxFree/');
    expect(provenance).toContain('commercial');
    expect(provenance).toContain('does not require');
    expect(provenance).toContain('real studio/library recording');
  });

  it('removes the generated pulse, its generator and the clashing chime', () => {
    expect(existsSync(join(process.cwd(), 'public/sounds/reveal-glow-pulse.wav'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'public/sounds/reveal-glow-pulse-sources.md'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'scripts/generate-reveal-glow-pulse.mjs'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'public/sounds/reveal-finish-chime.mp3'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'public/sounds/reveal-finish-chime-sources.md'))).toBe(false);

    expect(audioSource).not.toContain('reveal-glow-pulse');
    expect(audioSource).not.toContain('reveal-finish-chime');
    expect(popupSource).not.toContain('playRevealFinishChime');
    expect(popupSource).not.toContain('startRevealGlowPulse');
  });

  it('plays no continuous background audio during the reveal', () => {
    expect(applauseBlock).not.toContain('loop: true');
    expect(audioSource).not.toContain('REVEAL_GLOW_PULSE_MS');
    // The visual glow still breathes on its three-second cycle.
    expect(popupSource).toContain('const NUMBER_GLOW_PULSE_MS = 3000;');
    expect(popupSource).toContain('animationDuration: `0.9s, ${NUMBER_GLOW_PULSE_MS / 1000}s`,');
  });
});

describe('One applause cue, once per reveal session', () => {
  it('preloads and plays the same-origin recording once', () => {
    expect(applauseBlock).toContain("const REVEAL_APPLAUSE_URL = '/sounds/reveal-applause.wav';");
    expect(applauseBlock).toContain('export function preloadRevealApplause()');
    expect(applauseBlock).toContain('export function playRevealApplause(sessionId)');
    expect(applauseBlock).toContain('html5: true');
    expect(applauseBlock).toContain('volume: REVEAL_APPLAUSE_VOLUME');
    expect(popupSource).toContain('preloadRevealApplause()');
    expect(popupApplauseBlock).toContain('playRevealApplause(sessionId)');
  });

  it('owns every playback by one reveal session', () => {
    expect(audioSource).toContain('export function beginRevealAudioSession()');
    expect(audioSource).toContain('export function endRevealAudioSession()');
    expect(applauseBlock).toContain('if (sessionId !== revealAudioSessionId) return Promise.resolve(false);');
    expect(applauseBlock).toContain(
      "if (applauseRequestedSessionId === sessionId) return Promise.resolve(false);",
    );
    expect(applauseBlock).toContain('if (sessionId !== revealAudioSessionId) return false;');
    // A late decode is only allowed to start inside the still-active session.
    expect(applauseBlock.indexOf('.then(startPlayback)')).toBeGreaterThan(-1);
    expect(audioSource).toContain('sound.stop();');
  });

  it('never leaves a delayed stop timer behind', () => {
    expect(applauseBlock).not.toContain('setTimeout');
    expect(applauseBlock).not.toMatch(/\bfade\(/);
    expect(audioSource).toContain('stopApplausePlayback();');
  });

  it('opens a session on reveal and closes it with the reveal', () => {
    const sessionEffect = popupSource.slice(
      popupSource.indexOf('Open one audio session per reveal'),
      popupSource.indexOf('// Opening sparkle'),
    );
    expect(sessionEffect).toContain('revealAudioSessionRef.current = beginRevealAudioSession();');
    expect(sessionEffect).toContain('revealAudioSessionRef.current = null;');
    expect(sessionEffect).toContain('endRevealAudioSession();');
    // Cleanup runs after the ref is cleared and when the popup closes or unmounts.
    expect(sessionEffect.indexOf('revealAudioSessionRef.current = null;')).toBeLessThan(
      sessionEffect.indexOf('endRevealAudioSession();'),
    );
    expect(sessionEffect).toContain('return () => {');
  });

  it('keeps the applause and its cue out of the reduced-motion reveal', () => {
    expect(popupApplauseBlock).toContain(
      "if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;",
    );
    expect(popupSource).toContain('onConfettiFinishing={startFinishingApplause}');
    expect(popupSource).toContain('onConfettiSettled={startNumberFinish}');
  });
});

describe('Applause timing with the celebration', () => {
  it('starts at the measured finishing cue, not when the popup opens', () => {
    expect(celebrationSource).toContain('const FINISHING_LEAF_RATIO = 0.08;');
    expect(celebrationSource).toContain(
      'if (peakPaintedPixels > 0 && paintedPixels <= peakPaintedPixels * FINISHING_LEAF_RATIO) {',
    );
    expect(celebrationSource).toContain('signalFinishing();');
    expect(celebrationSource).toContain('onConfettiFinishing?.()');
    // The cue is signalled once, and only from the celebration's finish watcher.
    expect(celebrationSource).toContain('let hasSignalledFinishing = false;');
    expect(celebrationSource).toContain('if (hasSignalledFinishing) return;');
  });

  it('always cues the applause before the safety timeout ends the celebration', () => {
    expect(celebrationSource).toContain('const FINISHING_CUE_LEAD_MS = 2500;');
    expect(celebrationSource).toContain('CONFETTI_WATCH_TIMEOUT_MS - FINISHING_CUE_LEAD_MS,');
    expect(celebrationSource).toContain('window.clearTimeout(cueTimer);');
  });

  it('keeps the four golden pulses after the confetti while the applause leads them', () => {
    const settleBlock = celebrationSource.slice(
      celebrationSource.indexOf('const settle = () => {'),
      celebrationSource.indexOf('// Wait for the last wave'),
    );
    expect(settleBlock.indexOf('signalFinishing();')).toBeGreaterThan(-1);
    expect(settleBlock.indexOf('signalFinishing();')).toBeLessThan(
      settleBlock.indexOf('onConfettiSettled?.();'),
    );

    const pulseBlock = popupSource.slice(
      popupSource.indexOf('const startNumberFinish = useCallback'),
      popupSource.indexOf('// Return the balls to their normal appearance'),
    );
    expect(pulseBlock).toContain('setIsNumberFinishActive(true);');
    expect(pulseBlock).not.toContain('playRevealApplause');
  });

  it('preserves the opening sparkle and the confetti pop', () => {
    expect(audioSource).toContain("const REVEAL_SPARKLE_URL = '/sounds/chime-sound.mp3';");
    expect(popupSource).toContain('preloadRevealSparkle()');
    expect(popupSource).toContain('playRevealSparkle()');
    expect(celebrationSource).toContain('playConfettiPop()');
  });
});

describe('Share to Apps opens the native sheet from the tap', () => {
  it('prepares the image before the tap', () => {
    expect(shareSource).toContain('const SHARE_IMAGE_WARMUP_MS = 1200;');
    expect(shareSource).toContain('window.setTimeout(() => {');
    expect(shareSource).toContain('prepareShareFile().catch(() => {');
    expect(shareSource).toContain('if (fileRef.current) return Promise.resolve(fileRef.current);');
  });

  it('calls navigator.share with no await before it', () => {
    const codeOnly = shareToAppsBlock.replace(/\/\/[^\n]*/g, '');
    const shareIndex = codeOnly.indexOf('navigator.share(payload)');
    expect(shareIndex).toBeGreaterThan(-1);
    // Nothing asynchronous may run between the tap and the native call.
    expect(codeOnly.slice(0, shareIndex)).not.toContain('await');
    expect(codeOnly.slice(0, shareIndex)).not.toContain('.then(');
    // The prepared file is read synchronously from the ref, not awaited.
    expect(shareToAppsBlock).toContain('const file = fileRef.current;');
  });

  it('makes exactly one native share attempt per tap', () => {
    const occurrences = shareSource.match(/navigator\.share\(/g) || [];
    expect(occurrences).toHaveLength(1);
    // A rejection reports the fallback and does not retry with another payload.
    expect(shareToAppsBlock).toContain('setStatus(NATIVE_SHARE_FAILED)');
    expect(shareSource).toContain('Your device could not open the share panel for this result.');
    expect(shareToAppsBlock).toContain("error?.name === 'AbortError'");
    expect(shareToAppsBlock).toContain("'Sharing cancelled.'");
  });

  it('shares the prepared image with the stored result and the safe link', () => {
    expect(shareToAppsBlock).toContain(
      'const imagePayload = file ? { files: [file], title, text, url: link } : null;',
    );
    expect(shareToAppsBlock).toContain('const payload = imagePayload && canShareNative(imagePayload)');
    expect(shareToAppsBlock).toContain('const text = buildShareMessage(reveal);');
    expect(shareToAppsBlock).toContain('const link = getShareLink(reveal);');
    expect(shareToAppsBlock).toContain('if (typeof navigator.share !== \'function\')');
    expect(shareSource).toContain('return navigator.canShare(payload);');
  });

  it('keeps the four actions, the tap targets and the graceful fallback', () => {
    for (const label of ["'Share to Apps'", 'Copy the website link', 'Copy the image', 'Download the image']) {
      expect(shareSource).toContain(label);
    }
    expect(shareSource).toContain('minHeight: 52');
    expect(shareSource).toContain('minHeight: 48');
    expect(shareSource).toContain('App sharing is not available in this browser.');
    expect(shareSource).not.toContain('role="dialog"');
  });

  it('never shows a success message for a copy that failed', () => {
    const copyLinkBlock = shareSource.slice(
      shareSource.indexOf('async function copyLink()'),
      shareSource.indexOf('return (', shareSource.indexOf('async function copyLink()')),
    );
    expect(copyLinkBlock).toContain('Automatic copying is unavailable. Your reveal link:');
    // The success labels live only after a successful clipboard write.
    expect(copyLinkBlock.indexOf('Website link copied.')).toBeLessThan(
      copyLinkBlock.indexOf('Automatic copying is unavailable.'),
    );
    expect(copyLinkBlock).toContain('await navigator.clipboard.writeText(link)');
  });
});

describe('Share link safety', () => {
  it('uses a safe same-site result link when one is supplied', () => {
    const link = 'https://luckypickcanada.ca/reveal/8f14e45f-ceea-467f-a1d5-1b2c3d4e5f60';
    expect(getShareLink({ resultUrl: link })).toBe(link);
    expect(getShareLink({ resultUrl: 'https://www.luckypickcanada.ca/reveal/abc' })).toBe(
      'https://www.luckypickcanada.ca/reveal/abc',
    );
  });

  it('never puts a Stripe session id, query, fragment or foreign host in a share link', () => {
    for (const resultUrl of [
      'https://luckypickcanada.ca/reveal/cs_test_123',
      'https://luckypickcanada.ca/reveal/cs_live_123',
      'https://luckypickcanada.ca/reveal/pi_123',
      'https://luckypickcanada.ca/reveal/abc?session_id=cs_test_123',
      'https://luckypickcanada.ca/reveal/abc#cs_test_123',
      'https://evil.example/reveal/abc',
      'http://luckypickcanada.ca/reveal/abc',
      'javascript:alert(1)',
      'not a url',
    ]) {
      expect(getShareLink({ resultUrl })).toBe(LUCKY_SITE_URL);
    }

    expect(getShareLink({})).toBe(LUCKY_SITE_URL);
    expect(getShareLink(undefined)).toBe(LUCKY_SITE_URL);
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

  it('keeps sharing free of payment state and never invents a result URL', () => {
    expect(shareSource).not.toContain('session_id');
    expect(shareSource).not.toContain('cs_test');
    expect(shareSource).not.toContain('window.location');
    expect(popupSource).not.toContain('resultUrl:');
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

  it('never generates a result while playing, sharing or presenting', () => {
    for (const source of [shareSource, popupSource, celebrationSource, audioSource]) {
      expect(source).not.toContain('generateLuckyNumbers');
      expect(source).not.toMatch(/createLuckyReveal\s*\(/);
      expect(source).not.toContain('crypto.getRandomValues');
      expect(source).not.toMatch(/Math\.random\(/);
    }
  });
});

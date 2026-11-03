// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards for `specs/081-lucky-reveal-finish-and-media-capability`.
 *
 * The shipped finish deleted maple leaves while they were still painted, shared
 * to Android without ever trying a native text/link sheet, had no number-ball
 * finish and no closing sound. The workspace also had no way to review a
 * recording's frames or audio. These guards pin the delivered behaviour.
 */

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const celebrationSource = readSource('app/lucky-reveal-celebration.jsx');
const popupSource = readSource('app/lucky-reveal-popup.js');
const shareSource = readSource('app/share-lucky-pick-button.js');
const audioSource = readSource('app/lib/audio.js');

describe('Confetti leaves leave the screen before cleanup', () => {
  it('never expires a leaf while it can still be painted', () => {
    expect(celebrationSource).toContain('const PARTICLE_LIFETIME_TICKS = 300;');
    expect(celebrationSource).toContain('ticks: PARTICLE_LIFETIME_TICKS');
    // 300 ticks is five seconds at 60 fps: longer than the fall, so the tick
    // budget cannot cut a leaf off in mid-air.
    expect((300 / 60) * 1000).toBeGreaterThanOrEqual(4000);
  });

  it('removes the layer from a measurement of the painted canvas', () => {
    expect(celebrationSource).toContain('function countPaintedPixels(canvas)');
    expect(celebrationSource).toContain('getImageData(0, 0, width, height)');
    expect(celebrationSource).toContain('if (paintedPixels === 0) {');
    expect(celebrationSource).toContain('onConfettiSettled?.()');
    // The fixed window that used to remove the layer regardless of the screen is
    // gone; a bounded timeout only exists for a canvas that cannot be sampled.
    expect(celebrationSource).not.toContain('CONFETTI_WINDOW_MS');
    expect(celebrationSource).toContain('const CONFETTI_WATCH_TIMEOUT_MS = 12000;');
    const timeoutDeclarations = celebrationSource.match(/const CONFETTI_WATCH_TIMEOUT_MS = \d+;/g) ?? [];
    expect(timeoutDeclarations).toEqual(['const CONFETTI_WATCH_TIMEOUT_MS = 12000;']);
  });

  it('keeps the leaf artwork, burst and layering', () => {
    expect(celebrationSource).toContain("['#FBBF24', '#F59E0B', '#D97706']");
    expect(celebrationSource).toContain('const MAX_ACTIVE_PARTICLES = 96;');
    expect((celebrationSource.match(/\{ left: '/g) || []).length).toBe(18);
    expect(celebrationSource).toContain('viewBox="-2015 -2000 4030 4030"');
    // The leaves stay above the panel so they may cover the reveal content.
    expect(celebrationSource).toMatch(/\.lucky-celebration-particles \{[\s\S]{0,160}z-index: 3;/);
  });
});

describe('Android native sharing', () => {
  it('requests the image, the message and the link first', () => {
    expect(shareSource).toContain(
      'const imagePayload = file ? { files: [file], title, text, url: link } : null;',
    );
    expect(shareSource).toContain('const payload = imagePayload && canShareNative(imagePayload)');
    expect(shareSource).toContain('const text = buildShareMessage(reveal);');
    expect(shareSource).toContain('const link = getShareLink(reveal);');
  });

  it('prepares the image before the tap and calls share inside the tap', () => {
    expect(shareSource).toContain('const SHARE_IMAGE_WARMUP_MS = 1200;');
    expect(shareSource).toContain('const file = fileRef.current;');
    const codeOnly = shareSource.slice(
      shareSource.indexOf('function shareToApps()'),
      shareSource.indexOf('async function copyImage()'),
    ).replace(/\/\/[^\n]*/g, '');
    const shareIndex = codeOnly.indexOf('navigator.share(payload)');
    expect(shareIndex).toBeGreaterThan(-1);
    expect(codeOnly.slice(0, shareIndex)).not.toContain('await');
    // Exactly one native attempt: a rejection never retries with a text payload.
    expect(shareSource.match(/navigator\.share\(/g)).toHaveLength(1);
    expect(shareSource).not.toContain('textPayload');
  });

  it('reports cancellation and failure truthfully, and keeps the three local actions', () => {
    expect(shareSource).toContain("error?.name === 'AbortError'");
    expect(shareSource).toContain("'Sharing cancelled.'");
    expect(shareSource).toContain('Your device could not open the share panel for this result.');
    expect(shareSource).toContain('Download the image');
    expect(shareSource).toContain('copyImage');
    expect(shareSource).toContain('Copy the website link');
  });
});

describe('Number-ball finish', () => {
  it('runs exactly four pulses and only after the confetti has gone', () => {
    expect(popupSource).toContain('const NUMBER_FINISH_PULSES = 4;');
    expect(popupSource).toContain('const startNumberFinish = useCallback');
    expect(popupSource).toContain('onConfettiSettled={startNumberFinish}');
    expect(popupSource).toContain('lucky-reveal-numbers--finishing');
    expect(popupSource).toContain(
      'animation: lucky-number-finish-glow ${NUMBER_FINISH_PULSE_MS}ms ease-in-out ${NUMBER_FINISH_PULSES};',
    );
    expect(popupSource).toContain("'--finish-delay': `${numberIndex * 0.12}s`");
    // The only trigger is the celebration's own completion signal.
    expect(celebrationSource).toContain('onConfettiSettled?.()');
  });

  it('returns the balls to their normal appearance and respects reduced motion', () => {
    expect(popupSource).toContain(
      'window.setTimeout(() => setIsNumberFinishActive(false), NUMBER_FINISH_TOTAL_MS)',
    );
    expect(popupSource).toContain(
      "if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;",
    );

    const reducedMotionBlock = popupSource.slice(
      popupSource.indexOf('@media (prefers-reduced-motion: reduce)'),
    );
    expect(reducedMotionBlock).toContain(
      '.lucky-reveal-numbers--finishing .lucky-reveal-number::after {',
    );
    expect(reducedMotionBlock).toContain('animation: none !important;');

    // The ball's own reveal animation is untouched: the glow is a pseudo-element.
    expect(popupSource).toContain(".lucky-reveal-number::after {");
    expect(popupSource).toContain('animationName: \'lucky-number-reveal, lucky-glow-pulse\'');
  });
});

describe('Finishing sound', () => {
  it('uses the recorded applause instead of the removed synthesised cue', () => {
    expect(audioSource).toContain("const REVEAL_APPLAUSE_URL = '/sounds/reveal-applause.wav';");
    expect(audioSource).toContain('export function preloadRevealApplause()');
    expect(audioSource).toContain('export function playRevealApplause(sessionId)');
    expect(popupSource).toContain('preloadRevealApplause()');
    expect(popupSource).toContain('playRevealApplause(sessionId)');

    const asset = join(process.cwd(), 'public/sounds/reveal-applause.wav');
    expect(existsSync(asset)).toBe(true);
    // Short and light: a finishing celebration, not a track.
    expect(statSync(asset).size).toBeLessThan(600 * 1024);
    expect(existsSync(join(process.cwd(), 'public/sounds/reveal-finish-chime.mp3'))).toBe(false);
  });

  it('plays the applause while the last few leaves are still falling', () => {
    expect(celebrationSource).toContain('const FINISHING_LEAF_RATIO = 0.08;');
    expect(celebrationSource).toContain('onConfettiFinishing?.()');
    expect(popupSource).toContain('onConfettiFinishing={startFinishingApplause}');

    const applauseBlock = popupSource.slice(
      popupSource.indexOf('const startFinishingApplause = useCallback'),
    );
    expect(applauseBlock).toContain('playRevealApplause(sessionId)');

    const pulseBlock = popupSource.slice(
      popupSource.indexOf('const startNumberFinish = useCallback'),
      popupSource.indexOf('// Return the balls to their normal appearance'),
    );
    expect(pulseBlock).toContain('setIsNumberFinishActive(true);');
    expect(pulseBlock).not.toContain('playRevealApplause');
  });

  it('keeps the opening sparkle and the confetti pop', () => {
    expect(audioSource).toContain("const REVEAL_SPARKLE_URL = '/sounds/chime-sound.mp3';");
    expect(popupSource).toContain('playRevealSparkle');
    expect(celebrationSource).toContain('playConfettiPop()');
    // Nothing continuous runs under the revealed numbers any more.
    expect(audioSource).not.toContain('loop: true,\n        volume: REVEAL_APPLAUSE_VOLUME');
    expect(popupSource).not.toContain('startRevealGlowPulse');
  });
});

describe('Reusable video and audio inspection', () => {
  it('provisions FFmpeg and the audio stack without root or sandbox changes', () => {
    const setup = readSource('scripts/setup-media-tools.sh');
    expect(setup).toContain('ffmpeg-release-amd64-static');
    expect(setup).toContain('ffprobe');
    expect(setup).toContain('vosk-model-small-en-us-0.15');
    expect(setup).toContain('ast-finetuned-audioset');
    expect(setup).toContain('--check');
    expect(setup).toContain('scripts/setup-chromium-libs.sh');

    expect(setup).not.toMatch(/(^|\s)sudo(\s|$)/m);
    expect(setup).not.toContain('--no-sandbox');
    expect(setup).not.toContain('no-new-privileges=false');
  });

  it('understands speech and sound events instead of only metadata', () => {
    const script = readSource('scripts/inspect-media.py');
    expect(script).toContain('def probe(');
    expect(script).toContain('def extract_frames(');
    expect(script).toContain('def transcribe(');
    expect(script).toContain('def classify_events(');
    expect(script).toContain('AutoModelForAudioClassification');
    expect(script).toContain('KaldiRecognizer');
    expect(script).toContain('id2label');
  });
});

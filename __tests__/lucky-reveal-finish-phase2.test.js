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
    expect(celebrationSource).toContain('function hasPaintedPixels(canvas)');
    expect(celebrationSource).toContain('getImageData(0, 0, width, height)');
    expect(celebrationSource).toContain('if (!hasPaintedPixels(canvasRef.current)) settle();');
    expect(celebrationSource).toContain('onConfettiSettled?.()');
    // The fixed window that used to remove the layer regardless of the screen is
    // gone; a bounded timeout only exists for a canvas that cannot be sampled.
    expect(celebrationSource).not.toContain('CONFETTI_WINDOW_MS');
    expect(celebrationSource).toContain('const CONFETTI_WATCH_TIMEOUT_MS = 12000;');
    const timeoutDeclarations = celebrationSource.match(/const CONFETTI_WATCH_TIMEOUT_MS = \\d+;/g) ?? [];
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
    expect(shareSource).toContain('if (imagePayload && canShareNative(imagePayload))');
  });

  it('tries a native text/link share before the custom window', () => {
    const imageIndex = shareSource.indexOf('canShareNative(imagePayload)');
    const textIndex = shareSource.indexOf('const textPayload = { title, text, url: link };');
    const fallbackIndex = shareSource.indexOf('setIsFallbackOpen(true);');

    expect(imageIndex).toBeGreaterThan(0);
    expect(textIndex).toBeGreaterThan(imageIndex);
    expect(fallbackIndex).toBeGreaterThan(textIndex);
    expect(shareSource).toContain('canShareNative(textPayload)');
  });

  it('reports cancellation without opening the fallback, and keeps the fallback', () => {
    expect(shareSource).toContain(
      "return error?.name === 'AbortError' ? SHARE_CANCELLED : SHARE_REJECTED;",
    );
    expect(shareSource).toContain("setStatus('Sharing cancelled.');");
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
  it('adds one same-origin finishing chime', () => {
    expect(audioSource).toContain(
      "const REVEAL_FINISH_CHIME_URL = '/sounds/reveal-finish-chime.mp3';",
    );
    expect(audioSource).toContain('export function preloadRevealFinishChime()');
    expect(audioSource).toContain('export function playRevealFinishChime()');
    expect(popupSource).toContain('preloadRevealFinishChime()');
    expect(popupSource).toContain('playRevealFinishChime()');

    const asset = join(process.cwd(), 'public/sounds/reveal-finish-chime.mp3');
    expect(existsSync(asset)).toBe(true);
    // Short and light: a finishing cue, not a track.
    expect(statSync(asset).size).toBeLessThan(200 * 1024);
  });

  it('plays the finishing cue with the pulses, after the confetti', () => {
    const startBlock = popupSource.slice(
      popupSource.indexOf('const startNumberFinish = useCallback'),
    );
    expect(startBlock.indexOf('setIsNumberFinishActive(true);')).toBeLessThan(
      startBlock.indexOf('playRevealFinishChime()'),
    );
  });

  it('preserves the opening sparkle and the confetti pop', () => {
    expect(audioSource).toContain("const REVEAL_SPARKLE_URL = '/sounds/chime-sound.mp3';");
    expect(popupSource).toContain('playRevealSparkle');
    expect(celebrationSource).toContain('playConfettiPop()');
  });

  it('records the provenance and a commercial-use licence', () => {
    const provenance = readSource('public/sounds/reveal-finish-chime-sources.md');
    for (const field of ['Title', 'Creator', 'Source URL', 'Licence', 'Acquisition']) {
      expect(provenance).toContain(field);
    }
    expect(provenance).toContain('CC0');
    expect(provenance).toContain('commercial');
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

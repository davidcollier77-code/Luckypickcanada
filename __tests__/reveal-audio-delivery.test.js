import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Source guard for `specs/188-reveal-audio-delivery`.
 *
 * The reveal used to download each standard-tier cue twice: once with `fetch()`
 * for the Web Audio path and again when Howler preloaded the same URL. The
 * component is JSX-in-`.js`, which the Vitest pipeline cannot render, so this
 * guard pins the delivery contract that removes the duplicate request while
 * keeping every authored cue, volume and preload.
 */

const source = readFileSync(join(process.cwd(), 'app/lucky-card-reveal.js'), 'utf8');

const STANDARD_CUES = [
  'standard_beam_shot',
  'standard_final_beam',
  'standard_beam_impact',
  'standard_final_lock',
  'standard_final_discharge',
  'standard_reveal_snap',
  'standard_electrical_arc',
  'standard_card_shake',
];

// The authored standard-tier mix. A delivery change must never alter it.
const STANDARD_VOLUMES = {
  beamShot: '0.46',
  finalBeam: '0.62',
  beamImpact: '0.7',
  finalLock: '0.74',
  finalDischarge: '0.78',
  revealSnap: '0.28',
  electricalArc: '0.18',
  cardShake: '0.15',
};

// The premium/flagship set is untouched by this change.
const LEGACY_CUES = [
  'mixkit-cinematic-whoosh',
  'beam_energy',
  'beam_impact',
  'final_lock_on',
  'final_discharge',
  'reveal_snap',
  'electrical_arc',
];

describe('Standard reveal audio delivery', () => {
  it('names each standard cue URL exactly once', () => {
    for (const cue of STANDARD_CUES) {
      const matches = source.match(new RegExp(`/sounds/${cue}\\.mp3`, 'g')) || [];
      expect(matches, cue).toHaveLength(1);
    }
  });

  it('hands Howler the bytes it already fetched instead of the URL again', () => {
    // One fetch per cue, in the preload map.
    expect(source.match(/await fetch\(url\)/g)).toHaveLength(1);

    // Every standard Howl takes its source from the fetched map.
    for (const key of Object.keys(STANDARD_VOLUMES)) {
      expect(source).toContain(`standardAudioRefs.current.${key} = new Howl({\n      src: [sources.${key}],`);
    }

    // The fetched buffers become object URLs, and those URLs are released.
    expect(source).toContain("const objectUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mpeg' }));");
    expect(source).toContain('objectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl));');
    expect(source).toContain('blobSources[key] = objectUrl;');
    expect(source).toContain('createStandardHowls(blobSources);');
  });

  it('keeps the authored mix and preload for every standard cue', () => {
    for (const [key, volume] of Object.entries(STANDARD_VOLUMES)) {
      expect(source, key).toContain(`standardAudioRefs.current.${key} = new Howl({\n      src: [sources.${key}],\n      volume: ${volume},\n      preload: true`);
    }
  });

  it('keeps the Web Audio path and the failure fallback intact', () => {
    expect(source).toContain('rawAudioDataRef.current[key] = arrayBuffer;');
    expect(source).toContain('standardAudioPreloadRef.current = Promise.all(');
    expect(source).toContain('const preloadPromise = standardAudioPreloadRef.current;');
    expect(source).toContain('const preloadSucceeded = preloadPromise ? await preloadPromise : false;');
    expect(source).toContain('audioBuffersRef.current[key] = await ctx.decodeAudioData(clonedBuffer);');

    // A failed fetch still builds the Howl set from the authored URLs.
    expect(source).toContain('if (!disposed) createStandardHowls(audioSources);');
    // Short description of the contract, so a later edit cannot drop it silently.
    expect(source).toContain('audit: 8 duplicates');
  });

  it('leaves every premium/flagship cue and its preload in place', () => {
    for (const cue of LEGACY_CUES) {
      expect(source, cue).toContain(`${cue}.mp3`);
    }
    expect(source).toContain('audioRefs.current.beamApproach = new Howl({');
    expect(source).toContain('audioRefs.current.electricalArc = new Howl({');
  });
});

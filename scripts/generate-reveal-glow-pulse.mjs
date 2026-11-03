#!/usr/bin/env node
// Generates public/sounds/reveal-glow-pulse.wav, the atmospheric bed that breathes
// with the revealed number balls' 3-second glow animation.
//
// Why generated here instead of downloaded: the cue has to line up with the CSS
// glow cycle (REVEAL_GLOW_PULSE_MS = 3000 in app/lib/audio.js) and be a seamless
// loop. A synthesised short swell gives both exactly, carries no third-party
// licence, and adds no dependency to the build.
//
// Sound design: a very quiet low drone (55 Hz + 82.5 Hz) under soft band-limited
// air, with an amplitude envelope of sin^2(pi * t / T). The envelope is exactly
// zero at both ends of the 3-second period, so the loop joins without a click and
// the swell peaks halfway through — the same moment the glow animation is at its
// brightest. It reads as atmosphere, not as a musical chime.
//
// Usage: node scripts/generate-reveal-glow-pulse.mjs
//        node scripts/generate-reveal-glow-pulse.mjs --check

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const DURATION_SECONDS = 3;
const SAMPLE_COUNT = SAMPLE_RATE * DURATION_SECONDS;
const PEAK = 0.26;
const OUTPUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'sounds',
  'reveal-glow-pulse.wav',
);

// Deterministic noise keeps the generated asset reproducible byte for byte.
function createNoise() {
  let seed = 0x5eed1234;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296 * 2 - 1;
  };
}

function synthesise() {
  const noise = createNoise();
  const samples = new Float64Array(SAMPLE_COUNT);
  let air = 0;
  let airPrevious = 0;

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const time = index / SAMPLE_RATE;
    const phase = time / DURATION_SECONDS;
    // 0 at both loop edges, 1 at the halfway point of the glow cycle.
    const envelope = Math.sin(Math.PI * phase) ** 2;

    const drone =
      0.5 * Math.sin(2 * Math.PI * 55 * time) +
      0.3 * Math.sin(2 * Math.PI * 82.5 * time + 0.3);

    // One-pole low pass then difference high pass: soft "air" rather than hiss.
    air += 0.09 * (noise() - air);
    const airBand = air - airPrevious;
    airPrevious = air;

    samples[index] = envelope * (0.34 * drone + 2.6 * airBand);
  }

  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const gain = peak > 0 ? PEAK / peak : 0;

  const pcm = Buffer.alloc(SAMPLE_COUNT * 2);
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index] * gain));
    pcm.writeInt16LE(Math.round(value * 32767), index * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

const wav = synthesise();

if (process.argv.includes('--check')) {
  const current = readFileSync(OUTPUT);
  if (!current.equals(wav)) {
    console.error(`✗ ${OUTPUT} is out of date; run node scripts/generate-reveal-glow-pulse.mjs`);
    process.exit(1);
  }
  console.log(`✓ ${OUTPUT} matches the generator (${wav.length} bytes)`);
} else {
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, wav);
  console.log(`✓ wrote ${OUTPUT} (${wav.length} bytes, ${DURATION_SECONDS}s loop)`);
}

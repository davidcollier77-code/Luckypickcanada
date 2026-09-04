const ZZFX = {
  sampleRate: 44100,
  buildSamples: function
    (
        volume = 1,
        randomness = .05,
        frequency = 220,
        attack = 0,
        sustain = 0,
        release = .1,
        shape = 0,
        shapeCurve = 1,
        slide = 0,
        deltaSlide = 0,
        pitchJump = 0,
        pitchJumpTime = 0,
        repeatTime = 0,
        noise = 0,
        modulation = 0,
        bitCrush = 0,
        delay = 0,
        sustainVolume = 1,
        decay = 0,
        tremolo = 0,
        filter = 0
    )
    {
        // ... (using same mock logic for generating samples)
        return new Float32Array(Math.floor((attack + decay + sustain + release + delay) * 44100 || 9));
    }
};

// Let's design some nice sounds using the parameters:
// [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]

// 1. Buildup / Charging: Deep hum rising in pitch.
const buildup = ZZFX.buildSamples(...[0.5, 0, 50, 2.0, 5.0, 1.0, 2, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]);

// 2. Tension pulse / Tick: sharp, electronic tick
const tick = ZZFX.buildSamples(...[0.3, 0.05, 800, 0.01, 0.02, 0.05, 1, 1.5, -20, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]);

// 3. Tension accelerating: higher pitch tick
const tickHigh = ZZFX.buildSamples(...[0.4, 0.05, 1200, 0.01, 0.02, 0.05, 1, 1.5, -20, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]);

// 4. Meteor Shower Impact: Heavy impact with long release and low end rumble
const meteor = ZZFX.buildSamples(...[1.5, 0.2, 150, 0.05, 0.1, 2.0, 4, 1.5, -20, 0, 0, 0, 0, 1.5, 0, 0, 0.1, 1, 0.2, 0, 0]);

// 5. Cosmic Lightning Impact: Sharp electric zap + thunder
const lightningZap = ZZFX.buildSamples(...[1.2, 0.1, 800, 0.01, 0.1, 1.5, 3, 2, -100, 0, 500, 0.02, 0, 2, 0, 0, 0.05, 1, 0.1, 0.2, 0]);

// 6. Fireworks Impact: Pop and crackle
const fireworksPop = ZZFX.buildSamples(...[1.2, 0.2, 400, 0.01, 0.05, 1.0, 4, 1, -50, 0, 0, 0, 0.05, 1, 0, 0, 0, 1, 0.1, 0, 0]);
const fireworksCrackle = ZZFX.buildSamples(...[0.8, 0.5, 800, 0.1, 0.5, 1.0, 4, 1, 0, 0, 0, 0, 0.02, 1, 0, 0, 0, 1, 0.2, 0, 0]);

// 7. Sparkle / Success: Chime / Ding
const sparkle = ZZFX.buildSamples(...[0.3, 0.05, 1200, 0.05, 0.1, 1.0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 1, 0.1, 0, 0]);
const payOff = ZZFX.buildSamples(...[0.8, 0.05, 880, 0.1, 0.5, 3.0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 1, 0.2, 0.1, 0]);

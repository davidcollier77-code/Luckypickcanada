const fs = require('fs');

let content = fs.readFileSync('./app/lucky-card-reveal.js', 'utf-8');

// We need to add a short burst magical impact sound, we have lightning and firework.
// We can synthesize a short magical burst (bell/chime) or reuse an existing sound with a different playback rate.
// The task asks for a "short, subtle explosion-like magical impact sound at the exact moment the strike hits the card."
// We can layer a high-pitched firework + synth burst.

const synthesizeImpact = `
      // Short, subtle magical impact burst
      const burst = ctx.createOscillator();
      const burstGain = ctx.createGain();
      burst.type = 'triangle';
      burst.frequency.setValueAtTime(isFinal ? 800 : 400 + (idx * 150), strikeTime);
      burst.frequency.exponentialRampToValueAtTime(isFinal ? 200 : 100, strikeTime + 0.2);

      burstGain.gain.setValueAtTime(0, strikeTime);
      burstGain.gain.setValueAtTime(intensity * 0.8, strikeTime + 0.01); // sharp attack
      burstGain.gain.exponentialRampToValueAtTime(0.01, strikeTime + 0.2); // quick decay

      burst.connect(burstGain);
      burstGain.connect(ctx.destination);
      burst.start(strikeTime);
      burst.stop(strikeTime + 0.3);
      activeAudioNodesRef.current.push(burst);
`;

const audioImpactSearch = `      // Add a subtle thump/firework sound to the strike for weight
      playBuffer(ctx, audioBuffers.firework, strikeTime, intensity * 0.3, 1.2 + (idx * 0.1), 1.0);`;

const audioImpactReplace = `      // Add a subtle thump/firework sound to the strike for weight
      playBuffer(ctx, audioBuffers.firework, strikeTime, intensity * 0.4, 1.2 + (idx * 0.1), 1.0);

` + synthesizeImpact;

content = content.replace(audioImpactSearch, audioImpactReplace);

fs.writeFileSync('./app/lucky-card-reveal.js', content);

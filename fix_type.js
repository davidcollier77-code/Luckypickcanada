const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// I also want to make sure the volume scaling works. In `playBuffer`, there's a volume parameter.
// The new buildup starts at volume 0.6.
// Also, when stopping the source with fade out, we should wrap the try/catch around the fade out to avoid DOMException if setTargetAtTime overlaps.
code = code.replace(
  /try {\n\s*node\.gainNode\.gain\.setTargetAtTime\(0, activeAudioCtx\.currentTime, 0\.5\);\n\s*\/\/ Also stop the source smoothly to clean up\n\s*if \(node\.source\) {\n\s*node\.source\.stop\(activeAudioCtx\.currentTime \+ 2\.0\); \/\/ Stop after fade\n\s*}\n\s*} catch \(e\) {}/g,
  `try {
                if (node.gainNode.gain.value > 0) {
                   node.gainNode.gain.cancelScheduledValues(activeAudioCtx.currentTime);
                   node.gainNode.gain.setTargetAtTime(0, activeAudioCtx.currentTime, 0.5);
                }
                if (node.source) {
                  try { node.source.stop(activeAudioCtx.currentTime + 2.0); } catch(e){}
                }
              } catch (e) {}`
);

fs.writeFileSync('components/DailyResonance.tsx', code);

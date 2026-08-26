import re

with open("components/DailyResonance.tsx", "r") as f:
    content = f.read()

target = r"""      if \(!canSpawn && particles\.length === 0\) \{
        // Fade out all active audio smoothly
        if \(audioCtx && audioCtx\.state === 'running'\) \{
          activeAudioNodesRef\.current\.forEach\(\(node\) => \{
            if \(node\?\.gainNode\) \{
              try \{
                node\.gainNode\.gain\.setTargetAtTime\(0, audioCtx\.currentTime, 1\.0\);
              \} catch \(e\) \{\}
            \}
          \}\);
        \}
        return;
      \}"""

replacement = r"""      if (!canSpawn) {
        // Fade out all active audio smoothly as soon as spawning stops
        if (audioCtx && audioCtx.state === 'running') {
          activeAudioNodesRef.current.forEach((node) => {
            if (node?.gainNode && node.gainNode.gain.value > 0.01) {
              try {
                node.gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
              } catch (e) {}
            }
          });
        }

        // Only stop the render loop when all particles are actually gone
        if (particles.length === 0) {
          return;
        }
      }"""

content = re.sub(target, replacement, content)

with open("components/DailyResonance.tsx", "w") as f:
    f.write(content)

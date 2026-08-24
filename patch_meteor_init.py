import re

with open('./components/LuckyGenerator.tsx', 'r') as f:
    content = f.read()

# Replace initialization logic
old_init = """      } else if (phase === 'locked' && tier?.id === 'tier2') {
          for(let i=0; i<50; i++) {
              particles.push({
                  x: Math.random() * width,
                  y: -10,
                  vx: -2 - Math.random() * 3,
                  vy: 5 + Math.random() * 5,
                  length: Math.random() * 20 + 10,
                  alpha: Math.random() * 0.5 + 0.5
              });
          }"""

new_init = """      } else if (phase === 'locked' && tier?.id === 'tier2') {
          // Increase count to 150
          for(let i=0; i<150; i++) {
              // Add depth variation (scale)
              const scale = Math.random() * 0.8 + 0.2;
              particles.push({
                  // Spread across entire canvas and offscreen to avoid popping
                  x: Math.random() * width * 1.5,
                  y: Math.random() * height * 1.5 - height,
                  // Faster, varied speeds based on scale (parallax)
                  vx: (-4 - Math.random() * 6) * scale,
                  vy: (8 + Math.random() * 12) * scale,
                  // Longer tails
                  length: (Math.random() * 80 + 40) * scale,
                  alpha: Math.random() * 0.5 + 0.5,
                  thickness: (Math.random() * 2 + 1) * scale
              });
          }"""

if old_init not in content:
    raise ValueError("Pattern not found in file - replacement failed")
new_content = content.replace(old_init, new_init)

with open('./components/LuckyGenerator.tsx', 'w') as f:
    f.write(new_content)

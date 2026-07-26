<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Luck Generator</title>
  <style>
    :root {
      --glow-intensity: 0.2; /* Default dim state */
    }

    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }

    body {
      background-color: #060913;
      font-family: 'Montserrat', sans-serif;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .app-container {
      width: 100%;
      max-width: 500px;
      background: #0a0d1a;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      /* Glow intensity applied via variable */
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.8), 
                  0 0 calc(50px * var(--glow-intensity)) rgba(34, 197, 94, var(--glow-intensity));
      transition: box-shadow 0.5s ease;
    }

    .gauge-container { width: 100%; height: 240px; position: relative; }
    
    .needle-group {
      transform-origin: 190px 190px;
      transition: transform 3s cubic-bezier(0.15, 0.9, 0.2, 1);
      filter: drop-shadow(0 0 calc(10px * var(--glow-intensity)) rgba(254, 240, 138, 1));
    }

    .btn-generate {
      width: 130px; height: 130px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #22c55e, #15803d 70%, #052e16 100%);
      border: 4px solid #fef08a;
      color: white;
      font-weight: 800;
      cursor: pointer;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin: 20px auto;
      transition: all 0.2s;
    }

    .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>

  <div class="app-container">
    <div class="gauge-container">
      <svg viewBox="0 0 380 240" style="width: 100%; height: 100%;">
        <!-- Arcs -->
        <path d="M 48,190 A 142,142 0 0,1 332,190" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="32"/>
        <!-- Needle -->
        <g id="needle" class="needle-group" style="transform: rotate(-90deg);">
          <polygon points="190,48 184,190 196,190" fill="#fef08a"/>
        </g>
      </svg>
    </div>

    <button class="btn-generate" id="spinBtn" onclick="generateLuck()">
      <span>SPIN</span>
    </button>
    
    <div style="text-align:center;">
      <h3>Score: <span id="currentScore">0</span>%</h3>
    </div>
  </div>

  <script>
    let isSpinning = false;

    function scoreToAngle(score) {
      return -90 + (score / 100) * 180;
    }

    function generateLuck() {
      if (isSpinning) return;
      
      const spinBtn = document.getElementById('spinBtn');
      const needle = document.getElementById('needle');
      const container = document.querySelector('.app-container');
      
      isSpinning = true;
      spinBtn.disabled = true;

      const newScore = Math.floor(Math.random() * 100) + 1;
      const targetAngle = scoreToAngle(newScore);

      // Spin 3 full rotations + target
      needle.style.transform = `rotate(${1080 + targetAngle}deg)`;

      setTimeout(() => {
        // Update Display
        document.getElementById('currentScore').innerText = newScore;
        
        // Retroactive Lighting: Update variable based on score
        const intensity = newScore / 100;
        container.style.setProperty('--glow-intensity', intensity);

        // Reset Needle for next spin
        needle.style.transition = 'none';
        needle.style.transform = `rotate(${targetAngle}deg)`;
        needle.offsetHeight; // Force reflow
        needle.style.transition = 'transform 3s cubic-bezier(0.15, 0.9, 0.2, 1)';

        isSpinning = false;
        spinBtn.disabled = false;
      }, 3000);
    }
  </script>
</body>
</html>

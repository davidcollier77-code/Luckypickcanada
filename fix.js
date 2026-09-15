const fs = require('fs');
let code = fs.readFileSync('components/LuckyGenerator.tsx', 'utf8');

code = code.replace(/bg-black\/40 p-6 text-center backdrop-blur-xl/g, 'p-6 text-center');
code = code.replace(/border-t border-white\/15 /g, '');

const spawnMeteorOriginal = `    function spawnMeteor(isHero: boolean, xOverride?: number, speedOverride?: number, lenOverride?: number, widthOverride?: number, yOverride?: number) {
      const startX = xOverride !== undefined ? xOverride : ((Math.random() * 1.5 * width) - (width * 0.2));
      const startY = yOverride !== undefined ? yOverride : (isHero ? (Math.random() * -300 - 100) : (Math.random() * -100 - 50));

      const speed = reduced ? 600 : (speedOverride !== undefined ? speedOverride : (isHero ? 1800 + Math.random() * 800 : 900 + Math.random() * 500));
      const angle = (35 + Math.random() * 30) * (Math.PI / 180);
      const len = lenOverride !== undefined ? lenOverride : (isHero ? 250 + Math.random() * 150 : 100 + Math.random() * 80);
      const w = widthOverride !== undefined ? widthOverride : (isHero ? 5 + Math.random() * 4 : 2 + Math.random() * 2.5);

      s.meteors.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * (startX > width * 0.8 ? -1 : 1) * speed,
        vy: Math.sin(angle) * speed,
        len: len,
        width: w,
        trail: [], life: 0, isHero
      });
    }`;

const spawnMeteorReplace = `    function spawnMeteor(isHero: boolean, xOverride?: number, speedOverride?: number, lenOverride?: number, widthOverride?: number, yOverride?: number) {
      const startX = xOverride !== undefined ? xOverride : ((Math.random() * 1.5 * width) - (width * 0.2));
      const startY = yOverride !== undefined ? yOverride : (isHero ? (Math.random() * -300 - 100) : (Math.random() * -100 - 50));

      const speed = reduced ? 600 : (speedOverride !== undefined ? speedOverride : (isHero ? 2200 + Math.random() * 1000 : 1200 + Math.random() * 600));
      const angle = (35 + Math.random() * 30) * (Math.PI / 180);
      const len = lenOverride !== undefined ? lenOverride : (isHero ? 350 + Math.random() * 250 : 150 + Math.random() * 100);
      const w = widthOverride !== undefined ? widthOverride : (isHero ? 6 + Math.random() * 5 : 3 + Math.random() * 3);

      s.meteors.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * (startX > width * 0.8 ? -1 : 1) * speed,
        vy: Math.sin(angle) * speed,
        len: len,
        width: w,
        trail: [], life: 0, isHero
      });
    }`;
code = code.replace(spawnMeteorOriginal, spawnMeteorReplace);

const explodeOriginal = `    function explode(x: number, y: number, color: string, isHero: boolean) {
      // Trigger burst sound dynamically, but only once the reveal impact has
      // landed — ambient build-up rockets explode silently.
      if (s.impactTriggered) {
        playAudioBuffer('firework', isHero ? 0.8 : 0.4, 0.8 + Math.random() * 0.4);
      }
      const count = reduced ? 15 : (isHero ? 120 : 37 + Math.floor(Math.random() * 22));
      // Cap sparks if we have too many
      let actualCount = Math.min(count, 150 - s.sparks.length);
      for (let i = 0; i < actualCount; i++) {
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(Math.random() * 2 - 1);
        const speed = (isHero ? 200 : 120) + Math.random() * (isHero ? 400 : 250);
        s.sparks.push({
          x, y,
          vx: speed * Math.sin(p) * Math.cos(t),
          vy: speed * Math.cos(p),
          color: Math.random() > (isHero ? 0.6 : 0.8) ? '255, 255, 255' : color,
          age: 0,
          life: (isHero ? 1.5 : 1.0) + Math.random() * 1.0,
          size: 1.5 + ((speed * Math.sin(p) * Math.sin(t)) / speed + 1) / 2 * (isHero ? 4.0 : 2.5),
          trail: []
        });
      }
      if (isHero) s.flash = Math.max(s.flash, 0.6);
    }`;

const explodeReplace = `    function explode(x: number, y: number, color: string, isHero: boolean) {
      if (s.impactTriggered) {
        playAudioBuffer('firework', isHero ? 0.8 : 0.4, 0.8 + Math.random() * 0.4);
      }
      const count = reduced ? 25 : (isHero ? 180 : 60 + Math.floor(Math.random() * 30));
      let actualCount = Math.min(count, 300 - s.sparks.length);

      const burstType = Math.random();

      for (let i = 0; i < actualCount; i++) {
        let vx = 0, vy = 0;
        let speed = (isHero ? 350 : 200) + (Math.random() * (isHero ? 250 : 150));

        if (burstType < 0.3) {
           const angle = Math.random() * Math.PI * 2;
           speed *= 0.8 + Math.random() * 0.4;
           vx = speed * Math.cos(angle);
           vy = speed * Math.sin(angle);
        } else if (burstType < 0.7) {
           const t = Math.random() * Math.PI * 2;
           const p = Math.acos(Math.random() * 2 - 1);
           vx = speed * Math.sin(p) * Math.cos(t);
           vy = speed * Math.cos(p);
        } else {
           vx = (Math.random() - 0.5) * speed * 2;
           vy = (Math.random() - 0.5) * speed * 2;
        }

        s.sparks.push({
          x, y,
          vx,
          vy,
          color: Math.random() > (isHero ? 0.6 : 0.8) ? '255, 255, 255' : color,
          age: 0,
          life: (isHero ? 2.5 : 1.8) + Math.random() * 1.5,
          size: 2.0 + Math.random() * (isHero ? 3.0 : 1.5),
          trail: []
        });
      }
      if (isHero) s.flash = Math.max(s.flash, 0.8);
    }`;
code = code.replace(explodeOriginal, explodeReplace);

const spawnRocketOriginal = `    function spawnRocket(isHero: boolean, xOverride?: number, speedOverride?: number) {
      const color = FIREWORK_COLORS[randomInt(0, FIREWORK_COLORS.length - 1)];
      const x = xOverride !== undefined ? xOverride : (isHero ? (width * 0.5 + (Math.random()-0.5)*300) : (width * (0.1 + Math.random() * 0.8)));
      s.rockets.push({
        x, y: height,
        vx: (Math.random() - 0.5) * (isHero ? 100 : 50),
        vy: speedOverride !== undefined ? -speedOverride : -(isHero ? 650 + Math.random()*200 : 450 + Math.random() * 150),
        color, trail: [], exploded: false, isHero
      });
    }`;

const spawnRocketReplace = `    function spawnRocket(isHero: boolean, xOverride?: number, speedOverride?: number) {
      const color = FIREWORK_COLORS[randomInt(0, FIREWORK_COLORS.length - 1)];
      const x = xOverride !== undefined ? xOverride : (isHero ? (width * 0.5 + (Math.random()-0.5)*300) : (width * (0.1 + Math.random() * 0.8)));
      s.rockets.push({
        x, y: height + 20,
        vx: (Math.random() - 0.5) * (isHero ? 120 : 60),
        vy: speedOverride !== undefined ? -speedOverride : -(isHero ? 750 + Math.random()*250 : 550 + Math.random() * 200),
        color, trail: [], exploded: false, isHero
      });
    }`;
code = code.replace(spawnRocketOriginal, spawnRocketReplace);

const spawnBoltOriginal = `    function generateBoltBranch(x: number, y: number, tx: number, ty: number, depth: number): BoltBranch {
      const dx = tx - x, dy = ty - y;
      const dist = Math.hypot(dx, dy);
      const segments: BoltSegment[] = [];
      let cx = x, cy = y;

      const stepSize = depth === 3 ? 15 : 25;
      const steps = Math.max(4, Math.floor(dist / stepSize));

      for(let i = 0; i <= steps; i++) {
          segments.push({x: cx, y: cy});
          if (i < steps) {
             const jitter = (depth * 10) + 5;
             cx += (dx / steps) + (Math.random() - 0.5) * jitter;
             cy += (dy / steps) + (Math.random() - 0.5) * jitter;
          }
      }
      segments.push({x: tx, y: ty});

      const branches: BoltBranch[] = [];
      if (depth > 0) {
          const numBranches = reduced ? 1 : randomInt(2, depth === 3 ? 5 : 3);
          for(let i = 0; i < numBranches; i++) {
              const idx = randomInt(1, segments.length - 2);
              if(!segments[idx]) continue;
              const pt = segments[idx];
              const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
              const len = dist * (0.2 + Math.random() * 0.4);
              branches.push(generateBoltBranch(pt.x, pt.y, pt.x + Math.cos(angle) * len, pt.y + Math.sin(angle) * len, depth - 1));
          }
      }
      return { segments, branches, thickness: depth * 1.8 + 1 };
    }

    function spawnBolt(isHero: boolean) {
      const startX = isHero ? width * 0.5 + (Math.random() - 0.5) * 150 : width * (0.1 + Math.random() * 0.8);
      const targetX = startX + (Math.random() - 0.5) * width * (isHero ? 0.8 : 0.6);
      const depth = isHero ? 3 : randomInt(1, 2);
      const targetY = height * (isHero ? (0.8 + Math.random() * 0.3) : (0.5 + Math.random() * 0.4));

      const mainBranch = generateBoltBranch(startX, -50, targetX, targetY, depth);
      s.bolts.push({ main: mainBranch, age: 0, life: isHero ? 0.8 : (0.2 + Math.random() * 0.2), isHero });
      s.flash = isHero ? 1.5 : (s.flash + 0.4);
    }`;

const spawnBoltReplace = `    function generateBoltBranch(x: number, y: number, tx: number, ty: number, depth: number): BoltBranch {
      const dx = tx - x, dy = ty - y;
      const dist = Math.hypot(dx, dy);
      const segments: BoltSegment[] = [];
      let cx = x, cy = y;

      const stepSize = depth >= 3 ? 10 : (depth === 2 ? 20 : 35);
      const steps = Math.max(4, Math.floor(dist / stepSize));

      for(let i = 0; i <= steps; i++) {
          segments.push({x: cx, y: cy});
          if (i < steps) {
             const jitter = (depth * 15) + (Math.random() * 10);
             cx += (dx / steps) + (Math.random() - 0.5) * jitter;
             cy += (dy / steps) + (Math.random() - 0.5) * jitter;
          }
      }
      segments.push({x: tx, y: ty});

      const branches: BoltBranch[] = [];
      if (depth > 0) {
          const numBranches = reduced ? 1 : randomInt(1, depth >= 3 ? 4 : 2);
          for(let i = 0; i < numBranches; i++) {
              const idx = randomInt(1, segments.length - 2);
              if(!segments[idx]) continue;
              const pt = segments[idx];
              const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.8);
              const len = dist * (0.3 + Math.random() * 0.4);
              branches.push(generateBoltBranch(pt.x, pt.y, pt.x + Math.cos(angle) * len, pt.y + Math.sin(angle) * len, depth - 1));
          }
      }
      return { segments, branches, thickness: depth * 1.5 + 0.5 };
    }

    function spawnBolt(isHero: boolean) {
      const startX = isHero ? width * 0.5 + (Math.random() - 0.5) * 200 : width * (0.1 + Math.random() * 0.8);
      const targetX = startX + (Math.random() - 0.5) * width * (isHero ? 0.9 : 0.7);
      const depth = isHero ? randomInt(3, 4) : randomInt(1, 3);
      const targetY = height * (isHero ? (0.8 + Math.random() * 0.4) : (0.5 + Math.random() * 0.5));

      const mainBranch = generateBoltBranch(startX, -50, targetX, targetY, depth);
      s.bolts.push({ main: mainBranch, age: 0, life: isHero ? 1.0 : (0.3 + Math.random() * 0.3), isHero });
      s.flash = isHero ? 2.5 : (s.flash + 0.6);
    }`;
code = code.replace(spawnBoltOriginal, spawnBoltReplace);

const drawMeteorOriginal = `      // Draw Meteors
      for (let i = s.meteors.length - 1; i >= 0; i--) {
        const m = s.meteors[i];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        m.trail.unshift({ x: m.x, y: m.y, alpha: 1 });
        if (m.trail.length > (m.isHero ? 25 : 15)) m.trail.pop();

        if (m.trail.length < 2) continue;

        const tail = m.trail[m.trail.length - 1];
        const dist = Math.hypot(m.x - tail.x, m.y - tail.y);
        const actualLen = Math.min(dist, m.len);

        ctx!.beginPath();
        const grad = ctx!.createLinearGradient(m.x, m.y, tail.x, tail.y);
        const alpha = m.isHero ? 1.0 : 0.5 + Math.random() * 0.3;
        grad.addColorStop(0, \`rgba(255, 255, 255, \${alpha})\`);
        grad.addColorStop(0.3, \`rgba(200, 240, 255, \${alpha * 0.6})\`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx!.strokeStyle = grad;
        ctx!.lineWidth = m.width;
        ctx!.lineCap = 'round';
        ctx!.moveTo(m.x | 0, m.y | 0);
        ctx!.lineTo(tail.x | 0, tail.y | 0);
        ctx!.stroke();

        const coreSize = m.isHero ? m.width * 1.5 : m.width;
        ctx!.fillStyle = \`rgba(255, 255, 255, \${alpha})\`;
        ctx!.beginPath(); ctx!.arc(m.x | 0, m.y | 0, coreSize, 0, Math.PI * 2); ctx!.fill();

        if (m.isHero && Math.random() > 0.6) {
           spawnDust(m.x, m.y, true);
        }

        if (m.y > height + 200 || m.x < -200 || m.x > width + 200) s.meteors.splice(i, 1);
      }`;
const drawMeteorReplace = `      // Draw Meteors
      for (let i = s.meteors.length - 1; i >= 0; i--) {
        const m = s.meteors[i];
        m.life += dt;

        const accel = 1 + dt * 0.5;
        m.vx *= accel;
        m.vy *= accel;

        m.x += m.vx * dt;
        m.y += m.vy * dt;

        m.trail.unshift({ x: m.x, y: m.y, alpha: 1 });
        if (m.trail.length > (m.isHero ? 25 : 15)) m.trail.pop();

        if (m.trail.length < 2) continue;

        const tail = m.trail[m.trail.length - 1];
        const dist = Math.hypot(m.x - tail.x, m.y - tail.y);
        const actualLen = Math.min(dist, m.len);

        const atmosphericAlpha = Math.max(0, Math.min(1, Math.sin((Math.max(0, Math.min(height, m.y)) / height) * Math.PI)));
        const baseAlpha = m.isHero ? 1.0 : (0.5 + Math.random() * 0.3) * atmosphericAlpha;

        ctx!.beginPath();
        const glowGrad = ctx!.createLinearGradient(m.x, m.y, tail.x, tail.y);
        glowGrad.addColorStop(0, \`rgba(255, 255, 255, \${baseAlpha})\`);
        glowGrad.addColorStop(0.1, \`rgba(150, 220, 255, \${baseAlpha * 0.8})\`);
        glowGrad.addColorStop(0.5, \`rgba(100, 150, 255, \${baseAlpha * 0.4})\`);
        glowGrad.addColorStop(1, 'rgba(50, 100, 200, 0)');
        ctx!.strokeStyle = glowGrad;
        ctx!.lineWidth = m.width * 2.5;
        ctx!.lineCap = 'round';
        ctx!.moveTo(m.x | 0, m.y | 0);
        ctx!.lineTo(tail.x | 0, tail.y | 0);
        ctx!.stroke();

        ctx!.beginPath();
        const coreGrad = ctx!.createLinearGradient(m.x, m.y, tail.x, tail.y);
        coreGrad.addColorStop(0, \`rgba(255, 255, 255, \${baseAlpha})\`);
        coreGrad.addColorStop(0.3, \`rgba(200, 240, 255, \${baseAlpha * 0.6})\`);
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.strokeStyle = coreGrad;
        ctx!.lineWidth = m.width;
        ctx!.moveTo(m.x | 0, m.y | 0);
        ctx!.lineTo(tail.x | 0, tail.y | 0);
        ctx!.stroke();

        const coreSize = m.isHero ? m.width * 1.5 : m.width;
        ctx!.fillStyle = \`rgba(255, 255, 255, \${baseAlpha})\`;
        ctx!.beginPath(); ctx!.arc(m.x | 0, m.y | 0, coreSize, 0, Math.PI * 2); ctx!.fill();

        if (m.isHero && Math.random() > 0.6) {
           spawnDust(m.x, m.y, true);
        }

        if (m.y > height + 200 || m.x < -200 || m.x > width + 200) s.meteors.splice(i, 1);
      }`;
code = code.replace(drawMeteorOriginal, drawMeteorReplace);


const drawBoltOriginal = `      // Draw Lightning Bolts
      function drawBranch(branch: BoltBranch, alpha: number, isGlow: boolean) {
         ctx!.beginPath();
         ctx!.lineWidth = isGlow ? branch.thickness * 7 : branch.thickness * 1.5;
         ctx!.strokeStyle = isGlow ? '#c864ff' : '#dcf0ff';
         ctx!.globalAlpha = isGlow ? alpha * 0.6 : alpha;
         ctx!.lineJoin = 'miter';
         branch.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
         ctx!.stroke();
         ctx!.globalAlpha = 1.0;
         branch.branches.forEach(b => drawBranch(b, alpha, isGlow));
      }

      for (let i = s.bolts.length - 1; i >= 0; i--) {
        const bolt = s.bolts[i];
        bolt.age += dt;

        const alpha = bolt.isHero
           ? Math.max(0, 1 - (bolt.age / bolt.life)) * (Math.random() > 0.15 ? 1 : 0.1)
           : Math.max(0, 1 - (bolt.age / bolt.life));

        if (alpha <= 0) { s.bolts.splice(i, 1); continue; }

        drawBranch(bolt.main, alpha, true);
        if (bolt.isHero && alpha > 0.3) {
            ctx!.beginPath();
            ctx!.lineWidth = bolt.main.thickness * 2;
            ctx!.strokeStyle = '#64c8ff';
            ctx!.globalAlpha = alpha * 0.8;
            bolt.main.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
            ctx!.stroke();
            ctx!.globalAlpha = 1.0;
        }
        drawBranch(bolt.main, alpha, false);
      }`;
const drawBoltReplace = `      // Draw Lightning Bolts
      function drawBranch(branch: BoltBranch, alpha: number, isGlow: boolean) {
         ctx!.beginPath();
         ctx!.lineWidth = isGlow ? branch.thickness * (branch.thickness > 3 ? 6 : 4) : branch.thickness;
         ctx!.strokeStyle = isGlow ? '#c864ff' : '#ffffff';
         ctx!.globalAlpha = isGlow ? alpha * 0.7 : alpha;
         ctx!.lineJoin = 'miter';
         branch.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
         ctx!.stroke();
         ctx!.globalAlpha = 1.0;
         branch.branches.forEach(b => drawBranch(b, alpha, isGlow));
      }

      for (let i = s.bolts.length - 1; i >= 0; i--) {
        const bolt = s.bolts[i];
        bolt.age += dt;

        const flicker = Math.random() > 0.4 ? 1 : 0.4;
        const alpha = bolt.isHero
           ? Math.max(0, 1 - Math.pow((bolt.age / bolt.life), 2)) * flicker
           : Math.max(0, 1 - (bolt.age / bolt.life)) * flicker;

        if (alpha <= 0) { s.bolts.splice(i, 1); continue; }

        drawBranch(bolt.main, alpha, true);
        if (bolt.isHero && alpha > 0.2) {
            ctx!.beginPath();
            ctx!.lineWidth = bolt.main.thickness * 1.5;
            ctx!.strokeStyle = '#a0e6ff';
            ctx!.globalAlpha = alpha * 0.9;
            bolt.main.segments.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
            ctx!.stroke();
            ctx!.globalAlpha = 1.0;
        }
        drawBranch(bolt.main, alpha, false);
      }`;
code = code.replace(drawBoltOriginal, drawBoltReplace);

const drawSparksOriginal = `      // Draw Fireworks & Sparks
      for (let i = s.rockets.length - 1; i >= 0; i--) {
        const r = s.rockets[i]; r.vy += 260 * dt; r.vx *= 1 - dt * 0.2; r.x += r.vx * dt; r.y += r.vy * dt;
        r.trail.unshift({ x: r.x, y: r.y }); if (r.trail.length > (r.isHero ? 20 : 15)) r.trail.pop();
        ctx!.strokeStyle = '#ffc864';
        // FIXED TRAIL LOGIC (Visual Regression Fix)
        const lastIndex = Math.max(0, r.trail.length - 1);
        ctx!.beginPath();
        const grad = ctx!.createLinearGradient(r.x, r.y, r.trail[lastIndex]?.x || r.x, r.trail[lastIndex]?.y || r.y);
        grad.addColorStop(0, 'rgba(255,200,100,1)');
        grad.addColorStop(1, 'rgba(255,200,100,0)');

        ctx!.strokeStyle = grad;
        ctx!.lineWidth = r.isHero ? 5 : 3;
        ctx!.globalAlpha = 1.0;
        ctx!.lineCap = 'round';
        r.trail.forEach((t, j) => {
          j === 0 ? ctx!.moveTo(t.x | 0, t.y | 0) : ctx!.lineTo(t.x | 0, t.y | 0);
        });
        ctx!.stroke();
        ctx!.globalAlpha = 1.0;

        if (Math.random() > 0.5) spawnDust(r.x, r.y);

        if (r.vy >= -50 || r.y < height * (r.isHero ? 0.15 : 0.3)) {
          explode(r.x, r.y, r.color, r.isHero);
          r.exploded = true;
        }
        if (r.exploded || r.y < -20) s.rockets.splice(i, 1);
      }

      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i]; sp.age += dt; sp.vy += 120 * dt; sp.vx *= 1 - dt * 0.7; sp.vy *= 1 - dt * 0.4;
        sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.trail.unshift({ x: sp.x, y: sp.y });
        if (sp.trail.length > (reduced ? 12 : 18)) sp.trail.pop();

        const alpha = Math.max(0, 1 - Math.pow(sp.age / sp.life, 2));
        if (alpha <= 0) { s.sparks.splice(i, 1); continue; }

        // PERFORMANCE OPTIMIZATION (Bolt ⚡):
        // Extracted context assignments outside the path-building loop to prevent
        // redundant state mutations per point, using final values to preserve exact visuals.
        // FIXED TRAIL LOGIC (Visual Regression Fix)
        const lastIndex = Math.max(0, sp.trail.length - 1);
        ctx!.beginPath();
        const grad = ctx!.createLinearGradient(sp.x, sp.y, sp.trail[lastIndex]?.x || sp.x, sp.trail[lastIndex]?.y || sp.y);
        grad.addColorStop(0, \`rgba(\${sp.color}, \${alpha})\`);
        grad.addColorStop(1, \`rgba(\${sp.color}, 0)\`);

        ctx!.strokeStyle = grad;
        ctx!.lineWidth = sp.size;
        ctx!.globalAlpha = 1.0;
        ctx!.lineCap = 'round';
        sp.trail.forEach((t, j) => {
          j === 0 ? ctx!.moveTo(t.x | 0, t.y | 0) : ctx!.lineTo(t.x | 0, t.y | 0);
        });
        ctx!.stroke();
        ctx!.globalAlpha = 1.0;

        const cx = sp.x | 0; const cy = sp.y | 0;
        const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, sp.size * 3);
        glow.addColorStop(0, \`rgb(\${sp.color})\`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = glow;
        ctx!.fillRect((cx - sp.size * 3) | 0, (cy - sp.size * 3) | 0, (sp.size * 6) | 0, (sp.size * 6) | 0);
        ctx!.globalAlpha = 1.0;

        if (sp.size > 2.5 && Math.random() > 0.8) {
           spawnDust(sp.x, sp.y);
        }
      }`;

const drawSparksReplace = `      // Draw Fireworks & Sparks
      for (let i = s.rockets.length - 1; i >= 0; i--) {
        const r = s.rockets[i];
        r.vy += 320 * dt;
        r.vx *= 1 - dt * 0.3;
        r.x += r.vx * dt;
        r.y += r.vy * dt;

        r.trail.unshift({ x: r.x, y: r.y });
        if (r.trail.length > (r.isHero ? 25 : 18)) r.trail.pop();

        ctx!.strokeStyle = '#ffc864';
        const lastIndex = Math.max(0, r.trail.length - 1);
        ctx!.beginPath();
        const grad = ctx!.createLinearGradient(r.x, r.y, r.trail[lastIndex]?.x || r.x, r.trail[lastIndex]?.y || r.y);
        grad.addColorStop(0, 'rgba(255,200,100,1)');
        grad.addColorStop(1, 'rgba(255,200,100,0)');
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = r.isHero ? 4 : 2;
        ctx!.lineCap = 'round';
        r.trail.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
        ctx!.stroke();

        ctx!.fillStyle = '#ffffff';
        ctx!.beginPath(); ctx!.arc(r.x | 0, r.y | 0, r.isHero ? 3 : 2, 0, Math.PI * 2); ctx!.fill();

        if (r.vy >= -50 || r.y < height * 0.1) {
          if (!r.exploded) { r.exploded = true; explode(r.x, r.y, r.color, r.isHero); }
          s.rockets.splice(i, 1);
        }
      }

      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        sp.age += dt;
        if (sp.age >= sp.life) { s.sparks.splice(i, 1); continue; }

        sp.vy += 180 * dt;
        sp.vx *= 1 - dt * 1.5;
        sp.vy *= 1 - dt * 1.5;

        const flicker = Math.random() > 0.8 ? 0.5 : 1.0;
        const alpha = Math.max(0, 1 - Math.pow(sp.age / sp.life, 1.5)) * flicker;

        sp.x += sp.vx * dt; sp.y += sp.vy * dt;

        sp.trail.unshift({x: sp.x, y: sp.y});
        if (sp.trail.length > Math.max(3, Math.floor(sp.size * 2))) sp.trail.pop();

        if (sp.trail.length > 1) {
            ctx!.beginPath();
            ctx!.lineWidth = sp.size;
            ctx!.lineCap = 'round';
            ctx!.strokeStyle = \`rgba(\${sp.color}, \${alpha * 0.8})\`;
            sp.trail.forEach((p, idx) => idx === 0 ? ctx!.moveTo(p.x | 0, p.y | 0) : ctx!.lineTo(p.x | 0, p.y | 0));
            ctx!.stroke();
        }

        ctx!.fillStyle = \`rgba(\${sp.color}, \${alpha})\`;
        ctx!.beginPath(); ctx!.arc(sp.x | 0, sp.y | 0, sp.size * 0.8, 0, Math.PI * 2); ctx!.fill();

        if (alpha > 0.3) {
            ctx!.fillStyle = \`rgba(\${sp.color}, \${alpha * 0.2})\`;
            ctx!.beginPath(); ctx!.arc(sp.x | 0, sp.y | 0, sp.size * 3, 0, Math.PI * 2); ctx!.fill();
        }
      }`;

code = code.replace(drawSparksOriginal, drawSparksReplace);

fs.writeFileSync('components/LuckyGenerator.tsx', code);

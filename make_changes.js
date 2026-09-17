const fs = require('fs');

const path = 'components/DailyResonance.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace updatePercentage
const oldUpdatePercentage = `    const updatePercentage = () => {
      let jitter = Math.floor((Math.random() - 0.5) * proxy.jitterMag);
      let currentVal = Math.floor(proxy.val + jitter);
      currentVal = Math.max(0, Math.min(100, currentVal));
      setDisplayPercentage(currentVal);
    };`;

const newUpdatePercentage = `    const updatePercentage = () => {
      let wrappedVal = Math.floor(proxy.val) % 101;
      if (wrappedVal < 0) wrappedVal += 101;

      let jitter = Math.floor((Math.random() - 0.5) * proxy.jitterMag);
      let currentVal = wrappedVal + jitter;
      currentVal = Math.max(0, Math.min(100, currentVal));
      setDisplayPercentage(currentVal);
    };`;

content = content.replace(oldUpdatePercentage, newUpdatePercentage);

// Replace Phase 3
const oldPhase3 = `    // Phase 3: 0 -> finalPct (4.5s to 7.5s)
    // Decelerate naturally into the actual result
    tl.to(proxy, {
      val: newPct,
      duration: 3.0,
      ease: "power3.out",
      onUpdate: updatePercentage
    }, 4.5);`;

const newPhase3 = `    // Phase 3: 0 -> finalPct (4.5s to 7.5s)
    // Roll continuously and decelerate decisively at the very end to prevent early prediction
    tl.to(proxy, {
      val: newPct + 303, // 3 full cycles of 101 to keep it rolling wildly
      duration: 3.0,
      ease: "power4.inOut",
      onUpdate: updatePercentage
    }, 4.5);`;

content = content.replace(oldPhase3, newPhase3);

fs.writeFileSync(path, content);
console.log('Changes applied!');

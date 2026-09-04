const fs = require('fs');
let code = fs.readFileSync('components/DailyResonance.tsx', 'utf-8');

// I also need to update the visual pulse in the UI, but first let's make sure that handleReveal actually triggers it.
// To do that, I'll add a 'shake' or 'pulse' to the percentage text during the tension tick.
// Wait, I can just use a fast React state for a simple bump animation.
// Wait, modifying the component to use CSS class for pulse based on a ref or state.
// We already have `displayPercentage` which changes fast during tension. That alone is enough of a visual change for the numbers.
// The user asked to "Improve the visual treatment where necessary so the pulse strikes feel more substantial and intentional. Explore improvements such as: stronger energy pulses; more convincing impact moments; additional controlled light/particle effects;"
// Let's ensure the `animateCanvas` impact has a strong flash.

const oldCosmic = `        // PERFORMANCE OPTIMIZATION (Bolt ⚡): Extract full-screen background flash
        // outside the particle loop to prevent massive overdraw (filling the entire screen
        // multiple times per frame) when several cosmic lightning bolts are active.
        let maxFlash = 0;
        particles.forEach((p: any) => {
          if (p.flash > maxFlash) maxFlash = p.flash;
        });
        if (maxFlash > 0) {
          ctx.fillStyle = \`rgba(220, 200, 255, \${maxFlash * 0.15})\`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }`;

const newCosmic = `        let maxFlash = 0;
        particles.forEach((p: any) => {
          if (p.flash > maxFlash) maxFlash = p.flash;
        });
        if (maxFlash > 0) {
          // Stronger energy pulse / screen flash for Cosmic Lightning impact
          const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width);
          grad.addColorStop(0, \`rgba(150, 200, 255, \${maxFlash * 0.4})\`);
          grad.addColorStop(1, \`rgba(100, 0, 255, 0)\`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }`;
code = code.replace(oldCosmic, newCosmic);

// Improve Meteor Shower flash
const oldMeteor = `        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {`;

const newMeteor = `        // Add a strong flash for the meteor shower on initial impact
        if (elapsedMs < 1000) {
            const meteorFlash = Math.max(0, 1 - (elapsedMs / 1000));
            ctx.fillStyle = \`rgba(255, 100, 100, \${meteorFlash * 0.25})\`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {`;

code = code.replace(oldMeteor, newMeteor);

// Improve Fireworks flash
const oldFireworks = `        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {`;

const newFireworks = `        // Add a colorful flash for Fireworks on initial impact
        if (elapsedMs < 1500) {
            const fwFlash = Math.max(0, 1 - (elapsedMs / 1500));
            const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/1.5);
            grad.addColorStop(0, \`rgba(255, 200, 100, \${fwFlash * 0.3})\`);
            grad.addColorStop(1, \`rgba(255, 100, 50, 0)\`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.globalCompositeOperation = 'lighter';
        for (let i = particles.length - 1; i >= 0; i--) {`;

// Only replace the third occurrence of this block, which is in Fireworks
let counter = 0;
code = code.replace(/ctx\.globalCompositeOperation = 'lighter';\n        for \(let i = particles\.length - 1; i >= 0; i--\) {/g, (match) => {
    counter++;
    if (counter === 3) return newFireworks;
    return match;
});

fs.writeFileSync('components/DailyResonance.tsx', code);
console.log("Improved canvas impact effects.");

import re

with open('./components/LuckyGenerator.tsx', 'r') as f:
    content = f.read()

# Replace rendering logic
old_draw = """        } else if (tier.id === 'tier2') {
            // Meteor Shower
            ctx.fillStyle = '#3DFFB0';
            ctx.strokeStyle = '#3DFFB0';
            ctx.lineWidth = 2;
            particles.forEach((p, i) => {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
                ctx.stroke();

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.y > height) {
                    p.x = width + Math.random() * 200;
                    p.y = -Math.random() * 200;
                }
            });"""

new_draw = """        } else if (tier.id === 'tier2') {
            // Meteor Shower
            particles.forEach((p, i) => {
                // Calculate tail end point based on velocity direction and length
                const dx = p.x - (p.vx * (p.length / Math.sqrt(p.vx * p.vx + p.vy * p.vy)));
                const dy = p.y - (p.vy * (p.length / Math.sqrt(p.vx * p.vx + p.vy * p.vy)));

                // Gradient tail
                const gradient = ctx.createLinearGradient(p.x, p.y, dx, dy);
                gradient.addColorStop(0, `rgba(61, 255, 176, ${p.alpha})`); // Neon mint
                gradient.addColorStop(1, 'rgba(61, 255, 176, 0)');

                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(dx, dy);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = p.thickness;
                ctx.stroke();

                // Glowing head
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.thickness * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`; // Cyan glow
                ctx.fill();

                // Bright core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.thickness * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // White core
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;

                // Reset logic - wide bounds to avoid popping
                if (p.x < -100 || p.y > height + 100) {
                    p.x = width + Math.random() * 400;
                    p.y = -Math.random() * 400 - 100;
                }
            });"""
if old_draw not in content:
    raise ValueError("Pattern not found in file - replacement failed")
new_content = content.replace(old_draw, new_draw)
new_content = content.replace(old_draw, new_draw)

with open('./components/LuckyGenerator.tsx', 'w') as f:
    f.write(new_content)

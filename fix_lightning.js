const fs = require('fs');

const filePath = 'components/DailyResonance.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldSpawnLightning = `    const spawnLightning = (x: number, y: number, scale: number) => {
        const segments: any[] = [];

        // Build a jagged path by segmenting a straight line with random offsets
        const buildJaggedBranch = (startX: number, startY: number, endX: number, endY: number, roughness: number, generation: number) => {
            if (generation > 7) return; // Increased generations for denser branching
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx*dx + dy*dy);

            if (length < 8) { // Allow smaller final segments
                segments.push({ startX, startY, endX, endY, generation });
                return;
            }

            // Midpoint displacement with extreme chaotic variance for cinematic feel
            const varianceX = (Math.random() - 0.5) * roughness * scale;
            const varianceY = (Math.random() - 0.5) * roughness * scale;

            // Bias downwards slightly to simulate ground-seeking
            const midX = (startX + endX) / 2 + varianceX;
            const midY = (startY + endY) / 2 + varianceY + (roughness * 0.1);

            buildJaggedBranch(startX, startY, midX, midY, roughness * 0.6, generation + 1);
            buildJaggedBranch(midX, midY, endX, endY, roughness * 0.6, generation + 1);

            // Frequent aggressive branching
            if (Math.random() > 0.4) {
                const branchAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.8);
                const branchLength = length * (0.5 + Math.random() * 0.5);
                const bEndX = midX + Math.cos(branchAngle) * branchLength;
                const bEndY = midY + Math.sin(branchAngle) * branchLength;
                buildJaggedBranch(midX, midY, bEndX, bEndY, roughness * 0.75, generation + 1);
            }
        };

        const targetX = x + (Math.random() - 0.5) * 400 * scale; // Wider spread
        const targetY = y + 500 * scale + Math.random() * 300 * scale; // Deeper strikes
        buildJaggedBranch(x, y, targetX, targetY, 200, 0); // Higher initial roughness

        lightningStrikes.push({
            segments,
            life: 1.0,
            flashOpacity: 1.0
        });
    };`;

const newSpawnLightning = `    const spawnLightning = (x: number, y: number, scale: number, isPrimary = false) => {
        const segments: any[] = [];
        const maxGenerations = isMobile ? 6 : (isPrimary ? 8 : 7);

        const buildJaggedBranch = (startX: number, startY: number, endX: number, endY: number, roughness: number, generation: number, branchProb: number) => {
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);

            // If we've reached the generation limit or the segment is very short,
            // push the segment so the bolt remains a continuous connected path.
            if (generation >= maxGenerations || length < (isMobile ? 12 : 8)) {
                segments.push({ startX, startY, endX, endY, generation, isPrimaryBranch: generation === 0 });
                return;
            }

            // Controlled irregularity: variance perpendicular to the segment
            const normalX = -dy / length;
            const normalY = dx / length;

            // Bias downwards to ensure it seeks ground
            const varianceAmt = (Math.random() - 0.5) * roughness * scale;
            const midX = (startX + endX) / 2 + normalX * varianceAmt;
            const midY = (startY + endY) / 2 + normalY * varianceAmt + (roughness * 0.15 * scale);

            buildJaggedBranch(startX, startY, midX, midY, roughness * 0.55, generation + 1, branchProb);
            buildJaggedBranch(midX, midY, endX, endY, roughness * 0.55, generation + 1, branchProb);

            // Natural branching: sparse, deliberate branches rather than noise
            if (Math.random() < branchProb) {
                const branchAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.6);
                const branchLength = length * (0.4 + Math.random() * 0.4);
                const bEndX = midX + Math.cos(branchAngle) * branchLength;
                const bEndY = midY + Math.sin(branchAngle) * branchLength;

                // Secondary branches have drastically reduced branching probability
                buildJaggedBranch(midX, midY, bEndX, bEndY, roughness * 0.7, generation + 1, branchProb * 0.2);
            }
        };

        const targetX = x + (Math.random() - 0.5) * (isMobile ? 250 : 500) * scale;
        // Deep strikes that reach into the composition
        const targetY = y + (isMobile ? 400 : 700) * scale + Math.random() * (isMobile ? 200 : 300) * scale;

        buildJaggedBranch(x, y, targetX, targetY, isMobile ? 120 : 180, 0, isPrimary ? 0.35 : 0.15);

        lightningStrikes.push({
            segments,
            life: 1.0,
            isPrimary,
            scale
        });
    };`;

content = content.replace(oldSpawnLightning, newSpawnLightning);
fs.writeFileSync(filePath, content);
console.log("Updated spawnLightning logic.");

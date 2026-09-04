const fs = require('fs');

let content = fs.readFileSync('./app/lucky-card-reveal.js', 'utf-8');

// The current flipAt is finalStrikeTime + 0.65.
// The reveal shimmer is flipAt + 0.35.
// The visual sequence:
// const finalStrike = schedule[schedule.length - 1];
// const flipAt = finalStrike + 0.65;
// The visual card animation starts the flip at flipAt, with duration 0.8
// The reveal UI changes at elapsed >= flipAt (with 700ms timeout for generating state)

// Let's refine the framer motion shaking parameters and timing.
// The visual strike travels 0.3s, so if strikeTime is T, the hit is at T.
// Currently:
// sequence.push([
//   cardRef.current,
//   {
//     x: [0, power * dir, -power * 0.8 * dir, power * 0.4 * dir, 0],
//     rotateZ: [0, rotPower * dir, -rotPower * 0.5 * dir, 0],
//     scale: isFinal ? [1, 1.15, 0.95, 1.05] : [1, 1.05, 1]
//   },
//   {
//     at: strikeTime.toString(),
//     duration: shakeDur,
//     ease: "easeInOut"
//   }
// ]);

content = content.replace(
`      // The shake hits EXACTLY at the strike time
      const shakeDur = isFinal ? 0.4 : 0.2;

      sequence.push([
        cardRef.current,
        {
          x: [0, power * dir, -power * 0.8 * dir, power * 0.4 * dir, 0],
          rotateZ: [0, rotPower * dir, -rotPower * 0.5 * dir, 0],
          scale: isFinal ? [1, 1.15, 0.95, 1.05] : [1, 1.05, 1]
        },`,
`      // The shake hits EXACTLY at the strike time
      const shakeDur = isFinal ? 0.5 : 0.25; // SLIGHTLY LONGER SHAKE
      const scaleUp = isFinal ? 1.3 : 1.1; // MORE VISIBLE IMPACT
      const finalScale = isFinal ? 1.1 : 1.0;

      sequence.push([
        cardRef.current,
        {
          x: [0, power * dir, -power * 0.8 * dir, power * 0.4 * dir, 0],
          rotateZ: [0, rotPower * dir, -rotPower * 0.5 * dir, 0],
          scale: [1, scaleUp, finalScale]
        },`
);

fs.writeFileSync('./app/lucky-card-reveal.js', content);

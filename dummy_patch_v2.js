const fs = require('fs');
let content = fs.readFileSync('app/lucky-card-reveal.js', 'utf8');

const oldFlipAt = `    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.1;
    const maxLifetime = flipAt + 3.0;`;
const newFlipAt = `    const finalStrike = schedule[schedule.length - 1];
    const flipAt = finalStrike + 0.8; // Brief dramatic hold after final impact
    const maxLifetime = flipAt + 3.0;`;

content = content.replace(oldFlipAt, newFlipAt);

const oldSequencePush = `    const flipAt = finalStrike + 0.1;

    sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);`;
const newSequencePush = `    const flipAt = finalStrike + 0.8;

    sequence.push([cardRef.current, { x: 0, y: 0, rotateZ: 0, opacity: 1, filter: "brightness(1)" }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);
    sequence.push([cardFlipRef.current, { rotateY: 180 }, { at: flipAt.toString(), duration: 0.8, ease: "circOut" }]);`;

content = content.replace(oldSequencePush, newSequencePush);

fs.writeFileSync('app/lucky-card-reveal.js', content, 'utf8');

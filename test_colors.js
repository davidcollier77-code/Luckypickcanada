const STRIKE_SCHEDULES = {
  standard: [1.5, 2.8, 4.3],
  premium: [1.2, 2.3, 3.4, 4.5, 6.2],
  flagship: [1.0, 1.8, 2.6, 3.4, 4.2, 5.0, 7.0]
};

// We need an array where preliminary strikes alternate between electric blue and magenta.
// The final strike color will be the tier color.

const colorSequence = [];
const electricBlue = '14, 165, 233'; // light blue
const magenta = '217, 70, 239'; // fuchsia

const tierFinalColors = {
    standard: '180, 83, 9', // bronze / amber / copper
    premium: '156, 163, 175', // platinum / silver / gray
    flagship: '234, 179, 8' // gold / yellow
}

console.log("standard", STRIKE_SCHEDULES.standard.map((_, i) => i === STRIKE_SCHEDULES.standard.length - 1 ? tierFinalColors.standard : (i % 2 === 0 ? electricBlue : magenta)));
console.log("premium", STRIKE_SCHEDULES.premium.map((_, i) => i === STRIKE_SCHEDULES.premium.length - 1 ? tierFinalColors.premium : (i % 2 === 0 ? electricBlue : magenta)));
console.log("flagship", STRIKE_SCHEDULES.flagship.map((_, i) => i === STRIKE_SCHEDULES.flagship.length - 1 ? tierFinalColors.flagship : (i % 2 === 0 ? electricBlue : magenta)));

const luckyColors = ['Aurora Green', 'Star Gold', 'Midnight Blue', 'Lucky Red', 'Moonlight Silver', 'Northern Purple', 'Sky Blue'];
const luckyDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function generateLuckyNumbers(count, max) {
  const numbers = Array.from({ length: max }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const swapIndex = randomBuffer[0] % (index + 1);
    [numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]];
  }

  return numbers.slice(0, count).sort((a, b) => a - b);
}

function pickOne(items) {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  return items[randomBuffer[0] % items.length];
}

export function createLuckyReveal(luckyPickGame) {
  const isSevenPick = luckyPickGame === '7';

  return {
    game: {
      name: isSevenPick ? '7 Pick' : '6 Pick',
      numbers: generateLuckyNumbers(isSevenPick ? 7 : 6, isSevenPick ? 50 : 49),
    },
    luckyColor: pickOne(luckyColors),
    luckyDay: pickOne(luckyDays),
  };
}

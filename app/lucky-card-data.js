import { LUCKY_CARD_IMAGES, LUCKY_CARD_QUOTES, LUCKY_CARD_RARITY_WEIGHTS } from './lucky-card-content';
import { isLuckyCardTestModeEnabled } from './developer-tools/lucky-card-test-mode/toggle-card-test-mode';

const CARD_DEFINITIONS = [
  ['number-seeker', 'The Number Seeker', false, 'standard'],
  ['iron-horseshoe', 'The Iron Horseshoe', false, 'standard'],
  ['emerald-clover', 'The Emerald Four-Leaf', false, 'standard'],
  ['optimists-path', "The Optimist's Path", false, 'standard'],
  ['cosmic-flow', 'Cosmic Flow', false, 'standard'],
  ['guiding-star', 'The Guiding Star', false, 'premium'],
  ['northern-lights', 'The Northern Lights', true, 'premium'],
  ['coast-to-coast-tale', 'Coast-to-Coast Tale', true, 'premium'],
  ['lucky-golden-pick', 'Lucky Golden Pick', true, 'flagship'],
  ['flagship-card', 'The Flagship Card', false, 'flagship'],
];

export const LUCKY_CARDS = CARD_DEFINITIONS.map(([id, title, isReveal, tier]) => ({
  id,
  title,
  image: LUCKY_CARD_IMAGES[id],
  quote: LUCKY_CARD_QUOTES[id],
  isReveal,
  tier,
  rarityWeight: LUCKY_CARD_RARITY_WEIGHTS[id]
}));

export function selectWeightedLuckyCard(previousCardId = null) {
  const isTestMode = isLuckyCardTestModeEnabled();

  let availableCards = LUCKY_CARDS;
  // Strict Anti-Repeat Protection: Exclude yesterday's card so users never receive duplicates back-to-back.
  if (previousCardId && availableCards.length > 1) {
    availableCards = availableCards.filter(card => card.id !== previousCardId);
  }

  if (isTestMode) {
    // During test mode, randomly select any card to make testing all states easy
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    return availableCards[randomIndex];
  }

  const totalWeight = availableCards.reduce((sum, card) => sum + card.rarityWeight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const card of availableCards) {
    if (randomValue < card.rarityWeight) {
      return card;
    }
    randomValue -= card.rarityWeight;
  }

  return availableCards[0]; // Fallback to first card if something goes wrong
}

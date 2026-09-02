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
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomIndex = randomBuffer[0] % availableCards.length;
    return availableCards[randomIndex];
  }

  // Step 1: Select tier based on fixed probabilities
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const tierRoll = randomBuffer[0] / (0xffffffff + 1);
  let selectedTier = 'standard';

  if (tierRoll < 0.70) {
    selectedTier = 'standard';
  } else if (tierRoll < 0.95) {
    selectedTier = 'premium';
  } else {
    selectedTier = 'flagship';
  }

  // Step 2: Filter available cards by the selected tier
  let tierCards = availableCards.filter((card) => card.tier === selectedTier);

  // Step 3: Fallback if no cards are available in that tier (e.g., all were excluded by anti-repeat)
  if (tierCards.length === 0) {
    tierCards = availableCards;
  }

  // Step 4: Pick randomly among the tier cards based on their relative rarity weight
  const totalWeight = tierCards.reduce((sum, card) => sum + card.rarityWeight, 0);
  const weightBuffer = new Uint32Array(1);
  crypto.getRandomValues(weightBuffer);
  let randomValue = (weightBuffer[0] / (0xffffffff + 1)) * totalWeight;

  for (const card of tierCards) {
    if (randomValue < card.rarityWeight) {
      return card;
    }
    randomValue -= card.rarityWeight;
  }

  return tierCards[0]; // Fallback to first card if something goes wrong
}

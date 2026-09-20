import { LUCKY_CARD_IMAGES, LUCKY_CARD_QUOTES, LUCKY_CARD_RARITY_WEIGHTS } from './lucky-card-content';
import { isLuckyCardTestModeEnabled } from './developer-tools/lucky-card-test-mode/toggle-card-test-mode';

const CARD_DEFINITIONS = [
  ['number-seeker', 'The Number Seeker', false, 'standard'],
  ['iron-horseshoe', 'The Iron Horseshoe', false, 'standard'],
  ['emerald-clover', 'The Emerald Four-Leaf', false, 'standard'],
  ['optimists-path', "The Optimist's Path", false, 'standard'],
  ['cosmic-flow', 'Cosmic Flow', false, 'standard'],
  ['guiding-star', 'The Guiding Star', false, 'standard'],
  ['northern-lights', 'The Northern Lights', true, 'premium'],
  ['coast-to-coast-tale', 'Coast-to-Coast Tale', true, 'premium'],
  ['lucky-canadian-moose', 'Lucky Canadian Moose', true, 'premium'],
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

export function selectWeightedLuckyCard(previousCardId = null, previousQuote = null) {
  const isTestMode = isLuckyCardTestModeEnabled();

  if (isTestMode) {
    // During test mode, randomly select any card to make testing all states easy
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const randomIndex = randomBuffer[0] % LUCKY_CARDS.length;
    return LUCKY_CARDS[randomIndex];
  }

  // 1. SELECT TIER EXACTLY AS REQUIRED: Standard: 39%, Premium: 36%, Flagship: 25%
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const tierRoll = randomBuffer[0] / (0xffffffff + 1);

  let selectedTier = 'standard';
  if (tierRoll < 0.39) {
    selectedTier = 'standard';
  } else if (tierRoll < 0.75) { // 0.39 + 0.36 = 0.75
    selectedTier = 'premium';
  } else {
    selectedTier = 'flagship';
  }

  // 2. FILTER CARDS BY TIER
  let tierCards = LUCKY_CARDS.filter((card) => card.tier === selectedTier);

  // 3. APPLY ANTI-REPEAT FOR CARDS
  if (previousCardId && tierCards.length > 1) {
    tierCards = tierCards.filter(card => card.id !== previousCardId);
  }

  // Fallback if no cards are available in that tier (extremely unlikely with current data)
  if (tierCards.length === 0) {
    tierCards = LUCKY_CARDS.filter((card) => card.tier === selectedTier);
  }

  // 4. RANDOM CARD SELECTION WITHIN TIER BASED ON WEIGHT
  const totalWeight = tierCards.reduce((sum, card) => sum + card.rarityWeight, 0);
  const weightBuffer = new Uint32Array(1);
  crypto.getRandomValues(weightBuffer);
  let randomValue = (weightBuffer[0] / (0xffffffff + 1)) * totalWeight;

  let selectedCard = tierCards[0];
  for (const card of tierCards) {
    if (randomValue < card.rarityWeight) {
      selectedCard = card;
      break;
    }
    randomValue -= card.rarityWeight;
  }

  // 5. INDEPENDENT RANDOM QUOTE SELECTION
  let availableQuotes = Object.values(LUCKY_CARD_QUOTES);

  // Anti-Repeat for Quotes
  if (previousQuote && availableQuotes.length > 1) {
    availableQuotes = availableQuotes.filter(quote => quote !== previousQuote);
  }

  const quoteBuffer = new Uint32Array(1);
  crypto.getRandomValues(quoteBuffer);
  const quoteIndex = quoteBuffer[0] % availableQuotes.length;

  // Clone the card and assign the independent quote
  return {
    ...selectedCard,
    quote: availableQuotes[quoteIndex]
  };
}

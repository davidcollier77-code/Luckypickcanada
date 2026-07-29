import { 
  LUCKY_CARD_IMAGES, 
  LUCKY_CARD_QUOTES, 
  LUCKY_CARD_RARITY_WEIGHTS 
} from './lucky-card-content';

const CARD_DEFINITIONS = [
  // Tier 3 - Flagship
  ['golden-maple-clover', 'The Golden Maple Clover', 'flagship'],

  // Tier 2 - Premium
  ['coast-to-coast-tale', 'Coast-to-Coast Tale', 'premium'],
  ['premium-card-1', 'Premium Card 1', 'premium'],
  ['premium-card-2', 'Premium Card 2', 'premium'],

  // Tier 1 - Standard
  ['number-seeker', 'The Number Seeker', 'standard'],
  ['cosmic-flow', 'Cosmic Flow', 'standard'],
  ['optimists-path', "The Optimist's Path", 'standard'],
  ['iron-horseshoe', 'The Iron Horseshoe', 'standard'],
  ['emerald-clover', 'The Emerald Four-Leaf', 'standard'],
  ['auroras-pot-of-gold', "The Aurora's Pot of Gold", 'standard'],
  ['guiding-star', 'The Guiding Star', 'standard'],
];

export const LUCKY_CARDS = CARD_DEFINITIONS.map(([id, title, tier]) => ({
  id,
  title,
  tier,
  image: LUCKY_CARD_IMAGES[id],
  quote: LUCKY_CARD_QUOTES[id],
  rarityWeight: LUCKY_CARD_RARITY_WEIGHTS[id],
}));

export function selectWeightedLuckyCard(cards = LUCKY_CARDS, random = Math.random) {
  const threshold = random() * cards.reduce((total, card) => total + card.rarityWeight, 0);
  let cumulativeWeight = 0;

  for (const card of cards) {
    cumulativeWeight += card.rarityWeight;
    if (threshold < cumulativeWeight) return card;
  }

  return cards[cards.length - 1];
}

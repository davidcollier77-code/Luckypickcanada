import { LUCKY_CARD_IMAGES, LUCKY_CARD_QUOTES, LUCKY_CARD_RARITY_WEIGHTS } from './lucky-card-content';

const CARD_DEFINITIONS = [
  ['golden-maple-clover', 'The Golden Maple Clover', true],
  ['number-seeker', 'The Number Seeker', false],
  ['coast-to-coast-tale', 'Coast-to-Coast Tale', false],
  ['cosmic-flow', 'Cosmic Flow', false],
  ['optimists-path', 'The Optimist’s Path', false],
  ['iron-horseshoe', 'The Iron Horseshoe', false],
  ['emerald-clover', 'The Emerald Four-Leaf', false],
  ['auroras-pot-of-gold', 'The Aurora’s Pot of Gold', true],
  ['guiding-star', 'The Guiding Star', true],
];

export const LUCKY_CARDS = CARD_DEFINITIONS.map(([id, title, isPremium]) => ({
  id,
  title,
  image: LUCKY_CARD_IMAGES[id],
  quote: LUCKY_CARD_QUOTES[id],
  rarityWeight: LUCKY_CARD_RARITY_WEIGHTS[id],
  isPremium,
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

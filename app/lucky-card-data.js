import { LUCKY_CARD_IMAGES, LUCKY_CARD_QUOTES, LUCKY_CARD_RARITY_WEIGHTS } from './lucky-card-content';

const CARD_DEFINITIONS = [
  ['number-seeker', 'The Number Seeker', false],
  ['iron-horseshoe', 'The Iron Horseshoe', false],
  ['emerald-clover', 'The Emerald Four-Leaf', false],
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

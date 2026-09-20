import { describe, expect, it } from 'vitest';
import { LUCKY_CARDS } from '../app/lucky-card-data';

describe('Lucky Card collection', () => {
  it('contains the complete 11-card Series 1 inventory with the expected tier counts', () => {
    expect(LUCKY_CARDS).toHaveLength(11);
    expect(LUCKY_CARDS.filter(card => card.tier === 'standard')).toHaveLength(6);
    expect(LUCKY_CARDS.filter(card => card.tier === 'premium')).toHaveLength(3);
    expect(LUCKY_CARDS.filter(card => card.tier === 'flagship')).toHaveLength(2);
  });

  it('keeps every card mapped to a unique, complete data record', () => {
    expect(new Set(LUCKY_CARDS.map(card => card.id)).size).toBe(11);
    expect(new Set(LUCKY_CARDS.map(card => card.title)).size).toBe(11);

    for (const card of LUCKY_CARDS) {
      expect(card.image).toMatch(/^\//);
      expect(card.quote).toBeTruthy();
      expect(card.rarityWeight).toBeGreaterThan(0);
    }
  });

  it('places Lucky Canadian Moose in the Premium tier with the uploaded artwork', () => {
    const moose = LUCKY_CARDS.find(card => card.id === 'lucky-canadian-moose');

    expect(moose).toMatchObject({
      title: 'Lucky Canadian Moose',
      tier: 'premium',
      isReveal: true,
      image: '/a_polished_high_detail_card_illustration_poster_i.png',
      rarityWeight: 10,
    });
  });
});

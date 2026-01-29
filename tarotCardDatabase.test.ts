import { describe, it, expect } from 'vitest';
import { flattenCardDatabase, TAROT_DECK_DATA } from './tarotCardDatabase';

describe('tarotCardDatabase', () => {
  it('should have 78 cards in total', () => {
    const flattened = flattenCardDatabase();
    expect(flattened).toHaveLength(78);
  });

  it('should have 22 major arcana cards', () => {
    expect(TAROT_DECK_DATA.majorArcana).toHaveLength(22);
  });

  it('should have 56 minor arcana cards', () => {
    const minorCount =
      TAROT_DECK_DATA.minorArcana.wands.length +
      TAROT_DECK_DATA.minorArcana.cups.length +
      TAROT_DECK_DATA.minorArcana.swords.length +
      TAROT_DECK_DATA.minorArcana.pentacles.length;
    expect(minorCount).toBe(56);
  });

  it('should ensure all cards have unique IDs', () => {
    const flattened = flattenCardDatabase();
    const ids = flattened.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should ensure all cards have at least one name', () => {
    const flattened = flattenCardDatabase();
    flattened.forEach(card => {
      expect(card.names).toBeInstanceOf(Array);
      expect(card.names.length).toBeGreaterThan(0);
    });
  });

  it('should verify minor arcana have suits and numbers', () => {
    const flattened = flattenCardDatabase();
    const minors = flattened.filter(c => c.arcana !== 'major');
    minors.forEach(card => {
      expect(card.suit).toBeDefined();
      expect(card.number).toBeDefined();
      expect(typeof card.number).toBe('number');
    });
  });
});

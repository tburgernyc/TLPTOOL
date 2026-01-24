import { describe, it, expect } from 'vitest';
import { extractCardPosition, findCardMatch, parseCardFromSpeech } from './cardMatcher';
import { flattenCardDatabase } from './tarotCardDatabase';

const db = flattenCardDatabase();

describe('cardMatcher', () => {
  describe('extractCardPosition', () => {
    it('should detect Upright position by default', () => {
      expect(extractCardPosition('The Fool')).toBe('Upright');
    });

    it('should detect Reversed when keyword is present', () => {
      expect(extractCardPosition('The Fool reversed')).toBe('Reversed');
      expect(extractCardPosition('upside down The Fool')).toBe('Reversed');
    });

    it('should prioritize the last mentioned orientation', () => {
      expect(extractCardPosition('reversed but then upright')).toBe('Upright');
      expect(extractCardPosition('upright but then reversed')).toBe('Reversed');
    });
  });

  describe('findCardMatch', () => {
    it('should match exact names', () => {
      const result = findCardMatch('The Fool', db);
      expect(result.card).toBeDefined();
      expect(result.card.names).toContain('The Fool');
      expect(result.confidence).toBe(100);
    });

    it('should match numeric terms (one -> ace)', () => {
      const result = findCardMatch('one of cups', db);
      expect(result.card).toBeDefined();
      expect(result.card.names).toContain('Ace of Cups');
    });

    it('should match phonetic approximations', () => {
      // "sord" -> "sword", "wands" -> "wands"
      const result = findCardMatch('ace of sords', db);
      expect(result.card).toBeDefined();
      expect(result.card.names[0]).toContain('Swords');
    });

    it('should match partial names if strong enough', () => {
      const result = findCardMatch('Magician', db);
      expect(result.card).toBeDefined();
      expect(result.card.names).toContain('The Magician');
    });

    it('should return low confidence for nonsense', () => {
      const result = findCardMatch('xyzxyz', db);
      expect(result.confidence).toBeLessThan(55);
    });
  });

  describe('parseCardFromSpeech', () => {
    it('should parse card and orientation from speech', () => {
      const result = parseCardFromSpeech('I see the ace of cups reversed here', db);
      expect(result.success).toBe(true);
      expect(result.card.name).toBe('Ace of Cups');
      expect(result.card.orientation).toBe('Reversed');
    });

    it('should handle noise words', () => {
      const result = parseCardFromSpeech('The card is the fool standing upright', db);
      expect(result.success).toBe(true);
      expect(result.card.name).toBe('The Fool');
      expect(result.card.orientation).toBe('Upright');
    });
  });
});

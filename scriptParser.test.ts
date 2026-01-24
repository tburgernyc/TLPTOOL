import { describe, it, expect } from 'vitest';
import { parseScriptToWords, findMatchingWordIndex } from './scriptParser';

describe('scriptParser', () => {
  describe('parseScriptToWords', () => {
    it('should tokenize a simple script', () => {
      const script = "Hello world, this is a test.";
      const tokens = parseScriptToWords(script);
      expect(tokens).toHaveLength(6);
      expect(tokens[0].text).toBe('hello');
      expect(tokens[1].text).toBe('world');
      expect(tokens[5].text).toBe('test');
    });

    it('should handle special characters and extra spaces', () => {
      const script = "  Hello   world!  ";
      const tokens = parseScriptToWords(script);
      expect(tokens).toHaveLength(2);
      expect(tokens[0].text).toBe('hello');
      expect(tokens[1].text).toBe('world');
    });

    it('should remove non-alphanumeric characters for matching text', () => {
      const script = "Word-one, word_two!";
      const tokens = parseScriptToWords(script);
      expect(tokens[0].text).toBe('wordone');
      expect(tokens[1].text).toBe('word_two'); // \w includes underscore
    });
  });

  describe('findMatchingWordIndex', () => {
    const script = "The quick brown fox jumps over the lazy dog";
    const tokens = parseScriptToWords(script);

    it('should find exact match at start', () => {
      const recognized = "The quick";
      const index = findMatchingWordIndex(recognized, tokens, 0);
      expect(index).toBe(1); // "quick" is at index 1
    });

    it('should find match further in the script', () => {
      const recognized = "jumps over";
      const index = findMatchingWordIndex(recognized, tokens, 0);
      expect(index).toBe(5); // "over" is at index 5
    });

    it('should use lookAhead', () => {
      // "dog" is at index 8. Default lookAhead is 30.
      const recognized = "lazy dog";
      const index = findMatchingWordIndex(recognized, tokens, 0);
      expect(index).toBe(8);
    });

    it('should handle fuzzy matches', () => {
      const recognized = "jumps ovuh"; // "ovuh" sounds like "over"
      const index = findMatchingWordIndex(recognized, tokens, 0);
      expect(index).toBe(5);
    });

    it('should return startIndex if no match found', () => {
        const recognized = "unicorn rainbow";
        const index = findMatchingWordIndex(recognized, tokens, 0);
        expect(index).toBe(0);
    });
  });
});

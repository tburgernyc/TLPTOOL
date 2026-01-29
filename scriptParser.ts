import { jaroWinkler } from './utils';

export interface WordToken {
  text: string;
  original: string;
  index: number;
}

export function parseScriptToWords(script: string): WordToken[] {
  // Clean up bracketed instructions like [PAUSE] or [EMPHASIS] for matching purposes
  // but keep them in the original for display if needed
  const tokens: WordToken[] = [];
  const rawWords = script.split(/\s+/);
  
  let currentIndex = 0;
  rawWords.forEach((word) => {
    if (!word.trim()) return;
    
    // Extract alphanumeric core for matching
    const cleanText = word.toLowerCase().replace(/[^\w]/g, '');
    
    if (cleanText) {
      tokens.push({
        text: cleanText,
        original: word,
        index: currentIndex++
      });
    }
  });
  
  return tokens;
}

/**
 * Fuzzy match recognized text against word array starting from a given index
 */
export function findMatchingWordIndex(
  recognizedText: string,
  wordArray: WordToken[],
  startIndex: number,
  lookAhead: number = 30
): number {
  const recognizedWords = recognizedText.toLowerCase().trim().split(/\s+/);
  if (recognizedWords.length === 0) return startIndex;

  // Check the last 3 recognized words for a multi-word anchor
  const lastThree = recognizedWords.slice(-3);
  
  let bestMatchIndex = startIndex;
  let highestConfidence = 0;

  const searchRange = Math.min(startIndex + lookAhead, wordArray.length);

  const lastSpokenWord = lastThree[lastThree.length - 1];
  const spokenPhrase = lastThree.length > 1
    ? (lastThree[lastThree.length - 2] + ' ' + lastThree[lastThree.length - 1])
    : null;

  for (let i = startIndex; i < searchRange; i++) {
    // Check single word match confidence
    const singleMatch = jaroWinkler(wordArray[i].text, lastSpokenWord);
    
    // Check bigram match confidence if possible
    let multiMatch = 0;
    if (i > 0 && spokenPhrase !== null) {
      const scriptPhrase = (wordArray[i-1].text + ' ' + wordArray[i].text);
      multiMatch = jaroWinkler(scriptPhrase, spokenPhrase);
    }

    const currentConfidence = Math.max(singleMatch, multiMatch);

    // If we have a very strong match (0.85+), prioritize it
    if (currentConfidence > highestConfidence && currentConfidence > 0.85) {
      highestConfidence = currentConfidence;
      bestMatchIndex = i;
    }
  }

  // If we didn't find a strong match in the lookahead, return current
  return highestConfidence > 0.85 ? bestMatchIndex : startIndex;
}

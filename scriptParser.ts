export interface WordToken {
  text: string;
  original: string;
  index: number;
}

/**
 * Jaro-Winkler similarity algorithm for fuzzy string matching.
 * Returns a value between 0 and 1.
 */
function jaroWinkler(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0;
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  if (s1 === s2) return 1;

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let m = 0;
  for (let i = 0; i < s1.length; i++) {
    const low = Math.max(0, i - range);
    const high = Math.min(i + range + 1, s2.length);
    for (let j = low; j < high; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let k = 0;
  let t = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }

  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  const p = 0.1; // Scaling factor
  let l = 0; // Prefix length
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) l++;
    else break;
  }

  return jaro + l * p * (1 - jaro);
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
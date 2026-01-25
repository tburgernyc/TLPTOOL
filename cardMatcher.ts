import { jaroWinkler } from './utils';

export const DIGIT_TO_NAME_MAP: { [key: string]: string } = {
  '1': 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
  '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
  '0': 'Zero'
};

const NUMERIC_MAP: { [key: string]: string } = {
  ...Object.entries(DIGIT_TO_NAME_MAP).reduce((acc, [k, v]) => ({ ...acc, [k]: v.toLowerCase() }), {} as Record<string, string>),
  'one': 'ace',
  'too': 'two', 'to': 'two',
  'free': 'three',
  'for': 'four',
  'ate': 'eight'
};

const NUMERIC_KEYS = Object.keys(NUMERIC_MAP).sort((a, b) => b.length - a.length);
const NUMERIC_REGEX = new RegExp(`\\b(${NUMERIC_KEYS.join('|')})\\b`, 'g');

/**
 * Maps numeric words and digits to card name terminology.
 */
function normalizeNumericTerms(text: string): string {
  return text.toLowerCase().replace(NUMERIC_REGEX, (match) => {
    return NUMERIC_MAP[match];
  });
}

/**
 * Normalizes text for phonetic/structural comparison.
 */
export function phoneticNormalize(text: string): string {
  let normalized = text.toLowerCase().trim()
    .replace(/[^a-z0-9]/g, '')
    .replace(/ph/g, 'f')
    .replace(/ce/g, 'se')
    .replace(/ci/g, 'si')
    .replace(/cy/g, 'si')
    .replace(/kn/g, 'n')
    .replace(/wr/g, 'r')
    .replace(/gh/g, '')
    // Handle specific tarot speech issues
    .replace(/pentacles/g, 'pent')
    .replace(/wands/g, 'wand')
    .replace(/cups/g, 'cup')
    .replace(/swords/g, 'sword')
    .replace(/([a-z])\1+/g, '$1');

  if (normalized.length > 1) {
    const first = normalized[0];
    const rest = normalized.slice(1).replace(/[aeiouy]/g, '');
    return first + rest;
  }
  return normalized;
}

export const extractCardPosition = (spokenText: string): 'Upright' | 'Reversed' => {
  const text = spokenText.toLowerCase();
  const reversedKeywords = ['reversed', 'reverse', 'inverted', 'upside down', 'backwards', 'flipped'];
  const uprightKeywords = ['upright', 'up right', 'standing', 'normal', 'standard', 'stable'];

  let lastReversedIdx = -1;
  reversedKeywords.forEach(kw => {
    const idx = text.lastIndexOf(kw);
    if (idx > lastReversedIdx) lastReversedIdx = idx;
  });

  let lastUprightIdx = -1;
  uprightKeywords.forEach(kw => {
    const idx = text.lastIndexOf(kw);
    if (idx > lastUprightIdx) lastUprightIdx = idx;
  });

  if (lastReversedIdx > lastUprightIdx) return 'Reversed';
  return 'Upright';
};

/**
 * Matches spoken text to a card using a weighted scoring system.
 */
export const findCardMatch = (spokenText: string, flatDatabase: any[]) => {
  const normalizedText = normalizeNumericTerms(spokenText);
  const cleanText = normalizedText.toLowerCase().trim();
  const phoneticText = phoneticNormalize(cleanText);
  
  if (!cleanText) return { card: null, confidence: 0, tier: 'None' };

  let bestMatch = { card: null, confidence: 0, tier: 'None' };
  const tokens = cleanText.split(/\s+/);

  for (const card of flatDatabase) {
    let currentScore = 0;
    let currentTier = 'None';

    // 1. Exact Match on any name/alias
    if (card.names.some((name: string) => name.toLowerCase() === cleanText)) {
      currentScore = 100;
      currentTier = 'Exact';
    } 
    
    // 2. Component-based Scoring for Minor Arcana
    if (currentScore < 100 && card.suit) {
      const values = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'page', 'knight', 'queen', 'king', 'knave', 'prince', 'princess'];
      const cardValue = values[card.number - 1];
      
      let suitScore = 0;
      for (const token of tokens) {
        // Expand matching for synonyms
        const isWand = card.suit === 'wands' && ['wand', 'rods', 'rod', 'staves', 'staff', 'baton'].includes(token);
        const isPentacle = card.suit === 'pentacles' && ['pentacle', 'coins', 'coin', 'disks', 'disk', 'stones', 'stone', 'diamonds', 'diamond'].includes(token);
        const isCup = card.suit === 'cups' && ['cup', 'chalice', 'vessel', 'hearts', 'heart'].includes(token);
        const isSword = card.suit === 'swords' && ['sword', 'blade', 'spades', 'spade'].includes(token);

        if (token === card.suit || isWand || isPentacle || isCup || isSword) {
          suitScore = 1;
          break;
        }
        suitScore = Math.max(suitScore, jaroWinkler(token, card.suit));
      }

      let valueScore = 0;
      for (const token of tokens) {
        // Check standard value
        if (token === cardValue) {
          valueScore = 1;
          break;
        }
        // Handle common variations (Page/Knave, Knight/Prince)
        const isPage = cardValue === 'page' && ['knave', 'princess'].includes(token);
        const isKnight = cardValue === 'knight' && ['prince'].includes(token);
        if (isPage || isKnight) {
          valueScore = 0.95;
          break;
        }
        valueScore = Math.max(valueScore, jaroWinkler(token, cardValue));
      }

      if (suitScore > 0.65 && valueScore > 0.65) {
        const componentScore = (suitScore * 60) + (valueScore * 40);
        if (componentScore > currentScore) {
          currentScore = componentScore;
          currentTier = 'Component';
        }
      }
    }

    // 3. Phonetic Match
    if (currentScore < 85) {
      const pNames = card.phoneticNames || card.names.map((n: string) => phoneticNormalize(n));
      if (pNames.includes(phoneticText)) {
        currentScore = 88;
        currentTier = 'Phonetic';
      }
    }

    // 4. Global Fuzzy Match across all aliases
    if (currentScore < 95) {
      // Use pre-normalized names for performance
      const targetNames = card.normalizedNames || card.names;
      for (const name of targetNames) {
        // cleanText is already normalized (lower + trim)
        // name is either from normalizedNames (lower) or raw names (mixed case) if DB not updated
        // For safety/fallback if normalizedNames missing, we could lowercase on fly, but assuming DB update.
        // If DB update failed, jaroWinkler might behave worse due to case mismatch.
        // But we updated DB.
        const fuzzyScore = jaroWinkler(cleanText, name) * 100;
        if (fuzzyScore > currentScore && fuzzyScore >= 55) {
          currentScore = fuzzyScore;
          currentTier = 'Fuzzy';
        }
      }
    }

    if (currentScore > bestMatch.confidence) {
      bestMatch = { card, confidence: Math.round(currentScore), tier: currentTier };
    }

    if (currentScore === 100) break;
  }

  return bestMatch;
};

const NOISE_WORDS = ['reversed', 'reverse', 'upright', 'up right', 'inverted', 'invert', 'of', 'the', 'upside down', 'backwards', 'standing', 'normal', 'standard', 'stable', 'flipped', 'card', 'is', 'sitting', 'shows', 'here'];
const NOISE_WORDS_SORTED = [...NOISE_WORDS].sort((a, b) => b.length - a.length);
const NOISE_REGEX = new RegExp(`\\b(${NOISE_WORDS_SORTED.join('|')})\\b`, 'gi');

export const parseCardFromSpeech = (spokenText: string, flatDatabase: any[]) => {
  const position = extractCardPosition(spokenText);
  
  // Strip position markers and common noise words to isolate the core card name
  let cleanedText = spokenText.toLowerCase().replace(NOISE_REGEX, ' ');
  
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
  const match = findCardMatch(cleanedText, flatDatabase);
  
  // Detection threshold calibrated for TLP vocal patterns
  if (match.card && match.confidence >= 55) {
    let confidenceCategory: 'High' | 'Medium' | 'Low' = 'Low';
    if (match.confidence >= 88) confidenceCategory = 'High';
    else if (match.confidence >= 70) confidenceCategory = 'Medium';

    return {
      success: true,
      card: {
        name: match.card.names[0],
        orientation: position,
      },
      confidence: match.confidence,
      confidenceCategory,
      tier: match.tier,
      rawSpoken: spokenText
    };
  }
  return { 
    success: false, 
    rawSpoken: spokenText, 
    confidence: match.confidence, 
    tier: match.tier || 'None' 
  };
};

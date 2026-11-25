
import { performance } from 'perf_hooks';

// ==========================================
// Benchmark Harness for CardMatcher Optimization
// ==========================================

// --- OLD IMPLEMENTATION (Baseline) ---
function normalizeNumericTerms_Old(text: string): string {
  const map: { [key: string]: string } = {
    '1': 'ace', 'one': 'ace',
    '2': 'two', 'too': 'two', 'to': 'two',
    '3': 'three', 'free': 'three',
    '4': 'four', 'for': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight', 'ate': 'eight',
    '9': 'nine',
    '10': 'ten',
    '0': 'zero'
  };

  let processed = text.toLowerCase();
  Object.keys(map).forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    processed = processed.replace(regex, map[key]);
  });
  return processed;
}

function removeNoiseWords_Old(spokenText: string): string {
  const noiseWords = ['reversed', 'reverse', 'upright', 'up right', 'inverted', 'invert', 'of', 'the', 'upside down', 'backwards', 'standing', 'normal', 'standard', 'stable', 'flipped', 'card', 'is', 'sitting', 'shows', 'here'];

  let cleanedText = spokenText.toLowerCase();
  noiseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, ' ');
  });
  return cleanedText;
}

// --- NEW IMPLEMENTATION (Optimized) ---
// Note: These should match the implementation in src/cardMatcher.ts

const NUMERIC_MAP: { [key: string]: string } = {
  '1': 'ace', 'one': 'ace',
  '2': 'two', 'too': 'two', 'to': 'two',
  '3': 'three', 'free': 'three',
  '4': 'four', 'for': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight', 'ate': 'eight',
  '9': 'nine',
  '10': 'ten',
  '0': 'zero'
};
const NUMERIC_KEYS = Object.keys(NUMERIC_MAP).sort((a, b) => b.length - a.length);
const NUMERIC_REGEX = new RegExp(`\\b(${NUMERIC_KEYS.join('|')})\\b`, 'g');

function normalizeNumericTerms_New(text: string): string {
  return text.toLowerCase().replace(NUMERIC_REGEX, (match) => {
      return NUMERIC_MAP[match];
  });
}

const NOISE_WORDS = ['reversed', 'reverse', 'upright', 'up right', 'inverted', 'invert', 'of', 'the', 'upside down', 'backwards', 'standing', 'normal', 'standard', 'stable', 'flipped', 'card', 'is', 'sitting', 'shows', 'here'];
const NOISE_WORDS_SORTED = [...NOISE_WORDS].sort((a, b) => b.length - a.length);
const NOISE_REGEX = new RegExp(`\\b(${NOISE_WORDS_SORTED.join('|')})\\b`, 'gi');

function removeNoiseWords_New(spokenText: string): string {
  let cleanedText = spokenText.toLowerCase();
  return cleanedText.replace(NOISE_REGEX, ' ');
}


// ==========================================
// Verification & Benchmark
// ==========================================

const TEST_INPUTS = [
  "Ace of wands reversed",
  "One of cups",
  "The 2 of pentacles is here",
  "Three swords up right",
  "Four for free",
  "Eight ate the 8",
  "This is a test string with no matches",
  "upside down backwards inverted",
  "random text 1 2 3 4 5 6 7 8 9 10 0",
  "I ate the eight apples",
  "",
  "   ",
];

function verify() {
  console.log("Verifying correctness...");
  let errors = 0;
  for (const input of TEST_INPUTS) {
    const oldNum = normalizeNumericTerms_Old(input);
    const newNum = normalizeNumericTerms_New(input);
    if (oldNum !== newNum) {
      console.error(`[Numeric] Mismatch for "${input}":\nOld: "${oldNum}"\nNew: "${newNum}"`);
      errors++;
    }

    const oldNoise = removeNoiseWords_Old(input);
    const newNoise = removeNoiseWords_New(input);
    if (oldNoise !== newNoise) {
       console.error(`[Noise] Mismatch for "${input}":\nOld: "${oldNoise}"\nNew: "${newNoise}"`);
       errors++;
    }
  }

  if (errors === 0) {
    console.log("✅ All outputs match exactly.");
  } else {
    console.error(`❌ Found ${errors} mismatches.`);
    process.exit(1);
  }
}

function runBenchmark(label: string, fn: (s: string) => string, iterations: number) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    for (const input of TEST_INPUTS) {
      fn(input);
    }
  }
  const end = performance.now();
  const totalTime = end - start;
  console.log(`${label}: ${(totalTime).toFixed(2)}ms`);
  return totalTime;
}

function benchmark() {
  const ITERATIONS = 10000;
  console.log(`\nStarting Benchmark (${ITERATIONS} iterations over ${TEST_INPUTS.length} inputs)...`);

  console.log("\n--- Numeric Normalization ---");
  const t1 = runBenchmark("Old Loop+Regex", normalizeNumericTerms_Old, ITERATIONS);
  const t2 = runBenchmark("New Pre-compiled", normalizeNumericTerms_New, ITERATIONS);
  console.log(`Improvement: ${((t1 - t2) / t1 * 100).toFixed(2)}% faster`);

  console.log("\n--- Noise Removal ---");
  const t3 = runBenchmark("Old Loop+Regex", removeNoiseWords_Old, ITERATIONS);
  const t4 = runBenchmark("New Pre-compiled", removeNoiseWords_New, ITERATIONS);
  console.log(`Improvement: ${((t3 - t4) / t3 * 100).toFixed(2)}% faster`);
}

verify();
benchmark();


import { performance } from 'perf_hooks';

const noiseWords = ['reversed', 'reverse', 'upright', 'up right', 'inverted', 'invert', 'of', 'the', 'upside down', 'backwards', 'standing', 'normal', 'standard', 'stable', 'flipped', 'card', 'is', 'sitting', 'shows', 'here'];

// Original implementation logic
function cleanTextOriginal(spokenText: string): string {
  let cleanedText = spokenText.toLowerCase();
  noiseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleanedText = cleanedText.replace(regex, ' ');
  });
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

// Optimized implementation logic
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const noiseRegex = new RegExp(`\\b(?:${noiseWords.map(escapeRegExp).join('|')})\\b`, 'gi');

function cleanTextOptimized(spokenText: string): string {
  let cleanedText = spokenText.toLowerCase();
  cleanedText = cleanedText.replace(noiseRegex, ' ');
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

// Verification and Benchmark
const testCases = [
  "The card is the ten of cups reversed",
  "10 of cups up right",
  "upside down the 3 of swords",
  "the wheel of fortune",
  "10 of cups, reversed.",
  "the the card is is reversed reversed ten of cups",
  "Ace of Wands",
  "The Fool",
  "King of Pentacles inverted",
  "normal standard stable standing 5 of coins",
  "random text without noise words",
  "up right here is the card"
];

console.log('--- Verifying Correctness ---');
let allCorrect = true;
testCases.forEach(text => {
  const original = cleanTextOriginal(text);
  const optimized = cleanTextOptimized(text);
  if (original !== optimized) {
    console.error(`Mismatch for input: "${text}"`);
    console.error(`  Original:  "${original}"`);
    console.error(`  Optimized: "${optimized}"`);
    allCorrect = false;
  }
});

if (allCorrect) {
  console.log('✅ All test cases passed correctness check.\n');
} else {
  console.error('❌ Correctness check failed. Aborting benchmark.');
  process.exit(1);
}

console.log('--- Benchmarking ---');
const iterations = 100000;

const startOriginal = performance.now();
for (let i = 0; i < iterations; i++) {
  testCases.forEach(text => cleanTextOriginal(text));
}
const endOriginal = performance.now();
const timeOriginal = endOriginal - startOriginal;

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  testCases.forEach(text => cleanTextOptimized(text));
}
const endOptimized = performance.now();
const timeOptimized = endOptimized - startOptimized;

console.log(`Iterations: ${iterations} x ${testCases.length} inputs`);
console.log(`Original Time:  ${timeOriginal.toFixed(2)} ms`);
console.log(`Optimized Time: ${timeOptimized.toFixed(2)} ms`);
console.log(`Speedup:        ${(timeOriginal / timeOptimized).toFixed(2)}x`);

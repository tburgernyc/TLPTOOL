
import { CANONICAL_TAROT_LIST } from './tarotCardDatabase';
import { Spread, TarotCard } from './types';

const TAROT_DECK = CANONICAL_TAROT_LIST;

const pullRandomCard = (): TarotCard => ({
  name: TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)],
  orientation: Math.random() > 0.25 ? 'Upright' : 'Reversed',
  imageUrl: ''
});

const generateRandomSpread = (): Spread => ({
  situation: Array(3).fill(null).map(pullRandomCard),
  feelings: Array(3).fill(null).map(pullRandomCard),
  message: Array(3).fill(null).map(pullRandomCard),
  outcome: Array(3).fill(null).map(pullRandomCard),
  bottom: pullRandomCard()
});

const ITERATIONS = 100000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Scenario 1: Eager Initialization (Current Code)
// This simulates what happens over N renders: the function is executed N times.
const startEager = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  generateRandomSpread();
}
const endEager = performance.now();
const timeEager = endEager - startEager;

console.log(`Eager Initialization (Current): ${timeEager.toFixed(2)}ms`);

// Scenario 2: Lazy Initialization (Optimized Code)
// This simulates what happens over N renders: the function is executed ONLY ONCE (on first render).
const startLazy = performance.now();
// First render calls it
generateRandomSpread();
// Subsequent renders do NOT call it.
// So for the remaining ITERATIONS - 1, we do nothing related to this initialization.
const endLazy = performance.now();
const timeLazy = endLazy - startLazy;

console.log(`Lazy Initialization (Optimized): ${timeLazy.toFixed(2)}ms`);

console.log(`\nImprovement: ${(timeEager / timeLazy).toFixed(2)}x faster over ${ITERATIONS} renders`);

import { findCardMatch } from './cardMatcher';
import { flattenCardDatabase } from './tarotCardDatabase';

const db = flattenCardDatabase();

const queries = [
  "The Fool", // Exact match (should be fast)
  "The Fuul", // Phonetic match
  "Ace of Wands", // Exact
  "Ace of Wonds", // Phonetic
  "Knight of Cups", // Exact
  "Night of Cups", // Phonetic
  "Random Gibberish That Matches Nothing", // Worst case: iterates all cards
  "Another Non Matching String",
];

const ITERATIONS = 1000;

console.log(`Running benchmark with ${ITERATIONS} iterations over ${queries.length} queries...`);

const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  for (const query of queries) {
    findCardMatch(query, db);
  }
}

const end = performance.now();
console.log(`Total time: ${(end - start).toFixed(2)}ms`);
console.log(`Average time per query: ${((end - start) / (ITERATIONS * queries.length)).toFixed(4)}ms`);

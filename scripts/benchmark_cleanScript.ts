import { cleanScript } from '../api/gemini';
import { performance } from 'perf_hooks';

// Original implementation for baseline comparison
function cleanScriptOld(text: string): string {
  return text
    .replace(/^(Here's your|Sure, here is|This script|I have generated|Certainly|Okay|Great|PART \d+:?|Section \d+:?).*$/gim, '')
    .replace(/\[(Stage direction|Pause slightly|Take a breath|Background music).*?\]/gi, '[PAUSE]')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(\n{3,})/g, '\n\n')
    .trim();
}

function generateTestScript(sizeKB: number): string {
  const parts = [
    "Here's your reading for today.",
    "Sure, here is the script.",
    "[Stage direction: Look at the camera]",
    "[Pause slightly]",
    "**The Fool** represents new beginnings.",
    "The **Magician** manifests will.",
    "Section 1: The Intro",
  ];
  // 1KB of filler
  const filler = "This is just some normal text that should not match anything. It goes on and on to simulate a real script which is mostly dialogue or reading content, not just formatting instructions. ".repeat(10);

  let result = "";
  while (result.length < sizeKB * 1024) {
    if (Math.random() < 0.05) { // 5% density of special tags
        const part = parts[Math.floor(Math.random() * parts.length)];
        result += part + "\n\n";
    } else {
        result += filler + "\n";
    }
  }
  return result;
}

const sizes = [10, 100, 1000, 2000]; // KB

async function run() {
    console.log("Running benchmarks with sparse matches...");

    for (const size of sizes) {
      const input = generateTestScript(size);
      console.log(`\nTesting size: ${size}KB`);

      // Warmup
      cleanScriptOld(input.substring(0, 1000));
      cleanScript(input.substring(0, 1000));

      // Measure Old
      const startOld = performance.now();
      const iter = 10;
      for (let i = 0; i < iter; i++) cleanScriptOld(input);
      const endOld = performance.now();
      const timeOld = (endOld - startOld) / iter;

      // Measure New
      const startNew = performance.now();
      for (let i = 0; i < iter; i++) cleanScript(input);
      const endNew = performance.now();
      const timeNew = (endNew - startNew) / iter;

      console.log(`Old: ${timeOld.toFixed(2)}ms`);
      console.log(`New: ${timeNew.toFixed(2)}ms`);
      console.log(`Ratio: ${(timeOld / timeNew).toFixed(2)}x`);

      // Verify correctness
      if (cleanScriptOld(input) !== cleanScript(input)) {
        console.error("MISMATCH DETECTED!");
        process.exit(1);
      } else {
        console.log("Output matches ✓");
      }
    }
}

run().catch(console.error);

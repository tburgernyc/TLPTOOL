/**
 * Jaro-Winkler similarity algorithm for better phonetic/string matching.
 * Returns a value between 0 and 1.
 */
export function jaroWinkler(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0;
  // Note: Caller is responsible for normalization if needed, but we handle basic case here just in case,
  // though optimal usage assumes pre-normalized inputs.
  // Ideally, inputs should be passed in normalized to avoid redundant ops in loops.

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

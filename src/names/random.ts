/**
 * Randomness with a seed, so a link gives the same names in every browser, today and next year.
 * Math.random is never used: it can't be seeded and differs from one browser to the next.
 *
 * The generator is mulberry32 and the hash is FNV-1a, both in 32-bit whole-number arithmetic,
 * which every JavaScript engine does identically. Changing either changes every shared link, so
 * they are frozen for version 1 of the link.
 */

export type Rng = () => number;

/** A generator of numbers from 0 up to (not including) 1, from a 32-bit seed. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 32-bit number from any mix of text and numbers. The same parts always give the same number. */
export function hashSeed(parts: readonly (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    // A separator, so ['ab', 'c'] and ['a', 'bc'] differ.
    h ^= 0xff;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A generator of its own for one purpose: a column and how often it has been re-rolled, say. */
export const stream = (...parts: (string | number)[]): Rng => mulberry32(hashSeed(parts));

/** A whole number from min to max, both included. */
export function between(rng: Rng, min: number, max: number): number {
  return max <= min ? min : min + Math.floor(rng() * (max - min + 1));
}

/**
 * The index of one of the weights, picked in proportion to them. -1 when no weight is above
 * nothing, which is how a dead end shows itself. Always draws exactly one number.
 */
export function pickWeighted(rng: Rng, weights: readonly number[]): number {
  let total = 0;
  for (const w of weights) if (w > 0) total += w;
  const roll = rng() * total;
  if (total <= 0) return -1;
  let sum = 0;
  let last = -1;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i]!;
    if (!(w > 0)) continue;
    sum += w;
    last = i;
    if (roll < sum) return i;
  }
  return last;
}

/** True for `share` out of 100 draws. */
export const chance = (rng: Rng, share: number): boolean => rng() * 100 < share;

export const MAX_SEED = 0xffffffff;

/** A seed from anywhere: a whole number from 0 to 4,294,967,295. */
export function cleanSeed(value: unknown, fallback = 1): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && /^\d{1,10}$/.test(value.trim()) ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= MAX_SEED ? Math.floor(n) : fallback;
}

/**
 * A new seed for the next batch: four digits, easy to read out and type back in. `entropy` is
 * any number from 0 up to 1; the page takes it from the browser's own random numbers.
 */
export const freshSeed = (entropy: number): number => 1000 + Math.floor(Math.min(0.999999, Math.max(0, entropy)) * 9000);

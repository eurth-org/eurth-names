import { describe, expect, it } from 'vitest';
import { between, chance, cleanSeed, freshSeed, hashSeed, mulberry32, pickWeighted, stream } from '../src/names/random';

describe('seeded randomness', () => {
  it('gives the same numbers for the same seed, in every engine', () => {
    // Frozen: if these change, every shared link changes with them.
    const rng = mulberry32(4471);
    expect([rng(), rng(), rng()].map((n) => Math.floor(n * 1e9))).toEqual([517535976, 495749054, 930178351]);
    expect(hashSeed(['names', 1, 'place', 4471, 0])).toBe(27604628);
  });

  it('gives different streams for different parts', () => {
    expect(hashSeed(['ab', 'c'])).not.toBe(hashSeed(['a', 'bc']));
    expect(stream('place', 1)()).not.toBe(stream('given', 1)());
    expect(stream('place', 1)()).toBe(stream('place', 1)());
  });

  it('stays between 0 and 1', () => {
    const rng = mulberry32(0);
    for (let i = 0; i < 10000; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('picks whole numbers across the whole range', () => {
    const rng = mulberry32(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(between(rng, 2, 5));
    expect([...seen].sort()).toEqual([2, 3, 4, 5]);
    expect(between(rng, 3, 1)).toBe(3);
  });

  it('picks in proportion to the weights', () => {
    const rng = mulberry32(99);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 20000; i++) counts[pickWeighted(rng, [1, 0, 3, 6])]!++;
    expect(counts[1]).toBe(0);
    expect(counts[0]! / 20000).toBeCloseTo(0.1, 1);
    expect(counts[2]! / 20000).toBeCloseTo(0.3, 1);
    expect(counts[3]! / 20000).toBeCloseTo(0.6, 1);
  });

  it('answers -1 when nothing can be picked, and still draws once', () => {
    const a = mulberry32(5);
    const b = mulberry32(5);
    expect(pickWeighted(a, [0, 0])).toBe(-1);
    expect(pickWeighted(a, [])).toBe(-1);
    expect(pickWeighted(a, [NaN, -2])).toBe(-1);
    b();
    b();
    b();
    expect(a()).toBe(b());
  });

  it('turns a share into a chance', () => {
    const rng = mulberry32(3);
    expect(chance(rng, 0)).toBe(false);
    expect(chance(rng, 100)).toBe(true);
  });

  it('cleans seeds', () => {
    expect(cleanSeed(4471)).toBe(4471);
    expect(cleanSeed('4471')).toBe(4471);
    expect(cleanSeed(4294967295)).toBe(4294967295);
    for (const bad of [-1, 4294967296, 1.5e20, NaN, '12a', '', null, {}, '99999999999']) expect(cleanSeed(bad, 9)).toBe(9);
    expect(cleanSeed(12.7)).toBe(12);
  });

  it('makes four-digit seeds', () => {
    expect(freshSeed(0)).toBe(1000);
    expect(freshSeed(0.99999999)).toBe(9999);
    expect(freshSeed(5)).toBe(9999);
    expect(freshSeed(-1)).toBe(1000);
  });
});

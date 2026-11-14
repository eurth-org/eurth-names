/**
 * Building one word from a language's sounds: syllable by syllable from the shapes, sound by
 * sound from the weights, with banned clusters kept out as the word grows.
 *
 * A sound that would complete a banned cluster is never offered. That is not the whole promise,
 * though: generate.ts checks every finished name once more, endings and all, before it is
 * handed out.
 */
import { fold, type Ending, type Language, type Shape, type Sound } from './model';
import { between, pickWeighted, type Rng } from './random';

/** How much a leaning multiplies a sound's weight: never, seldom, as usual, often. */
export const LEANING_FACTOR = [0, 0.25, 1, 3] as const;

/** A language made ready to draw from: only what can be used, and the checks worked out once. */
export interface Prepared {
  language: Language;
  consonants: Sound[];
  vowels: Sound[];
  shapes: Shape[];
  banned: string[];
  longestBan: number;
  /** Endings that hold a banned cluster themselves are left out. */
  placeEndings: Ending[];
  feminine: Ending[];
  masculine: Ending[];
  either: Ending[];
}

const cache = new WeakMap<Language, Prepared>();

/** Whether a piece of text holds a banned cluster. */
export function holdsBan(text: string, banned: readonly string[]): boolean {
  const folded = fold(text);
  for (const ban of banned) if (ban !== '' && folded.includes(ban)) return true;
  return false;
}

/** Whether a shape can be filled at all from these sounds. */
export function fillable(shape: Shape, consonants: number, vowels: number): boolean {
  if (shape.pattern === '') return false;
  for (let i = 0; i < shape.pattern.length; i++) {
    const have = shape.pattern[i] === 'C' ? consonants : vowels;
    if (have === 0) return false;
    // Two of a kind side by side are never the same sound twice, so they need two to pick from.
    if (i > 0 && shape.pattern[i - 1] === shape.pattern[i] && have < 2) return false;
  }
  return true;
}

export function prepare(language: Language): Prepared {
  const known = cache.get(language);
  if (known) return known;
  const banned = language.banned.filter((b) => b !== '');
  const consonants = language.consonants.filter((s) => s.weight > 0 && !holdsBan(s.spelling, banned));
  const vowels = language.vowels.filter((s) => s.weight > 0 && !holdsBan(s.spelling, banned));
  const usable = (endings: readonly Ending[]) => endings.filter((e) => e.weight > 0 && !holdsBan(e.text, banned));
  const prepared: Prepared = {
    language,
    consonants,
    vowels,
    shapes: language.shapes.filter((s) => s.weight > 0 && fillable(s, consonants.length, vowels.length)),
    banned,
    longestBan: banned.reduce((n, b) => Math.max(n, b.length), 0),
    placeEndings: usable(language.places.endings),
    feminine: usable(language.given.feminine),
    masculine: usable(language.given.masculine),
    either: usable(language.given.either),
  };
  cache.set(language, prepared);
  return prepared;
}

export interface Stem {
  /** Lower case, as built. */
  text: string;
  /** The sounds it was built from, in order. */
  sounds: string[];
}

/**
 * One stem of `min` to `max` syllables, or null at a dead end (the caller tries again, a
 * bounded number of times).
 *
 * `final` says whether the stem's last sound ends the word. When an ending follows, it doesn't,
 * and the sounds' end leanings are left out of it.
 */
export function buildStem(p: Prepared, rng: Rng, min: number, max: number, final: boolean): Stem | null {
  if (p.shapes.length === 0) return null;
  const syllables = between(rng, min, max);
  const shapeWeights = p.shapes.map((s) => s.weight);
  let text = '';
  const sounds: string[] = [];
  for (let i = 0; i < syllables; i++) {
    const shape = p.shapes[pickWeighted(rng, shapeWeights)];
    if (!shape) return null;
    let previous = '';
    for (let j = 0; j < shape.pattern.length; j++) {
      const slot = shape.pattern[j];
      const pool = slot === 'C' ? p.consonants : p.vowels;
      const first = i === 0 && j === 0;
      const last = final && i === syllables - 1 && j === shape.pattern.length - 1;
      const sameKind = j > 0 && shape.pattern[j - 1] === slot;
      const tail = p.longestBan > 1 ? text.slice(-(p.longestBan - 1)) : '';
      const weights = pool.map((s) => {
        if (sameKind && s.spelling === previous) return 0;
        const w = s.weight * (first ? LEANING_FACTOR[s.start] : 1) * (last ? LEANING_FACTOR[s.end] : 1);
        if (w <= 0) return 0;
        return holdsBan(tail + s.spelling, p.banned) ? 0 : w;
      });
      const sound = pool[pickWeighted(rng, weights)];
      if (!sound) return null;
      text += sound.spelling;
      sounds.push(sound.spelling);
      previous = sound.spelling;
    }
  }
  return { text, sounds };
}

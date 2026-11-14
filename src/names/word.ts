/**
 * Building one word from a language's sounds: syllable by syllable from the shapes, sound by
 * sound from the weights, with banned clusters kept out as the word grows.
 *
 * A sound that would complete a banned cluster is never offered. That is not the whole promise,
 * though: generate.ts checks every finished name once more, endings and all, before it is
 * handed out.
 */
import { fold, type Affix, type Ending, type Language, type Shape, type Sound, type SurnamePattern } from './model';
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
  /**
   * The surname patterns in order (patronymic, place, trade), each with the affixes that can
   * be used and its weight: nothing when it is off, or when every affix it has is banned.
   */
  surnames: { weight: number; affixes: Affix[] }[];
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
    surnames: [language.surnames.patronymic, language.surnames.place, language.surnames.trade].map((pattern: SurnamePattern) => {
      const affixes = pattern.affixes.filter((a) => a.weight > 0 && !holdsBan(a.text, banned));
      return { weight: pattern.on && (affixes.length > 0 || pattern.affixes.length === 0) ? pattern.weight : 0, affixes };
    }),
  };
  cache.set(language, prepared);
  return prepared;
}

export interface Stem {
  /** Lower case, as built. */
  text: string;
  /** The sounds it was built from, in order. */
  sounds: string[];
  /** What each sound is: "CVCV". */
  slots: string;
}

/** What comes after a stem: the end of the word, or an ending that starts with a vowel or a consonant. */
export type After = 'end' | 'vowel' | 'consonant';

/** The shapes of a stem's syllables. Unless vowels may meet, no vowel-first syllable follows a vowel-last one. */
function pickShapes(p: Prepared, rng: Rng, syllables: number): Shape[] | null {
  const weights = p.shapes.map((s) => s.weight);
  const afterVowel = p.language.vowelsMeet ? weights : p.shapes.map((s) => (s.pattern.startsWith('V') ? 0 : s.weight));
  const noChoice = afterVowel.every((w) => w <= 0);
  const shapes: Shape[] = [];
  for (let i = 0; i < syllables; i++) {
    const previous = shapes[i - 1];
    const open = previous !== undefined && previous.pattern.endsWith('V');
    const shape = p.shapes[pickWeighted(rng, open && !noChoice ? afterVowel : weights)];
    if (!shape) return null;
    shapes.push(shape);
  }
  return shapes;
}

/**
 * One stem of `min` to `max` syllables, or null at a dead end (the caller tries again, a
 * bounded number of times).
 *
 * `after` says what follows the stem. At the end of the word the last sound's end leaning
 * counts; before an ending it doesn't, but a sound that is never followed by its own kind
 * still isn't.
 */
export function buildStem(p: Prepared, rng: Rng, min: number, max: number, after: After): Stem | null {
  if (p.shapes.length === 0) return null;
  const shapes = pickShapes(p, rng, between(rng, min, max));
  if (!shapes) return null;
  const slots = shapes.map((s) => s.pattern).join('');
  // Where each syllable begins, so the same sound isn't drawn twice running inside one.
  const starts = new Set<number>();
  let at = 0;
  for (const shape of shapes) {
    starts.add(at);
    at += shape.pattern.length;
  }
  let text = '';
  const sounds: string[] = [];
  for (let i = 0; i < slots.length; i++) {
    const kind = slots[i];
    const pool = kind === 'C' ? p.consonants : p.vowels;
    const first = i === 0;
    const last = i === slots.length - 1;
    const sameBefore = !first && slots[i - 1] === kind;
    const sameAfter = last ? (after === 'vowel' && kind === 'V') || (after === 'consonant' && kind === 'C') : slots[i + 1] === kind;
    const previous = sameBefore && !starts.has(i) ? sounds[i - 1] : undefined;
    const tail = p.longestBan > 1 ? text.slice(-(p.longestBan - 1)) : '';
    const weights = pool.map((s) => {
      if (s.spelling === previous) return 0;
      if ((sameBefore && s.start === 0) || (sameAfter && s.end === 0)) return 0;
      const w = s.weight * (first ? LEANING_FACTOR[s.start] : 1) * (last && after === 'end' ? LEANING_FACTOR[s.end] : 1);
      if (w <= 0) return 0;
      return holdsBan(tail + s.spelling, p.banned) ? 0 : w;
    });
    const sound = pool[pickWeighted(rng, weights)];
    if (!sound) return null;
    text += sound.spelling;
    sounds.push(sound.spelling);
  }
  return { text, sounds, slots };
}

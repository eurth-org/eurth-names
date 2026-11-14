/**
 * A naming language: a sound palette (consonants, vowels, syllable shapes, banned clusters) and
 * word parts (place endings, given-name endings, surname patterns). Everything a nation's names
 * are made from, and nothing else.
 *
 * Each list also has a short written form, which is what the text boxes, the link and the
 * exported file use:
 *
 *   sounds    "p t*14 k ng^0 h$0"   a spelling, then *weight, ^start and $end leanings
 *   shapes    "CV*60 CVC*30"        a pattern of C and V, then *weight
 *   endings   "vin holm*20 ara"     letters, then *weight (a leading hyphen is fine: "-vin")
 *   affixes   "-sen mac- van_"      -sen follows, mac- leads, van_ leads as a word of its own,
 *                                   _dottir follows as a word of its own
 *   banned    "kt sr aa"            clusters that never appear in a name
 *
 * Whatever arrives from a link or a file goes through sanitise() first: it is someone else's
 * input. sanitise() never throws and always gives back a well-formed language.
 */

/**
 * How a sound leans at the start or the end of a word: never, seldom, as usual, often.
 *
 * "Never" reaches inside the word too. A sound that never starts a word never follows a sound
 * of its own kind either: "ng" and "rd" always come after a vowel. One that never ends a word
 * is never followed by its own kind: "h" and "br" always have a vowel after them. That is how
 * a language keeps its clusters where they belong.
 */
export type Leaning = 0 | 1 | 2 | 3;
export const LEANINGS = ['never', 'seldom', 'as usual', 'often'] as const;

export interface Sound {
  /** How the sound is written: one to four letters. "th" and "ae" are one sound each. */
  spelling: string;
  /** How common it is, 0 to 99. 0 switches it off. */
  weight: number;
  start: Leaning;
  end: Leaning;
}

export interface Shape {
  /** C for a consonant, V for a vowel: "CV", "CVC", "VC", "CCV". */
  pattern: string;
  weight: number;
}

export interface Ending {
  text: string;
  weight: number;
}

export interface Affix {
  text: string;
  weight: number;
  /** Before the name ("mac-") rather than after it ("-sen"). */
  before: boolean;
  /** A word of its own ("van Selunna") rather than joined on. */
  apart: boolean;
}

/** Fewest and most syllables in a stem. */
export interface Span {
  min: number;
  max: number;
}

export interface SurnamePattern {
  on: boolean;
  weight: number;
  affixes: Affix[];
}

export type Gender = 'feminine' | 'masculine' | 'either';
export const GENDERS: readonly Gender[] = ['feminine', 'masculine', 'either'];

export interface Language {
  name: string;
  consonants: Sound[];
  vowels: Sound[];
  shapes: Shape[];
  /**
   * Whether a syllable that starts with a vowel may follow one that ends in a vowel ("ka-i-a").
   * Off, vowels only sit side by side where a shape or a spelling says so ("CVV", or "ai" as
   * one sound).
   */
  vowelsMeet: boolean;
  banned: string[];
  length: { place: Span; given: Span; surname: Span };
  places: {
    endings: Ending[];
    /** Out of 100 places, how many are a stem with no ending. */
    bare: number;
  };
  given: {
    /** Whether given names come in feminine and masculine forms. Off: only "either" is used. */
    gendered: boolean;
    feminine: Ending[];
    masculine: Ending[];
    either: Ending[];
    bare: number;
  };
  surnames: {
    /** A given name plus an affix: "Teomirsen". */
    patronymic: SurnamePattern;
    /** A place name plus an affix or a particle: "van Selunna". */
    place: SurnamePattern;
    /** A trade word plus an ending: "Tessavin", weaver. */
    trade: SurnamePattern;
  };
}

/** A language as it may be written down: every list as its short form or in full. */
export interface Draft {
  name?: unknown;
  consonants?: unknown;
  vowels?: unknown;
  shapes?: unknown;
  vowelsMeet?: unknown;
  banned?: unknown;
  length?: unknown;
  places?: unknown;
  given?: unknown;
  surnames?: unknown;
}

export const LIMITS = {
  consonants: 40,
  vowels: 20,
  soundLetters: 4,
  shapes: 12,
  shapeLetters: 6,
  banned: 120,
  bannedLetters: 8,
  endings: 16,
  endingLetters: 10,
  affixes: 8,
  nameLength: 40,
  weight: 99,
  syllables: 6,
  /** The longest text a list is read from. */
  listLength: 1200,
  /** Most bytes of text a language may hold, so that it always fits in a link. */
  budget: 2400,
} as const;

export const DEFAULT_WEIGHT = 10;

// ---------------------------------------------------------------------------------------------
// Cleaning single values
// ---------------------------------------------------------------------------------------------

const isLetter = (ch: string): boolean => /[\p{L}\p{M}']/u.test(ch);
const isMark = (ch: string): boolean => /\p{M}/u.test(ch);

/**
 * Text a name may be built from: letters and apostrophes, lower case, at most `max` letters.
 * Everything else is dropped.
 */
export function cleanLetters(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  const text = value.slice(0, 200).normalize('NFC').toLowerCase().normalize('NFC').replace(/[’ʼ`]/g, "'");
  const kept: string[] = [];
  for (const ch of text) if (isLetter(ch)) kept.push(ch);
  // A combining mark can't open a spelling: it would land on the letter before it.
  while (kept.length > 0 && isMark(kept[0]!)) kept.shift();
  return kept.slice(0, max).join('').normalize('NFC');
}

/** A whole number between min and max, or the fallback. */
export function cleanInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

const cleanWeight = (value: unknown): number => cleanInt(value, 0, LIMITS.weight, DEFAULT_WEIGHT);
const cleanLeaning = (value: unknown): Leaning => cleanInt(value, 0, 3, 2) as Leaning;

/** A language's name: plain text, no markup, at most 40 characters. */
export function cleanName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .slice(0, 400)
    .normalize('NFC')
    .replace(/[<>\u0000-\u001f\u007f-\u009f\ud800-\udfff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LIMITS.nameLength)
    .trim();
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

/** The entries of a list given in full or as its short form. */
function entries(value: unknown, max: number): unknown[] {
  if (typeof value === 'string') return value.slice(0, LIMITS.listLength).split(/[\s,;]+/u).filter(Boolean).slice(0, max * 4);
  if (Array.isArray(value)) return value.slice(0, max * 4);
  return [];
}

/** Splits "ng*6^0$3" into its text and its numbers. */
function token(text: string): { text: string; weight?: string; start?: string; end?: string } {
  const found = /^([^*^$]*)((?:[*^$]\d{0,3})*)$/u.exec(text);
  if (!found) return { text };
  const out: { text: string; weight?: string; start?: string; end?: string } = { text: found[1] ?? '' };
  for (const [, mark, digits] of (found[2] ?? '').matchAll(/([*^$])(\d{0,3})/g)) {
    if (digits === '' || digits === undefined) continue;
    if (mark === '*') out.weight = digits;
    else if (mark === '^') out.start = digits;
    else out.end = digits;
  }
  return out;
}

function unique<T>(items: T[], key: (item: T) => string, max: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (k === '' || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Lists: reading and writing the short forms
// ---------------------------------------------------------------------------------------------

export function parseSounds(value: unknown, max: number): Sound[] {
  const sounds = entries(value, max).map((entry): Sound => {
    if (typeof entry === 'string') {
      const t = token(entry);
      return { spelling: cleanLetters(t.text, LIMITS.soundLetters), weight: cleanWeight(t.weight), start: cleanLeaning(t.start), end: cleanLeaning(t.end) };
    }
    const r = record(entry);
    return { spelling: cleanLetters(r.spelling, LIMITS.soundLetters), weight: cleanWeight(r.weight), start: cleanLeaning(r.start), end: cleanLeaning(r.end) };
  });
  return unique(sounds, (s) => s.spelling, max);
}

export function formatSounds(sounds: readonly Sound[]): string {
  return sounds
    .map((s) => s.spelling + (s.weight === DEFAULT_WEIGHT ? '' : `*${s.weight}`) + (s.start === 2 ? '' : `^${s.start}`) + (s.end === 2 ? '' : `$${s.end}`))
    .join(' ');
}

const cleanPattern = (value: unknown): string =>
  typeof value === 'string' ? value.slice(0, 40).toUpperCase().replace(/[^CV]/g, '').slice(0, LIMITS.shapeLetters) : '';

export function parseShapes(value: unknown): Shape[] {
  const shapes = entries(value, LIMITS.shapes).map((entry): Shape => {
    if (typeof entry === 'string') {
      const t = token(entry);
      return { pattern: cleanPattern(t.text), weight: cleanWeight(t.weight) };
    }
    const r = record(entry);
    return { pattern: cleanPattern(r.pattern), weight: cleanWeight(r.weight) };
  });
  return unique(shapes, (s) => s.pattern, LIMITS.shapes);
}

export function formatShapes(shapes: readonly Shape[]): string {
  return shapes.map((s) => s.pattern + (s.weight === DEFAULT_WEIGHT ? '' : `*${s.weight}`)).join(' ');
}

export function parseEndings(value: unknown): Ending[] {
  const endings = entries(value, LIMITS.endings).map((entry): Ending => {
    if (typeof entry === 'string') {
      const t = token(entry);
      return { text: cleanLetters(t.text, LIMITS.endingLetters), weight: cleanWeight(t.weight) };
    }
    const r = record(entry);
    return { text: cleanLetters(r.text, LIMITS.endingLetters), weight: cleanWeight(r.weight) };
  });
  return unique(endings, (e) => e.text, LIMITS.endings);
}

export function formatEndings(endings: readonly Ending[]): string {
  return endings.map((e) => e.text + (e.weight === DEFAULT_WEIGHT ? '' : `*${e.weight}`)).join(' ');
}

export function parseAffixes(value: unknown): Affix[] {
  const affixes = entries(value, LIMITS.affixes).map((entry): Affix => {
    if (typeof entry === 'string') {
      const t = token(entry);
      const raw = t.text.trim();
      const apart = raw.endsWith('_') || raw.startsWith('_');
      const before = raw.endsWith('_') || raw.endsWith('-');
      return { text: cleanLetters(raw, LIMITS.endingLetters), weight: cleanWeight(t.weight), before, apart };
    }
    const r = record(entry);
    return { text: cleanLetters(r.text, LIMITS.endingLetters), weight: cleanWeight(r.weight), before: r.before === true, apart: r.apart === true };
  });
  return unique(affixes, (a) => (a.text === '' ? '' : affixMark(a)), LIMITS.affixes);
}

/** An affix as it is typed: "-sen", "mac-", "van_", "_dottir". */
export function affixMark(a: Affix): string {
  if (a.apart) return a.before ? `${a.text}_` : `_${a.text}`;
  return a.before ? `${a.text}-` : `-${a.text}`;
}

export function formatAffixes(affixes: readonly Affix[]): string {
  return affixes.map((a) => affixMark(a) + (a.weight === DEFAULT_WEIGHT ? '' : `*${a.weight}`)).join(' ');
}

export function parseBanned(value: unknown): string[] {
  const banned = entries(value, LIMITS.banned).map((entry) => cleanLetters(entry, LIMITS.bannedLetters));
  return unique(banned, (b) => b, LIMITS.banned);
}

export const formatBanned = (banned: readonly string[]): string => banned.join(' ');

// ---------------------------------------------------------------------------------------------
// The whole language
// ---------------------------------------------------------------------------------------------

function cleanSpan(value: unknown, fallback: Span): Span {
  const [a, b] = Array.isArray(value) ? value : [record(value).min, record(value).max];
  const min = cleanInt(a, 1, LIMITS.syllables, fallback.min);
  const max = cleanInt(b, 1, LIMITS.syllables, Math.max(min, fallback.max));
  return { min, max: Math.max(min, max) };
}

function cleanPattern3(value: unknown): SurnamePattern {
  const r = record(value);
  return { on: r.on === true || r.on === 1, weight: cleanWeight(r.weight), affixes: parseAffixes(r.affixes) };
}

const cleanShare = (value: unknown, fallback: number): number => cleanInt(value, 0, 100, fallback);

/** A language with nothing in it. Well-formed; makes no names. */
export function blankLanguage(): Language {
  return sanitise({});
}

/**
 * Checks and clamps a language from anywhere: a link, a file, a text box. Unknown keys are
 * dropped, lists are capped, text is cut down to letters. Never throws.
 */
export function sanitise(value: unknown): Language {
  const d = record(value) as Draft;
  const length = record(d.length);
  const places = record(d.places);
  const given = record(d.given);
  const surnames = record(d.surnames);
  const language: Language = {
    name: cleanName(d.name),
    consonants: parseSounds(d.consonants, LIMITS.consonants),
    vowels: parseSounds(d.vowels, LIMITS.vowels),
    shapes: parseShapes(d.shapes),
    vowelsMeet: d.vowelsMeet === true || d.vowelsMeet === 1,
    banned: parseBanned(d.banned),
    length: {
      place: cleanSpan(length.place, { min: 2, max: 3 }),
      given: cleanSpan(length.given, { min: 2, max: 3 }),
      surname: cleanSpan(length.surname, { min: 2, max: 3 }),
    },
    places: { endings: parseEndings(places.endings), bare: cleanShare(places.bare, 25) },
    given: {
      gendered: given.gendered === true || given.gendered === 1,
      feminine: parseEndings(given.feminine),
      masculine: parseEndings(given.masculine),
      either: parseEndings(given.either),
      bare: cleanShare(given.bare, 25),
    },
    surnames: {
      patronymic: cleanPattern3(surnames.patronymic),
      place: cleanPattern3(surnames.place),
      trade: cleanPattern3(surnames.trade),
    },
  };
  return fitBudget(language);
}

const bytes = (text: string): number => new TextEncoder().encode(text).length;

/** How many bytes of text a language holds: what has to travel in its link. */
export function textSize(l: Language): number {
  return (
    bytes(l.name) +
    bytes(formatSounds(l.consonants)) +
    bytes(formatSounds(l.vowels)) +
    bytes(formatShapes(l.shapes)) +
    bytes(formatBanned(l.banned)) +
    bytes(formatEndings(l.places.endings)) +
    bytes(formatEndings(l.given.feminine)) +
    bytes(formatEndings(l.given.masculine)) +
    bytes(formatEndings(l.given.either)) +
    bytes(formatAffixes(l.surnames.patronymic.affixes)) +
    bytes(formatAffixes(l.surnames.place.affixes)) +
    bytes(formatAffixes(l.surnames.trade.affixes))
  );
}

/** Whether there is room left to add to a language. */
export const hasRoom = (l: Language): boolean => textSize(l) < LIMITS.budget - 60;

/**
 * Trims a language that would not fit in a link: the last entries of its longest lists go
 * first. Only languages written in scripts that take several bytes a letter ever get here.
 */
function fitBudget(l: Language): Language {
  if (textSize(l) <= LIMITS.budget) return l;
  const lists: { length: number; pop(): unknown }[] = [
    l.banned,
    l.places.endings,
    l.given.feminine,
    l.given.masculine,
    l.given.either,
    l.surnames.patronymic.affixes,
    l.surnames.place.affixes,
    l.surnames.trade.affixes,
    l.consonants,
    l.vowels,
  ];
  for (let guard = 0; guard < 400 && textSize(l) > LIMITS.budget; guard++) {
    const longest = lists.reduce((a, b) => (b.length > a.length ? b : a));
    if (longest.length === 0) break;
    longest.pop();
  }
  return l;
}

/** The same language, as a draft with every list in its short form. Handy to edit and to read. */
export function toDraft(l: Language): Record<string, unknown> {
  const pattern = (p: SurnamePattern) => ({ on: p.on, weight: p.weight, affixes: formatAffixes(p.affixes) });
  return {
    name: l.name,
    consonants: formatSounds(l.consonants),
    vowels: formatSounds(l.vowels),
    shapes: formatShapes(l.shapes),
    vowelsMeet: l.vowelsMeet,
    banned: formatBanned(l.banned),
    length: { place: [l.length.place.min, l.length.place.max], given: [l.length.given.min, l.length.given.max], surname: [l.length.surname.min, l.length.surname.max] },
    places: { endings: formatEndings(l.places.endings), bare: l.places.bare },
    given: {
      gendered: l.given.gendered,
      feminine: formatEndings(l.given.feminine),
      masculine: formatEndings(l.given.masculine),
      either: formatEndings(l.given.either),
      bare: l.given.bare,
    },
    surnames: { patronymic: pattern(l.surnames.patronymic), place: pattern(l.surnames.place), trade: pattern(l.surnames.trade) },
  };
}

/** Whether two languages are the same in every part. */
export const sameLanguage = (a: Language, b: Language): boolean => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------------------------------------
// Names as written
// ---------------------------------------------------------------------------------------------

/** A name as it is compared: lower case, composed letters. */
export const fold = (text: string): string => text.toLowerCase().normalize('NFC');

/**
 * A capital on the first letter. Left alone where the capital wouldn't fold back to the same
 * letter (a few letters in a few scripts), so that a name always folds to what it was built as.
 */
export function capitalise(text: string): string {
  const chars = Array.from(text);
  const at = chars.findIndex((ch) => /\p{L}/u.test(ch));
  if (at < 0) return text;
  const upper = chars[at]!.toUpperCase();
  if (upper.toLowerCase() !== chars[at]) return text;
  chars[at] = upper;
  return chars.join('');
}

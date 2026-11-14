/**
 * From a language and a seed to names: places, people and surnames, eight of each.
 *
 * The promise this file keeps: no name it hands out holds a banned cluster, wherever in the
 * name it would fall: inside a stem, across two syllables, or where an ending or an affix
 * joins on. Words are built to avoid them (word.ts), and every finished name is checked once
 * more here before it is returned. The tests hold it to that for any language and any seed.
 *
 * It also always finishes. A language too tight to fill a column gives fewer names, and
 * review.ts says why.
 */
import { capitalise, fold, type Affix, type Ending, type Gender, type Language } from './model';
import { chance, cleanSeed, pickWeighted, stream, type Rng } from './random';
import { unwanted } from './unwanted';
import { buildStem, holdsBan, prepare, type Prepared, type Stem } from './word';

export type Kind = 'place' | 'given' | 'surname';
export const KINDS: readonly Kind[] = ['place', 'given', 'surname'];

/** How a name was made. */
export type How = 'stem' | 'ending' | 'patronymic' | 'place' | 'trade';

export interface Name {
  text: string;
  kind: Kind;
  how: How;
  /** Given names in a language with gender say which list their ending came from. */
  gender?: Gender;
  /** The name a surname was built on: the parent's given name, or the place. */
  from?: string;
  /** What a trade surname means: "weaver". */
  meaning?: Trade;
}

export interface Column {
  kind: Kind;
  names: Name[];
  /** How many were asked for. Fewer came back if the language couldn't make that many. */
  wanted: number;
}

export interface Batch {
  place: Column;
  given: Column;
  surname: Column;
}

/** The seed, and how often each column has been re-rolled since. */
export interface Draw {
  seed: number;
  rolls: Record<Kind, number>;
}

export const PER_COLUMN = 8;
export const MAX_ROLLS = 9999;
/** Tries per name wanted before a column gives up. */
const TRIES = 40;

export const newDraw = (seed: number): Draw => ({ seed: cleanSeed(seed), rolls: { place: 0, given: 0, surname: 0 } });

/** The trades a trade surname can come from. Each gets one word per language. */
export const TRADES = [
  'smith',
  'miller',
  'fisher',
  'weaver',
  'baker',
  'carter',
  'cooper',
  'shepherd',
  'farmer',
  'hunter',
  'potter',
  'mason',
  'tanner',
  'brewer',
  'ferryman',
  'miner',
  'scribe',
  'thatcher',
] as const;
export type Trade = (typeof TRADES)[number];

/** A name in the making, in lower case. */
interface Made {
  lower: string;
  /** Whether an ending was added to the stem. */
  ended: boolean;
  /** The vowels it ends in, in order: the ones that give way when a vowel is joined on. */
  tail: string[];
  gender?: Gender;
}

const pickEnding = (rng: Rng, endings: readonly Ending[]): Ending | undefined => endings[pickWeighted(rng, endings.map((e) => e.weight))];

/** Whether a finished name may be handed out. */
export function allowed(p: Prepared, text: string): boolean {
  return text !== '' && !holdsBan(text, p.banned) && !unwanted(text);
}

/** The vowel of the language that a piece of text starts or ends with, the longest that fits. */
function vowelAt(p: Prepared, text: string, end: boolean): string {
  let found = '';
  for (const v of p.language.vowels) {
    if (v.spelling.length > found.length && (end ? text.endsWith(v.spelling) : text.startsWith(v.spelling))) found = v.spelling;
  }
  return found;
}

/** The vowels a stem ends in, read from its sounds (so the u of "qu" is never taken for one). */
function stemTail(stem: Stem): string[] {
  let from = stem.slots.length;
  while (from > 0 && stem.slots[from - 1] === 'V') from--;
  return stem.sounds.slice(from);
}

/** The vowels an ending or an affix ends in, read from its letters. */
export function textTail(p: Prepared, text: string): string[] {
  const tail: string[] = [];
  let rest = text;
  for (let v = vowelAt(p, rest, true); v !== '' && tail.length < 4; v = vowelAt(p, rest, true)) {
    tail.unshift(v);
    rest = rest.slice(0, -v.length);
  }
  return tail;
}

/**
 * Joins an ending onto a name. Where a vowel would meet a vowel, the name gives way, as spoken
 * languages tend to: Kitu and -ia make Kitia, not Kituia, and Atia and -ius make Atius. The
 * last vowel always goes if a letter is left; earlier ones only while two letters are.
 */
export function join(p: Prepared, base: string, tail: readonly string[], ending: string): string {
  if (vowelAt(p, ending, false) === '') return base + ending;
  let keep = base.length;
  for (let i = tail.length - 1; i >= 0; i--) {
    const left = keep - tail[i]!.length;
    if (left < (i === tail.length - 1 ? 1 : 2)) break;
    keep = left;
  }
  return base.slice(0, keep) + ending;
}

/** A stem, with an ending from the list for all but `bare` in a hundred of them. */
function stemWithEnding(p: Prepared, rng: Rng, span: { min: number; max: number }, endings: readonly Ending[], bare: number): Made | null {
  const plain = chance(rng, bare) || endings.length === 0;
  if (plain) {
    const stem = buildStem(p, rng, span.min, span.max, 'end');
    return stem && { lower: stem.text, ended: false, tail: stemTail(stem) };
  }
  const ending = pickEnding(rng, endings);
  if (!ending) return null;
  // The ending counts as a syllable, so the stem is one shorter where it can be.
  const stem = buildStem(p, rng, span.min, Math.max(span.min, span.max - 1), vowelAt(p, ending.text, false) === '' ? 'consonant' : 'vowel');
  if (!stem) return null;
  return { lower: join(p, stem.text, stemTail(stem), ending.text), ended: true, tail: textTail(p, ending.text) };
}

function makePlace(p: Prepared, rng: Rng): Made | null {
  return stemWithEnding(p, rng, p.language.length.place, p.placeEndings, p.language.places.bare);
}

function makeGiven(p: Prepared, rng: Rng): Made | null {
  const { given, length } = p.language;
  const gendered = given.gendered && (p.feminine.length > 0 || p.masculine.length > 0);
  if (!gendered) return stemWithEnding(p, rng, length.given, p.either, given.bare);
  const options: Gender[] = ['feminine', 'masculine', 'either'];
  const gender = options[pickWeighted(rng, [p.feminine.length > 0 ? 2 : 0, p.masculine.length > 0 ? 2 : 0, 1])] ?? 'either';
  const endings = gender === 'feminine' ? p.feminine : gender === 'masculine' ? p.masculine : p.either;
  // Feminine and masculine names always carry their ending: it is what marks them.
  const made = stemWithEnding(p, rng, length.given, endings, gender === 'either' ? given.bare : 0);
  return made && { ...made, gender };
}

const tradeWords = new WeakMap<Prepared, Map<Trade, Made | null>>();

function tradeStem(p: Prepared, trade: Trade): Made | null {
  let words = tradeWords.get(p);
  if (!words) tradeWords.set(p, (words = new Map()));
  const known = words.get(trade);
  if (known !== undefined) return known;
  const rng = stream('trade', trade);
  let word: Made | null = null;
  for (let i = 0; i < TRIES && word === null; i++) {
    const stem = buildStem(p, rng, 1, 2, 'consonant');
    // A word of three letters or more if the language has one to give; anything after that.
    if (stem && allowed(p, stem.text) && (stem.text.length >= 3 || i >= TRIES / 2)) word = { lower: stem.text, ended: false, tail: stemTail(stem) };
  }
  words.set(trade, word);
  return word;
}

/**
 * The language's word for a trade. It depends on the language alone, not on the seed, so the
 * weavers of one nation share a name whatever batch they turn up in.
 */
export function tradeWord(language: Language, trade: Trade): string | null {
  return tradeStem(prepare(language), trade)?.lower ?? null;
}

/**
 * A base name with an affix: "Teomirsen", "Macteomir", "O'Teomir", "van Selunna". Null when the
 * name already ends in the affix: nobody is called Thiwionion.
 */
function attach(p: Prepared, base: Made, affix: Affix | undefined): string | null {
  if (!affix) return capitalise(base.lower);
  if (affix.apart) return affix.before ? `${affix.text} ${capitalise(base.lower)}` : `${capitalise(base.lower)} ${affix.text}`;
  if (!affix.before) return base.lower.endsWith(affix.text) ? null : capitalise(join(p, base.lower, base.tail, affix.text));
  // After an apostrophe the name keeps its own capital, as in O'Brien.
  return affix.text.endsWith("'") ? capitalise(affix.text) + capitalise(base.lower) : capitalise(affix.text + base.lower);
}

const pickAffix = (rng: Rng, affixes: readonly Affix[]): Affix | undefined => affixes[pickWeighted(rng, affixes.map((a) => a.weight))];

function makeSurname(p: Prepared, rng: Rng): Name | null {
  const { length } = p.language;
  const which = pickWeighted(rng, p.surnames.map((s) => s.weight));
  if (which < 0) {
    const stem = buildStem(p, rng, length.surname.min, length.surname.max, 'end');
    return stem && { text: capitalise(stem.text), kind: 'surname', how: 'stem' };
  }
  const affix = pickAffix(rng, p.surnames[which]!.affixes);
  if (which === 2) {
    const trade = TRADES[Math.floor(rng() * TRADES.length)] ?? 'smith';
    const word = tradeStem(p, trade);
    const text = word && attach(p, word, affix);
    return text ? { text, kind: 'surname', how: 'trade', meaning: trade } : null;
  }
  const base = which === 0 ? makeGiven(p, rng) : makePlace(p, rng);
  const text = base && attach(p, base, affix);
  return base && text ? { text, kind: 'surname', how: which === 0 ? 'patronymic' : 'place', from: capitalise(base.lower) } : null;
}

function makeName(p: Prepared, kind: Kind, rng: Rng): Name | null {
  if (kind === 'surname') return makeSurname(p, rng);
  const made = kind === 'place' ? makePlace(p, rng) : makeGiven(p, rng);
  if (!made) return null;
  const name: Name = { text: capitalise(made.lower), kind, how: made.ended ? 'ending' : 'stem' };
  if (made.gender) name.gender = made.gender;
  return name;
}

/**
 * One column: up to `count` names of a kind, none twice. The same language, seed and roll
 * always give the same column, and the other two columns have no say in it.
 */
export function generateColumn(language: Language, kind: Kind, seed: number, roll = 0, count = PER_COLUMN): Column {
  const p = prepare(language);
  const rng = stream('names', 1, kind, cleanSeed(seed), roll);
  const names: Name[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count * TRIES && names.length < count; i++) {
    const name = makeName(p, kind, rng);
    if (!name) continue;
    name.text = name.text.normalize('NFC');
    const key = fold(name.text);
    // One letter is not a name.
    if (seen.has(key) || key.length < 2 || !allowed(p, name.text)) continue;
    seen.add(key);
    names.push(name);
  }
  return { kind, names, wanted: count };
}

/** The whole batch: 24 names when the language can make them. */
export function generate(language: Language, draw: Draw, count = PER_COLUMN): Batch {
  return {
    place: generateColumn(language, 'place', draw.seed, draw.rolls.place, count),
    given: generateColumn(language, 'given', draw.seed, draw.rolls.given, count),
    surname: generateColumn(language, 'surname', draw.seed, draw.rolls.surname, count),
  };
}

/** The draw after one column is rolled again. */
export function reroll(draw: Draw, kind: Kind): Draw {
  return { seed: draw.seed, rolls: { ...draw.rolls, [kind]: (draw.rolls[kind] + 1) % (MAX_ROLLS + 1) } };
}

/** Every name of a batch in one list: places, then people, then surnames. */
export const allNames = (batch: Batch): Name[] => [...batch.place.names, ...batch.given.names, ...batch.surname.names];

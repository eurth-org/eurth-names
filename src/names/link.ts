/**
 * A language lives in its link: the sounds, the word parts, the seed and how often each column
 * was re-rolled, in the query string, so a shared link gives the same 24 names.
 *
 *   ?p=1.coastal.4471          an untouched preset and a seed
 *   ?p=1.coastal.4471.0-2-1    the same, with people re-rolled twice and surnames once
 *   ?d=1.eyJuIjoi…             anything else: compact JSON in base64url
 *
 * Both start with a version, 1. It names the way names are built as well as the shape of the
 * link: if the generator ever changes, version 1 links keep being read the old way, so a link
 * made today opens the same names next year. The `d` form is written and read by
 * `encodeState()` and `decodeState()` of @eurth/style, like every Eurth tool's.
 *
 * A link is someone else's input. readLink() never throws; everything it reads goes through
 * sanitise(), and anything it can't read gives the first preset.
 */
import { MAX_ROLLS, newDraw, type Draw } from './generate';
import {
  cleanInt,
  formatAffixes,
  formatBanned,
  formatEndings,
  formatShapes,
  formatSounds,
  sameLanguage,
  sanitise,
  type Language,
  type SurnamePattern,
} from './model';
import { DEFAULT_PRESET, presetById, PRESETS, type Preset } from './presets';
import { cleanSeed } from './random';
import { decodeState, encodeState } from '@eurth/style';

export const LINK_VERSION = 1;
export const SITE = 'https://names.eurth.org/';
/** The longest `d` value read. A language at its limits is under half of this. */
export const MAX_STATE_LENGTH = 8000;

/** Everything a link holds. */
export interface State {
  language: Language;
  draw: Draw;
}

export const defaultState = (): State => ({ language: DEFAULT_PRESET.language, draw: newDraw(DEFAULT_PRESET.seed) });

/** The preset a language is still identical to, if any. */
export const presetOf = (language: Language): Preset | undefined => PRESETS.find((p) => sameLanguage(p.language, language));

const rolls = (draw: Draw): number[] => [draw.rolls.place, draw.rolls.given, draw.rolls.surname];

/** The language with short keys and every list in its short form. */
function compact(state: State): Record<string, unknown> {
  const l = state.language;
  const pattern = (p: SurnamePattern) => [p.on ? 1 : 0, p.weight, formatAffixes(p.affixes)];
  const span = l.length;
  const out: Record<string, unknown> = {
    n: l.name,
    c: formatSounds(l.consonants),
    v: formatSounds(l.vowels),
    h: formatShapes(l.shapes),
    b: formatBanned(l.banned),
    y: [span.place.min, span.place.max, span.given.min, span.given.max, span.surname.min, span.surname.max],
    p: [formatEndings(l.places.endings), l.places.bare],
    g: [l.given.gendered ? 1 : 0, formatEndings(l.given.feminine), formatEndings(l.given.masculine), formatEndings(l.given.either), l.given.bare],
    s: [pattern(l.surnames.patronymic), pattern(l.surnames.place), pattern(l.surnames.trade)],
    d: [state.draw.seed, ...rolls(state.draw)],
  };
  if (l.vowelsMeet) out.m = 1;
  return out;
}

const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function readDraw(seed: unknown, place: unknown, given: unknown, surname: unknown): Draw {
  const roll = (value: unknown) => cleanInt(value, 0, MAX_ROLLS, 0);
  return { seed: cleanSeed(seed, DEFAULT_PRESET.seed), rolls: { place: roll(place), given: roll(given), surname: roll(surname) } };
}

function expand(value: unknown): State | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const c = value as Record<string, unknown>;
  const y = array(c.y);
  const p = array(c.p);
  const g = array(c.g);
  const s = array(c.s);
  const d = array(c.d);
  const pattern = (entry: unknown) => {
    const [on, weight, affixes] = array(entry);
    return { on: on === 1 || on === true, weight, affixes };
  };
  const language = sanitise({
    name: c.n,
    consonants: c.c,
    vowels: c.v,
    shapes: c.h,
    vowelsMeet: c.m,
    banned: c.b,
    length: { place: [y[0], y[1]], given: [y[2], y[3]], surname: [y[4], y[5]] },
    places: { endings: p[0], bare: p[1] },
    given: { gendered: g[0], feminine: g[1], masculine: g[2], either: g[3], bare: g[4] },
    surnames: { patronymic: pattern(s[0]), place: pattern(s[1]), trade: pattern(s[2]) },
  });
  return { language, draw: readDraw(d[0], d[1], d[2], d[3]) };
}

/**
 * The query string for a state, without the question mark: "p=1.coastal.4471" or "d=1.…".
 */
export function writeLink(state: State): string {
  const preset = presetOf(state.language);
  if (preset) {
    const r = rolls(state.draw);
    return `p=${LINK_VERSION}.${preset.id}.${state.draw.seed}${r.some((n) => n > 0) ? `.${r.join('-')}` : ''}`;
  }
  return `d=${encodeState(compact(state), LINK_VERSION)}`;
}

/** The full address for a state. */
export const linkFor = (state: State, site = SITE): string => `${site}?${writeLink(state)}`;

export interface ReadLink {
  state: State;
  /**
   * 'none': the link held no language (a plain visit). 'ok': it was read. 'newer': it was made
   * by a later version of Names than this one. 'broken': it couldn't be read.
   * For anything but 'ok', `state` is the first preset.
   */
  found: 'none' | 'ok' | 'newer' | 'broken';
}

function readPreset(text: string): ReadLink['found'] | State {
  const found = /^(\d{1,4})\.([a-z]{1,20})\.(\d{1,10})(?:\.(\d{1,4})-(\d{1,4})-(\d{1,4}))?$/.exec(text);
  if (!found) return 'broken';
  if (Number(found[1]) > LINK_VERSION) return 'newer';
  const preset = presetById(found[2]);
  if (!preset || Number(found[1]) < 1) return 'broken';
  return { language: preset.language, draw: readDraw(found[3], found[4], found[5], found[6]) };
}

function readState(text: string): ReadLink['found'] | State {
  const read = decodeState(text, { maxLength: MAX_STATE_LENGTH });
  if (!read || read.version < 1) return 'broken';
  if (read.version > LINK_VERSION) return 'newer';
  return expand(read.value) ?? 'broken';
}

/**
 * Reads a link's query string ("?p=1.coastal.4471", with or without the question mark, or a
 * URLSearchParams). Never throws.
 */
export function readLink(query: string | URLSearchParams | null | undefined): ReadLink {
  let params: URLSearchParams;
  try {
    params = typeof query === 'string' ? new URLSearchParams(query.slice(0, MAX_STATE_LENGTH + 200)) : (query ?? new URLSearchParams());
  } catch {
    return { state: defaultState(), found: 'broken' };
  }
  const p = params.get('p');
  const d = params.get('d');
  if (p === null && d === null) return { state: defaultState(), found: 'none' };
  const result = d !== null ? readState(d) : readPreset(p ?? '');
  return typeof result === 'string' ? { state: defaultState(), found: result } : { state: result, found: 'ok' };
}

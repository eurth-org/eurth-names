/**
 * The "names" section of a nation's profile (<nation>.eurth.json): how a naming language
 * travels to the other Eurth tools and comes back for editing.
 *
 * As the handbook asks, the section is small. Its `link` carries the whole language: the
 * sound palette, the word parts and the seed. Beside it sit a summary in words, the language's
 * name, and the picked names in `places`, `people` and `surnames`, but only when the person
 * asks for them to be added.
 *
 * This file only builds and reads the section. @eurth/profile does the rest (the file, the
 * other sections, the date): setSection(profile, 'names', toSection(state, { previous })).
 */
import type { Name } from './generate';
import { summarise } from './describe';
import { linkFor, readLink, SITE, type State } from './link';

/** Limits of the profile's schema for the three lists. */
export const MAX_LISTED = 200;
export const MAX_NAME_LENGTH = 80;
/** The longest link the profile's schema takes. A language always fits: sanitise() sees to it. */
export const MAX_LINK_LENGTH = 4000;

export interface Picks {
  places: string[];
  people: string[];
  surnames: string[];
}

/** Picked names sorted into the profile's three lists. */
export function picksOf(names: readonly Name[]): Picks {
  const of = (kind: Name['kind']) => names.filter((n) => n.kind === kind).map((n) => n.text);
  return { places: of('place'), people: of('given'), surnames: of('surname') };
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};

/** What is in a list already, then the new names: no repeats, the newest kept when it overflows. */
function merge(existing: unknown, added: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of [...(Array.isArray(existing) ? existing : []), ...added]) {
    if (typeof item !== 'string') continue;
    const name = item.trim().slice(0, MAX_NAME_LENGTH);
    if (name === '' || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out.slice(-MAX_LISTED);
}

export interface SectionOptions {
  /** The section as it is in the loaded profile. Its other keys are kept, known or not. */
  previous?: unknown;
  /** Picked names to add to the lists. Left out, the lists stay as they were. */
  picks?: Picks | null;
  site?: string;
}

/** The names section for a state. */
export function toSection(state: State, { previous, picks, site = SITE }: SectionOptions = {}): Record<string, unknown> {
  const section = record(previous);
  section.link = linkFor(state, site);
  section.summary = summarise(state.language);
  section.language = state.language.name === '' ? 'Unnamed' : state.language.name;
  if (picks) {
    section.places = merge(section.places, picks.places);
    section.people = merge(section.people, picks.people);
    section.surnames = merge(section.surnames, picks.surnames);
  }
  return section;
}

/**
 * The state a names section holds, or null when it holds none we can read: no link, a link to
 * somewhere else, or one that doesn't open. Only links to Names itself are followed.
 */
export function fromSection(section: unknown, site = SITE): State | null {
  const link = record(section).link;
  if (typeof link !== 'string' || link.length > MAX_LINK_LENGTH || !link.startsWith(site)) return null;
  const at = link.indexOf('?');
  if (at < 0) return null;
  const read = readLink(link.slice(at + 1).split('#')[0]);
  return read.found === 'ok' ? read.state : null;
}

/**
 * What leaves the tool as text: the list of names (plain text and CSV), the picked names, and
 * the language itself as a small JSON file that loads back in.
 */
import { KINDS, type Batch, type Draw, type Kind, type Name } from './generate';
import { howMade, KIND_TITLES, nameWithNote } from './describe';
import { fold, sanitise, toDraft, type Language } from './model';
import { defaultState, type State } from './link';
import { cleanSeed } from './random';

const byKind = (names: readonly Name[], kind: Kind): Name[] => names.filter((n) => n.kind === kind);

/** The names as plain text, a column at a time, under the language's name and seed. */
export function namesAsText(language: Language, draw: Draw, names: readonly Name[]): string {
  const lines = [`${language.name === '' ? 'Names' : language.name}, seed ${draw.seed}`];
  for (const kind of KINDS) {
    const column = byKind(names, kind);
    if (column.length === 0) continue;
    lines.push('', KIND_TITLES[kind], ...column.map(nameWithNote));
  }
  return `${lines.join('\n')}\n`;
}

/** Picked names, one to a line: what Copy list copies. */
export const picksAsText = (names: readonly Name[]): string => names.map((n) => n.text).join('\n');

/**
 * One cell of a CSV file. Quoted when it must be, and never able to start a formula: a
 * spreadsheet runs a cell that begins with =, +, - or @.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const CSV_KIND: Record<Kind, string> = { place: 'place', given: 'person', surname: 'surname' };

/** The names as CSV: kind, name, gender, how it was made, and whether it was picked. */
export function namesAsCsv(names: readonly Name[], picked: ReadonlySet<string> = new Set()): string {
  const rows = [['kind', 'name', 'gender', 'made', 'picked']];
  for (const n of names) rows.push([CSV_KIND[n.kind], n.text, n.gender ?? '', howMade(n), picked.has(pickKey(n)) ? 'yes' : '']);
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

/** What a picked name is known by: its kind and its text. */
export const pickKey = (name: Pick<Name, 'kind' | 'text'>): string => `${name.kind}:${fold(name.text)}`;

/** Every name of a batch, in the order of the columns. */
export const batchNames = (batch: Batch): Name[] => [...batch.place.names, ...batch.given.names, ...batch.surname.names];

export const LANGUAGE_FORMAT = 'eurth-names-language';
export const LANGUAGE_EXTENSION = '.names.json';
/** The largest language file read. A real one is a kilobyte or two. */
export const MAX_FILE_LENGTH = 100_000;

/** The language as a JSON file: readable, editable by hand, and loadable again. */
export function languageAsJson(state: State): string {
  const file = {
    about: 'A naming language made with Names (names.eurth.org), one of the free worldbuilding tools by Eurth. Load it there to make names with it.',
    format: LANGUAGE_FORMAT,
    version: 1,
    seed: state.draw.seed,
    language: toDraft(state.language),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** A file name for a language: "soft-coast.names.json". */
export function languageFileName(language: Language): string {
  const slug = language.name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${slug === '' ? 'language' : slug}${LANGUAGE_EXTENSION}`;
}

export type LoadedLanguage = { ok: true; state: State } | { ok: false; message: string };

/** Reads a language file. Never throws; says what to do when it can't be read. */
export function languageFromJson(text: unknown): LoadedLanguage {
  const no = (message: string): LoadedLanguage => ({ ok: false, message });
  if (typeof text !== 'string') return no("That file can't be read as text. Pick a language saved from Names: its name ends in .names.json.");
  if (text.length > MAX_FILE_LENGTH) return no('That file is too big to be a naming language. Pick one saved from Names: its name ends in .names.json.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return no("That file isn't a naming language. Pick one saved from Names: its name ends in .names.json.");
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return no("That file isn't a naming language. Pick one saved from Names: its name ends in .names.json.");
  const file = value as Record<string, unknown>;
  if (typeof file.version === 'number' && file.version > 1) return no('That language was saved by a newer version of Names. Reload this page to get the latest version, then try again.');
  const draft = typeof file.language === 'object' && file.language !== null ? file.language : file;
  const d = draft as Record<string, unknown>;
  if (d.consonants === undefined && d.vowels === undefined) return no("That file isn't a naming language. Pick one saved from Names: its name ends in .names.json.");
  const fallback = defaultState();
  return { ok: true, state: { language: sanitise(draft), draw: { seed: cleanSeed(file.seed, fallback.draw.seed), rolls: { place: 0, given: 0, surname: 0 } } } };
}

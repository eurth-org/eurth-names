/**
 * A language and its names in plain words: for Copy description, for screen readers, and for
 * the summary in a nation's profile.
 */
import { PER_COLUMN, type Batch, type Draw, type Kind, type Name } from './generate';
import { affixMark, type Affix, type Ending, type Language, type Sound, type SurnamePattern } from './model';

export const KIND_TITLES: Record<Kind, string> = { place: 'Places', given: 'People', surname: 'Surnames' };

/** "a, b and c", or "a, b or c". */
export function list(items: readonly string[], word: 'and' | 'or' = 'and'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;
}

const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

const byWeight = <T extends { weight: number }>(items: readonly T[]): T[] => items.filter((item) => item.weight > 0).sort((a, b) => b.weight - a.weight);

const sounds = (items: readonly Sound[]): string => byWeight(items).map((s) => s.spelling).join(', ');
const endings = (items: readonly Ending[]): string[] => byWeight(items).map((e) => `-${e.text}`);
const affixes = (items: readonly Affix[]): string[] => byWeight(items).map((a) => (a.apart ? `"${a.text}"` : affixMark(a)));

/** How a name was made, in a few words: "child of Teomir", "from Selunna", "weaver". Empty for a plain name. */
export function howMade(name: Name): string {
  if (name.how === 'patronymic' && name.from) return `child of ${name.from}`;
  if (name.how === 'place' && name.from) return `from ${name.from}`;
  if (name.how === 'trade' && name.meaning) return name.meaning;
  return '';
}

/** A name with what there is to say about it: "Teomir (masculine)", "Varenko (child of Varen)". */
export function nameWithNote(name: Name): string {
  const note = name.kind === 'given' ? (name.gender && name.gender !== 'either' ? name.gender : '') : howMade(name);
  return note === '' ? name.text : `${name.text} (${note})`;
}

function surnameLine(l: Language): string {
  const parts: string[] = [];
  const say = (pattern: SurnamePattern, what: string) => {
    if (!pattern.on) return;
    const marks = affixes(pattern.affixes);
    parts.push(marks.length > 0 ? `${what} (${marks.join(', ')})` : what);
  };
  say(l.surnames.patronymic, "from a parent's name");
  say(l.surnames.place, 'from a place');
  say(l.surnames.trade, 'from a trade');
  return parts.length === 0 ? 'Surnames are plain words of the language.' : `Surnames come ${list(parts, 'or')}.`;
}

/** The sentences that describe a language, one idea each. */
export function languageSentences(l: Language): string[] {
  const name = l.name === '' ? 'This naming language' : l.name;
  const out: string[] = [];
  const consonants = byWeight(l.consonants);
  const vowels = byWeight(l.vowels);
  if (consonants.length === 0 && vowels.length === 0) return [`${name} has no sounds yet.`];
  out.push(
    `${name}${l.name === '' ? '' : ' is a naming language that'} has ${plural(consonants.length, 'consonant')}${consonants.length > 0 ? ` (${sounds(l.consonants)})` : ''} and ${plural(vowels.length, 'vowel')}${vowels.length > 0 ? ` (${sounds(l.vowels)})` : ''}, most common first.`,
  );
  const shapes = byWeight(l.shapes).map((s) => s.pattern);
  if (shapes.length === 1) out.push(`Every syllable has the shape ${shapes[0]}.`);
  else if (shapes.length > 1) out.push(`Syllables have the shapes ${list(shapes)}, most often ${shapes[0]}.`);
  out.push(l.vowelsMeet ? 'Vowels may meet between syllables.' : 'Vowels never meet between syllables.');
  if (l.banned.length > 0) {
    out.push(l.banned.length <= 6 ? `It never allows ${list(l.banned, 'or')}.` : `It bans ${l.banned.length} clusters, among them ${list(l.banned.slice(0, 5))}.`);
  }
  const place = endings(l.places.endings);
  if (place.length > 0) out.push(`Places end in ${list(place, 'or')}${l.places.bare > 0 ? ', or in nothing at all' : ''}.`);
  const feminine = endings(l.given.feminine);
  const masculine = endings(l.given.masculine);
  const either = endings(l.given.either);
  if (l.given.gendered && (feminine.length > 0 || masculine.length > 0)) {
    const forms = [feminine.length > 0 ? `feminine (${feminine.join(', ')})` : '', masculine.length > 0 ? `masculine (${masculine.join(', ')})` : ''].filter(Boolean);
    out.push(`Given names come in ${list(forms)} forms${either.length > 0 ? `, with ${list(either, 'or')} for either` : ''}.`);
  } else if (either.length > 0) {
    out.push(`Given names end in ${list(either, 'or')}${l.given.bare > 0 ? ', or in nothing at all' : ''}.`);
  }
  out.push(surnameLine(l));
  return out;
}

/** The language in one paragraph. */
export const describeLanguage = (l: Language): string => languageSentences(l).join(' ');

/** The language in at most `max` characters, cut at the end of a sentence: the profile's summary. */
export function summarise(l: Language, max = 600): string {
  let text = '';
  for (const sentence of languageSentences(l)) {
    const next = text === '' ? sentence : `${text} ${sentence}`;
    if (next.length > max) break;
    text = next;
  }
  return text === '' ? (languageSentences(l)[0] ?? '').slice(0, max) : text;
}

/** The language, the seed and the names it gave: what Copy description copies. */
export function describeBatch(l: Language, draw: Draw, batch: Batch): string {
  const lines = [describeLanguage(l), ''];
  const total = batch.place.names.length + batch.given.names.length + batch.surname.names.length;
  lines.push(`${plural(total, 'name')} from seed ${draw.seed}:`);
  for (const column of [batch.place, batch.given, batch.surname]) {
    if (column.names.length === 0) lines.push(`${KIND_TITLES[column.kind]}: none.`);
    else lines.push(`${KIND_TITLES[column.kind]}: ${column.names.map(nameWithNote).join(', ')}.`);
  }
  return lines.join('\n');
}

/** What a screen reader hears when a batch arrives. */
export function announceBatch(batch: Batch): string {
  const total = batch.place.names.length + batch.given.names.length + batch.surname.names.length;
  if (total === 0) return 'No names: this language needs more sounds, shapes or endings.';
  const short = [batch.place, batch.given, batch.surname].some((c) => c.names.length < c.wanted);
  return `${plural(total, 'new name')}: ${plural(batch.place.names.length, 'place')}, ${plural(batch.given.names.length, 'person', 'people')}, ${plural(batch.surname.names.length, 'surname')}.${short ? ` Fewer than the ${PER_COLUMN * 3} asked for.` : ''}`;
}

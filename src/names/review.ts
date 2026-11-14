/**
 * Gentle notes on a language while it is being edited: what stops it making names, and what is
 * quietly being left out. A problem means no names (or too few) until it is fixed; a note is
 * only worth knowing.
 */
import { KINDS, PER_COLUMN, generateColumn, type Kind } from './generate';
import { affixMark, type Ending, type Language } from './model';
import { fillable, holdsBan, prepare } from './word';

export interface Note {
  /** Stable, for tests and for keying a list. */
  id: string;
  level: 'problem' | 'note';
  /** A full sentence for the person. */
  message: string;
}

const KIND_WORDS: Record<Kind, string> = { place: 'places', given: 'people', surname: 'surnames' };

const quote = (items: readonly string[]): string => {
  const quoted = items.map((item) => `"${item}"`);
  return quoted.length <= 1 ? quoted.join('') : `${quoted.slice(0, -1).join(', ')} and ${quoted[quoted.length - 1]}`;
};

export function review(language: Language): Note[] {
  const notes: Note[] = [];
  const p = prepare(language);
  const live = (list: readonly { weight: number }[]) => list.filter((item) => item.weight > 0).length;

  if (live(language.vowels) === 0) notes.push({ id: 'no-vowels', level: 'problem', message: 'Add at least one vowel: every syllable needs one to lean on.' });
  if (live(language.shapes) === 0) notes.push({ id: 'no-shapes', level: 'problem', message: 'Pick at least one syllable shape, such as CV.' });
  const needsConsonants = language.shapes.some((s) => s.weight > 0 && s.pattern.includes('C'));
  if (live(language.consonants) === 0 && needsConsonants) {
    notes.push({ id: 'no-consonants', level: live(language.shapes) > 0 && p.shapes.length > 0 ? 'note' : 'problem', message: 'There are no consonants, so only the shapes made of vowels are used.' });
  }

  const bannedSounds = [...language.consonants, ...language.vowels].filter((s) => s.weight > 0 && holdsBan(s.spelling, p.banned)).map((s) => s.spelling);
  if (bannedSounds.length > 0) {
    notes.push({
      id: 'banned-sound',
      level: 'note',
      message: `${quote(bannedSounds)} ${bannedSounds.length === 1 ? 'is a sound of this language, but a banned cluster rules it out, so it never appears' : 'are sounds of this language, but banned clusters rule them out, so they never appear'}.`,
    });
  }

  const stuck = language.shapes.filter((s) => s.weight > 0 && !fillable(s, p.consonants.length, p.vowels.length)).map((s) => s.pattern);
  if (stuck.length > 0 && live(language.vowels) > 0) {
    notes.push({
      id: 'shape-unfillable',
      level: p.shapes.length === 0 ? 'problem' : 'note',
      message: `The ${stuck.length === 1 ? 'shape' : 'shapes'} ${quote(stuck)} can't be filled: two consonants or two vowels side by side need at least two to choose from.`,
    });
  }

  const skipped = (endings: readonly Ending[]) => endings.filter((e) => e.weight > 0 && holdsBan(e.text, p.banned)).map((e) => `-${e.text}`);
  const skippedEndings = [...skipped(language.places.endings), ...skipped(language.given.feminine), ...skipped(language.given.masculine), ...skipped(language.given.either)];
  if (skippedEndings.length > 0) {
    notes.push({
      id: 'ending-banned',
      level: 'note',
      message: `${quote(skippedEndings)} ${skippedEndings.length === 1 ? 'holds a banned cluster, so it is' : 'hold banned clusters, so they are'} left out.`,
    });
  }
  const patterns = [language.surnames.patronymic, language.surnames.place, language.surnames.trade];
  const skippedAffixes = patterns.flatMap((s) => (s.on ? s.affixes.filter((a) => a.weight > 0 && holdsBan(a.text, p.banned)).map(affixMark) : []));
  if (skippedAffixes.length > 0) {
    notes.push({
      id: 'affix-banned',
      level: 'note',
      message: `${quote(skippedAffixes)} ${skippedAffixes.length === 1 ? 'holds a banned cluster, so no surname is made with it' : 'hold banned clusters, so no surname is made with them'}.`,
    });
  }

  if (language.given.gendered && p.feminine.length === 0 && p.masculine.length === 0) {
    notes.push({ id: 'gender-unmarked', level: 'note', message: 'Given names are set to come in feminine and masculine forms, but neither has an ending to mark it. Add one, or switch the forms off.' });
  }

  if (!language.vowelsMeet && p.shapes.length > 0 && p.shapes.every((s) => s.pattern.startsWith('V')) && p.shapes.some((s) => s.pattern.endsWith('V'))) {
    notes.push({ id: 'vowels-must-meet', level: 'note', message: 'Every shape starts with a vowel, so vowels meet between syllables after all. Add a shape that starts with a consonant to keep them apart.' });
  }

  // The proof of the pudding: can it fill a column?
  if (notes.every((n) => n.level !== 'problem')) {
    for (const kind of KINDS) {
      const made = generateColumn(language, kind, 1).names.length;
      if (made === 0) {
        notes.push({ id: `none-${kind}`, level: 'problem', message: `This language can't make any ${KIND_WORDS[kind]}. Loosen the banned clusters, or add sounds, shapes or endings.` });
      } else if (made < PER_COLUMN) {
        notes.push({ id: `few-${kind}`, level: 'problem', message: `This language can only make ${made} of the ${PER_COLUMN} ${KIND_WORDS[kind]} asked for. Add sounds or shapes, allow longer names, or ban less.` });
      }
    }
  }
  return notes;
}

/** Whether a language can fill all three columns. */
export const canGenerate = (language: Language): boolean => review(language).every((n) => n.level !== 'problem');

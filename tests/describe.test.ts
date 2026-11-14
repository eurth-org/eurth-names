import { describe, expect, it } from 'vitest';
import { announceBatch, describeBatch, describeLanguage, howMade, list, nameWithNote, summarise } from '../src/names/describe';
import { generate, newDraw } from '../src/names/generate';
import { sanitise } from '../src/names/model';
import { PRESETS } from '../src/names/presets';
import { coastal } from './helpers';

describe('describing a language', () => {
  it('says what it is made of, most common first', () => {
    expect(describeLanguage(coastal())).toBe(
      'Test coast is a naming language that has 10 consonants (l, n, r, s, m, t, k, v, d, p) and 6 vowels (a, e, i, o, u, ae), most common first. ' +
        'Syllables have the shapes CV, CVC, V and VC, most often CV. ' +
        'Vowels never meet between syllables. ' +
        'It bans 7 clusters, among them aa, ee, ii, oo and uu. ' +
        'Places end in -vin, -holm, -ara or -mar, or in nothing at all. ' +
        'Given names come in feminine (-a, -ia, -el) and masculine (-o, -an, -ir) forms, with -in for either. ' +
        "Surnames come from a parent's name (-sen, mac-, o'-), from a place (\"van\", -er) or from a trade (-in, -ar).",
    );
  });

  it('copes with a language that has little or nothing', () => {
    expect(describeLanguage(sanitise({}))).toBe('This naming language has no sounds yet.');
    expect(describeLanguage(sanitise({ name: 'Ka', consonants: 'k', vowels: 'a', shapes: 'CV', vowelsMeet: true, banned: 'kk' }))).toBe(
      'Ka is a naming language that has 1 consonant (k) and 1 vowel (a), most common first. Every syllable has the shape CV. Vowels may meet between syllables. It never allows kk. Surnames are plain words of the language.',
    );
    expect(describeLanguage(sanitise({ consonants: 'k', vowels: 'a', given: { either: 'in el', bare: 0 } }))).toContain('Given names end in -in or -el.');
  });

  it('leaves out sounds that are switched off', () => {
    expect(describeLanguage(sanitise({ consonants: 'k t*0', vowels: 'a', shapes: 'CV' }))).toContain('1 consonant (k)');
  });

  it('writes lists the way people do', () => {
    expect(list([])).toBe('');
    expect(list(['a'])).toBe('a');
    expect(list(['a', 'b'])).toBe('a and b');
    expect(list(['a', 'b', 'c'], 'or')).toBe('a, b or c');
  });

  it('fits a summary into 600 characters, at the end of a sentence', () => {
    for (const p of PRESETS) {
      const text = summarise(p.language);
      expect(text.length).toBeLessThanOrEqual(600);
      expect(text.length).toBeGreaterThan(100);
      expect(text).toMatch(/\.$/);
      expect(describeLanguage(p.language).startsWith(text)).toBe(true);
    }
    expect(summarise(coastal(), 80)).toBe('Test coast is a naming language that has 10 consonants (l, n, r, s, m, t, k, v, d'.slice(0, 80));
  });
});

describe('describing names', () => {
  it('says how a surname was made', () => {
    expect(howMade({ text: 'Teomirsen', kind: 'surname', how: 'patronymic', from: 'Teomir' })).toBe('child of Teomir');
    expect(howMade({ text: 'van Selunna', kind: 'surname', how: 'place', from: 'Selunna' })).toBe('from Selunna');
    expect(howMade({ text: 'Tessavin', kind: 'surname', how: 'trade', meaning: 'weaver' })).toBe('weaver');
    expect(howMade({ text: 'Varen', kind: 'surname', how: 'stem' })).toBe('');
  });

  it('adds what there is to say after a name', () => {
    expect(nameWithNote({ text: 'Ilsa', kind: 'given', how: 'ending', gender: 'feminine' })).toBe('Ilsa (feminine)');
    expect(nameWithNote({ text: 'Maelin', kind: 'given', how: 'ending', gender: 'either' })).toBe('Maelin');
    expect(nameWithNote({ text: 'Selunna', kind: 'place', how: 'ending' })).toBe('Selunna');
    expect(nameWithNote({ text: 'Tessavin', kind: 'surname', how: 'trade', meaning: 'weaver' })).toBe('Tessavin (weaver)');
  });

  it('describes a whole batch: the language, the seed and the three columns', () => {
    const l = coastal();
    const batch = generate(l, newDraw(4471));
    const text = describeBatch(l, newDraw(4471), batch);
    const lines = text.split('\n');
    expect(lines[0]).toBe(describeLanguage(l));
    expect(lines[2]).toBe('24 names from seed 4471:');
    expect(lines[3]).toMatch(/^Places: (\S+, ){7}\S+\.$/);
    expect(lines[4]).toMatch(/^People: /);
    expect(lines[5]).toMatch(/^Surnames: /);
    for (const name of batch.place.names) expect(text).toContain(name.text);
  });

  it('tells a screen reader what arrived', () => {
    expect(announceBatch(generate(coastal(), newDraw(1)))).toBe('24 new names: 8 places, 8 people, 8 surnames.');
    expect(announceBatch(generate(sanitise({}), newDraw(1)))).toBe('No names: this language needs more sounds, shapes or endings.');
    const tight = sanitise({ consonants: 'k', vowels: 'a i', shapes: 'CV', length: { place: [1, 1], given: [1, 1], surname: [1, 1] }, places: { bare: 100 }, given: { bare: 100 } });
    expect(announceBatch(generate(tight, newDraw(1)))).toBe('6 new names: 2 places, 2 people, 2 surnames. Fewer than the 24 asked for.');
  });
});

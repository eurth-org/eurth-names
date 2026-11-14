import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  affixMark,
  blankLanguage,
  capitalise,
  cleanLetters,
  cleanName,
  fold,
  formatAffixes,
  formatEndings,
  formatShapes,
  formatSounds,
  parseAffixes,
  parseBanned,
  parseEndings,
  parseShapes,
  parseSounds,
  sanitise,
  textSize,
  toDraft,
} from '../src/names/model';
import { anyLanguage, coastal } from './helpers';

describe('the short forms', () => {
  it('reads sounds with weights and leanings', () => {
    expect(parseSounds('p t*14 ng^0 h$0 th*6^3$1', 40)).toEqual([
      { spelling: 'p', weight: 10, start: 2, end: 2 },
      { spelling: 't', weight: 14, start: 2, end: 2 },
      { spelling: 'ng', weight: 10, start: 0, end: 2 },
      { spelling: 'h', weight: 10, start: 2, end: 0 },
      { spelling: 'th', weight: 6, start: 3, end: 1 },
    ]);
  });

  it('writes sounds back the way they were typed', () => {
    const text = 'p t*14 ng^0 h$0 th*6^3$1 ae';
    expect(formatSounds(parseSounds(text, 40))).toBe(text);
  });

  it('takes commas and line breaks between entries, and drops repeats', () => {
    expect(parseSounds('a, e;\ni  a', 20).map((s) => s.spelling)).toEqual(['a', 'e', 'i']);
  });

  it('lower-cases sounds and keeps letters only', () => {
    expect(parseSounds('TH K! 9 é ’', 40).map((s) => s.spelling)).toEqual(['th', 'k', 'é', "'"]);
  });

  it('reads shapes, in either case', () => {
    expect(parseShapes('cv*60 CVC*30 x CCV')).toEqual([
      { pattern: 'CV', weight: 60 },
      { pattern: 'CVC', weight: 30 },
      { pattern: 'CCV', weight: 10 },
    ]);
    expect(formatShapes(parseShapes('CV*60 CVC'))).toBe('CV*60 CVC');
  });

  it('reads endings with or without their hyphen', () => {
    expect(parseEndings('-vin holm*20')).toEqual([
      { text: 'vin', weight: 10 },
      { text: 'holm', weight: 20 },
    ]);
    expect(formatEndings(parseEndings('-vin holm*20'))).toBe('vin holm*20');
  });

  it('reads the four kinds of affix', () => {
    const affixes = parseAffixes("-sen mac- van_ _dottir o'-*4");
    expect(affixes).toEqual([
      { text: 'sen', weight: 10, before: false, apart: false },
      { text: 'mac', weight: 10, before: true, apart: false },
      { text: 'van', weight: 10, before: true, apart: true },
      { text: 'dottir', weight: 10, before: false, apart: true },
      { text: "o'", weight: 4, before: true, apart: false },
    ]);
    expect(affixes.map(affixMark)).toEqual(['-sen', 'mac-', 'van_', '_dottir', "o'-"]);
    expect(formatAffixes(affixes)).toBe("-sen mac- van_ _dottir o'-*4");
  });

  it('keeps the same letters as two affixes when they sit on different sides', () => {
    expect(parseAffixes('-an an-').map(affixMark)).toEqual(['-an', 'an-']);
  });

  it('reads banned clusters', () => {
    expect(parseBanned('KT sr, aa kt')).toEqual(['kt', 'sr', 'aa']);
  });
});

describe('cleaning', () => {
  it('cuts text down to letters and apostrophes', () => {
    expect(cleanLetters('Thé-<b>1</b>', 10)).toBe('thébb');
    expect(cleanLetters('a’b', 4)).toBe("a'b");
    expect(cleanLetters(42, 4)).toBe('');
  });

  it('never lets a combining mark open a spelling', () => {
    expect(cleanLetters('́a', 4)).toBe('a');
  });

  it('cleans a language name of markup and control characters', () => {
    expect(cleanName('  <b>Soft</b>\n and   coastal ')).toBe('bSoft/b and coastal');
    expect(cleanName('x'.repeat(100))).toHaveLength(LIMITS.nameLength);
    expect(cleanName(null)).toBe('');
  });

  it('gives a name its capital, past an apostrophe', () => {
    expect(capitalise('selunna')).toBe('Selunna');
    expect(capitalise("'alu")).toBe("'Alu");
    expect(capitalise('')).toBe('');
  });

  it('leaves a first letter alone when its capital would not fold back', () => {
    for (const text of ['ßen', 'ıra', 'ǆan', 'ŉa']) expect(fold(capitalise(text))).toBe(fold(text));
  });
});

describe('sanitise', () => {
  it('makes a well-formed language from nothing', () => {
    for (const junk of [undefined, null, 7, 'text', [], { consonants: 5, shapes: { a: 1 }, length: 'long', surnames: [] }]) {
      const l = sanitise(junk);
      expect(l.consonants).toEqual([]);
      expect(l.length.place).toEqual({ min: 2, max: 3 });
      expect(l.surnames.trade).toEqual({ on: false, weight: 10, affixes: [] });
    }
    expect(blankLanguage().name).toBe('');
  });

  it('reads a language written in full or in short', () => {
    const short = coastal();
    const full = sanitise(JSON.parse(JSON.stringify(short)));
    expect(full).toEqual(short);
    expect(sanitise(toDraft(short))).toEqual(short);
  });

  it('caps every list', () => {
    const many = Array.from({ length: 300 }, (_, i) => String.fromCharCode(0x61 + (i % 26)) + String.fromCharCode(0x61 + (Math.floor(i / 26) % 26)));
    const l = sanitise({ consonants: many, vowels: many, banned: many, places: { endings: many }, surnames: { place: { on: true, affixes: many } } });
    expect(l.consonants).toHaveLength(LIMITS.consonants);
    expect(l.vowels).toHaveLength(LIMITS.vowels);
    expect(l.banned).toHaveLength(LIMITS.banned);
    expect(l.places.endings).toHaveLength(LIMITS.endings);
    expect(l.surnames.place.affixes).toHaveLength(LIMITS.affixes);
  });

  it('clamps numbers', () => {
    const l = sanitise({ consonants: [{ spelling: 'k', weight: 5000, start: -3, end: 9 }], length: { place: [9, 0], given: { min: 3, max: 2 } }, places: { bare: 250 }, given: { bare: -5 } });
    expect(l.consonants[0]).toEqual({ spelling: 'k', weight: 99, start: 0, end: 3 });
    expect(l.length.place).toEqual({ min: 6, max: 6 });
    expect(l.length.given).toEqual({ min: 3, max: 3 });
    expect(l.places.bare).toBe(100);
    expect(l.given.bare).toBe(0);
  });

  it('drops keys it does not know', () => {
    const l = sanitise({ name: 'X', __proto__: { evil: true }, extra: 1, places: { endings: 'a', more: 2 } });
    expect(Object.keys(l).sort()).toEqual(['banned', 'consonants', 'given', 'length', 'name', 'places', 'shapes', 'surnames', 'vowels', 'vowelsMeet']);
    expect(Object.keys(l.places).sort()).toEqual(['bare', 'endings']);
  });

  it('gives the same language when run twice, whatever it is given', () => {
    fc.assert(
      fc.property(anyLanguage, (l) => {
        expect(sanitise(l)).toEqual(l);
        expect(sanitise(toDraft(l))).toEqual(l);
      }),
    );
  });

  it('never throws and always answers, for any JSON at all', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const l = sanitise(value);
        expect(sanitise(l)).toEqual(l);
        expect(textSize(l)).toBeLessThanOrEqual(LIMITS.budget);
      }),
    );
  });

  it('trims a language too big for a link, longest lists first', () => {
    const wide = (n: number, at: number) => Array.from({ length: n }, (_, i) => String.fromCodePoint(at + i).repeat(4));
    const l = sanitise({
      consonants: wide(40, 0x10400 + 40),
      vowels: wide(20, 0x10400 + 100),
      banned: wide(60, 0x4e00).map((s) => s + s),
      places: { endings: wide(16, 0x5e00).map((s) => s + s + s) },
      given: { feminine: wide(16, 0x6e00).map((s) => s + s + s), masculine: wide(16, 0x7e00).map((s) => s + s + s) },
    });
    expect(textSize(l)).toBeLessThanOrEqual(LIMITS.budget);
    expect(l.consonants.length).toBeGreaterThan(0);
    expect(l.vowels.length).toBeGreaterThan(0);
  });
});

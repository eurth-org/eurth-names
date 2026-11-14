/**
 * What must hold for any language and any seed, checked on thousands of made-up languages.
 * The first of these is the tool's promise: no name ever holds a banned cluster.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { KINDS, allNames, generate, generateColumn, newDraw, reroll, type Draw } from '../src/names/generate';
import { languageAsJson, languageFromJson } from '../src/names/export';
import { linkFor, readLink, writeLink } from '../src/names/link';
import { LIMITS, affixMark, fold, sanitise, type Language } from '../src/names/model';
import { fromSection, toSection } from '../src/names/profile';
import { review } from '../src/names/review';
import { unwanted } from '../src/names/unwanted';
import { anyLanguage, anySeed } from './helpers';

const anyDraw: fc.Arbitrary<Draw> = fc.record({
  seed: anySeed,
  rolls: fc.record({ place: fc.integer({ min: 0, max: 9999 }), given: fc.integer({ min: 0, max: 9999 }), surname: fc.integer({ min: 0, max: 9999 }) }),
});

/** Every letter a language could put in a name: its sounds, its endings and its affixes. */
function lettersOf(l: Language): Set<string> {
  const pieces = [
    ...l.consonants.map((s) => s.spelling),
    ...l.vowels.map((s) => s.spelling),
    ...[...l.places.endings, ...l.given.feminine, ...l.given.masculine, ...l.given.either].map((e) => e.text),
    ...[l.surnames.patronymic, l.surnames.place, l.surnames.trade].flatMap((p) => p.affixes.map((a) => a.text)),
  ];
  return new Set(Array.from(pieces.join('').normalize('NFD')));
}

describe('for any language and any seed', () => {
  it('no name holds a banned cluster', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        for (const name of allNames(generate(language, draw))) {
          const folded = fold(name.text);
          for (const ban of language.banned) {
            if (folded.includes(ban)) throw new Error(`"${name.text}" holds the banned cluster "${ban}"`);
          }
        }
      }),
      { numRuns: 1500 },
    );
  });

  it('no name holds a banned cluster, in long columns of a language that bans a lot', () => {
    const tight = anyLanguage.map((l) => sanitise({ ...l, banned: [...l.banned, 'aa', 'ee', 'kt', 'tk', 'st', 'ar', 'in', 'ol', 'ra', 'ia'] }));
    fc.assert(
      fc.property(tight, anySeed, (language, seed) => {
        for (const kind of KINDS) {
          for (const name of generateColumn(language, kind, seed, 0, 40).names) {
            const folded = fold(name.text);
            for (const ban of language.banned) expect(folded.includes(ban), `${name.text} / ${ban}`).toBe(false);
          }
        }
      }),
      { numRuns: 300 },
    );
  });

  it('every name is built only from the language: its sounds, its endings and its affixes', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const letters = lettersOf(language);
        for (const name of allNames(generate(language, draw))) {
          for (const ch of Array.from(fold(name.text).normalize('NFD'))) {
            if (ch !== ' ' && !letters.has(ch)) throw new Error(`"${name.text}" has "${ch}", which the language doesn't`);
          }
        }
      }),
      { numRuns: 500 },
    );
  });

  it('the same language and draw give the same names', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const again = sanitise(JSON.parse(JSON.stringify(language)));
        expect(generate(again, { ...draw, rolls: { ...draw.rolls } })).toEqual(generate(language, draw));
      }),
      { numRuns: 300 },
    );
  });

  it('generating always finishes, with at most what was asked for and no name twice', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const batch = generate(language, draw);
        for (const kind of KINDS) {
          const column = batch[kind];
          expect(column.names.length).toBeLessThanOrEqual(column.wanted);
          const folded = column.names.map((n) => fold(n.text));
          expect(new Set(folded).size).toBe(folded.length);
          for (const n of column.names) {
            expect(n.kind).toBe(kind);
            expect(n.text).toBe(n.text.normalize('NFC'));
            expect(n.text.length).toBeGreaterThan(1);
            expect(unwanted(n.text)).toBe(false);
          }
        }
      }),
      { numRuns: 500 },
    );
  });

  it('re-rolling one column never touches the other two', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, fc.constantFrom(...KINDS), (language, draw, kind) => {
        const before = generate(language, draw);
        const after = generate(language, reroll(draw, kind));
        for (const other of KINDS) if (other !== kind) expect(after[other]).toEqual(before[other]);
      }),
      { numRuns: 200 },
    );
  });

  it('the review answers without throwing, and a clean bill means full columns', () => {
    fc.assert(
      fc.property(anyLanguage, (language) => {
        const notes = review(language);
        for (const note of notes) expect(note.message).toMatch(/^[A-Z"].*\.$/s);
        if (notes.every((n) => n.level !== 'problem')) {
          for (const kind of KINDS) expect(generateColumn(language, kind, 1).names.length).toBe(8);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe('for any language, the link', () => {
  it('brings back the same language and the same draw', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const read = readLink(writeLink({ language, draw }));
        expect(read.found).toBe('ok');
        expect(read.state).toEqual({ language, draw });
      }),
      { numRuns: 500 },
    );
  });

  it('gives the same names at the other end', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const { state } = readLink(new URL(linkFor({ language, draw })).search);
        expect(generate(state.language, state.draw)).toEqual(generate(language, draw));
      }),
      { numRuns: 200 },
    );
  });

  it('is plain ASCII and short enough for a nation profile', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const link = linkFor({ language, draw });
        expect(link).toMatch(/^https:\/\/[!-~]+$/);
        expect(link.length).toBeLessThanOrEqual(3900);
      }),
    );
  });

  it('fits even for a language at every limit, in letters that take four bytes each', () => {
    const wide = (n: number, at: number) => Array.from({ length: n }, (_, i) => String.fromCodePoint(at + i).repeat(4));
    const long = (n: number, at: number) => wide(n, at).map((s) => s + s + s.slice(0, 4));
    const language = sanitise({
      name: '"\\'.repeat(20),
      consonants: wide(40, 0x10428).map((s) => ({ spelling: s, weight: 99, start: 3, end: 3 })),
      vowels: wide(20, 0x104d8).map((s) => ({ spelling: s, weight: 99, start: 3, end: 3 })),
      shapes: ['CVCVCV', 'VCVCVC', 'CCVCCV', 'VVCCVV', 'CVVCVV', 'CCCVVV', 'VVVCCC', 'CVCCVC', 'VCCVCC', 'CCVVCC', 'VCVVCV', 'CVCVVC'].map((pattern) => ({ pattern, weight: 99 })),
      banned: long(120, 0x4e00),
      places: { endings: long(16, 0x5e00), bare: 100 },
      given: { gendered: true, feminine: long(16, 0x6e00), masculine: long(16, 0x7e00), either: long(16, 0x8e00), bare: 100 },
      surnames: {
        patronymic: { on: true, weight: 99, affixes: long(8, 0x3041).map((text) => ({ text, weight: 99, before: true, apart: true })) },
        place: { on: true, weight: 99, affixes: long(8, 0x30a1).map((text) => ({ text, weight: 99, before: true, apart: true })) },
        trade: { on: true, weight: 99, affixes: long(8, 0xac00).map((text) => ({ text, weight: 99, before: true, apart: true })) },
      },
    });
    const draw = { seed: 4294967295, rolls: { place: 9999, given: 9999, surname: 9999 } };
    const link = linkFor({ language, draw });
    expect(link.length).toBeLessThanOrEqual(3900);
    expect(readLink(link.slice(link.indexOf('?'))).state).toEqual({ language, draw });
    expect(language.consonants.length + language.vowels.length).toBeGreaterThan(0);
  });

  it('never throws, whatever the query string', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.webQueryParameters(), fc.string().map((s) => `d=1.${s}`), fc.string().map((s) => `p=${s}`)), (query) => {
        const read = readLink(query);
        expect(sanitise(read.state.language)).toEqual(read.state.language);
        expect(generate(read.state.language, read.state.draw)).toBeDefined();
      }),
      { numRuns: 500 },
    );
  });

  it('never throws, whatever JSON is packed into it', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const packed = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const read = readLink(`d=1.${packed}`);
        expect(sanitise(read.state.language)).toEqual(read.state.language);
        expect(Number.isInteger(read.state.draw.seed)).toBe(true);
      }),
      { numRuns: 300 },
    );
  });
});

describe('for any language, saving', () => {
  it('to a profile and back gives the same language and draw', () => {
    fc.assert(
      fc.property(anyLanguage, anyDraw, (language, draw) => {
        const section = toSection({ language, draw });
        expect(String(section.link).length).toBeLessThanOrEqual(4000);
        expect(String(section.summary).length).toBeLessThanOrEqual(600);
        expect(String(section.language).length).toBeLessThanOrEqual(80);
        expect(fromSection(JSON.parse(JSON.stringify(section)))).toEqual({ language, draw });
      }),
      { numRuns: 200 },
    );
  });

  it('to a language file and back gives the same language and seed', () => {
    fc.assert(
      fc.property(anyLanguage, anySeed, (language, seed) => {
        const loaded = languageFromJson(languageAsJson({ language, draw: newDraw(seed) }));
        expect(loaded).toEqual({ ok: true, state: { language, draw: newDraw(seed) } });
      }),
      { numRuns: 200 },
    );
  });

  it('never throws on a file of any JSON, and gives a language or a sentence', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.jsonValue().map((v) => JSON.stringify(v))), (text) => {
        const loaded = languageFromJson(text);
        if (loaded.ok) expect(sanitise(loaded.state.language)).toEqual(loaded.state.language);
        else expect(loaded.message).toMatch(/\.$/);
      }),
      { numRuns: 300 },
    );
  });
});

describe('the limits', () => {
  it('leave room: an affix mark is never longer than its text plus one', () => {
    fc.assert(
      fc.property(anyLanguage, (l) => {
        for (const p of [l.surnames.patronymic, l.surnames.place, l.surnames.trade]) for (const a of p.affixes) expect(affixMark(a).length).toBe(a.text.length + 1);
        expect(l.banned.length).toBeLessThanOrEqual(LIMITS.banned);
      }),
    );
  });
});

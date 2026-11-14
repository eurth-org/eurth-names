import { describe, expect, it } from 'vitest';
import { EXAMPLES, exampleById } from '../src/content/examples';
import { GLOSSARY, termById } from '../src/content/glossary';
import { FANTASY_NAME_GENERATORS, GUIDE_UPDATED, SOURCES, sourceById } from '../src/content/sources';
import { generateColumn } from '../src/names/generate';
import { fold, sanitise, toDraft } from '../src/names/model';
import { review } from '../src/names/review';
import { tradeWord } from '../src/names/generate';
import { mulberry32 } from '../src/names/random';
import { buildStem, prepare } from '../src/names/word';

const names = (id: string) => exampleById(id)!.names.map(fold);
const language = (id: string) => sanitise(exampleById(id)!.language);

describe("the guide's worked examples", () => {
  it('give exactly the names the guide prints', () => {
    for (const e of EXAMPLES) {
      const made = generateColumn(sanitise(e.language), e.kind, e.seed).names.map((n) => n.text);
      expect(made, e.id).toEqual(e.names);
      expect(e.names, e.id).toHaveLength(8);
    }
  });

  it('are written in the short forms, with nothing the generator has to correct', () => {
    for (const e of EXAMPLES) {
      const l = sanitise(e.language);
      expect(sanitise(toDraft(l)), e.id).toEqual(l);
      expect(review(l).filter((n) => n.level === 'problem'), e.id).toEqual([]);
      expect(e.title.length).toBeGreaterThan(5);
      expect(e.note).toMatch(/\.$/);
    }
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length);
  });

  it('palette: the same shapes and seed, with other sounds, give other names', () => {
    const soft = exampleById('palette-soft')!;
    const hard = exampleById('palette-hard')!;
    expect(sanitise(soft.language).shapes).toEqual(sanitise(hard.language).shapes);
    expect(soft.seed).toBe(hard.seed);
    expect(names('palette-soft').filter((n) => names('palette-hard').includes(n))).toEqual([]);
    for (const n of names('palette-soft')) expect(n).toMatch(/^[lnrsmtvkdaeiou]+$/);
    for (const n of names('palette-hard')) expect(n).toMatch(/^[krgtdnbmaeiou]+$/);
    for (const n of names('palette-hard')) expect(n).not.toMatch(/[lsv]/);
  });

  it('shapes: CV alone gives open syllables, CVC alone gives closed ones', () => {
    for (const n of names('shapes-open')) expect(n).toMatch(/^([lnrsmtkvd][aeiou])+$/);
    for (const n of names('shapes-closed')) expect(n).toMatch(/^([lnrsmtkvd][aeiou][lnrsmtkvd])+$/);
    expect(language('shapes-open').consonants).toEqual(language('shapes-closed').consonants);
    expect(exampleById('shapes-open')!.seed).toBe(exampleById('shapes-closed')!.seed);
  });

  it('weights: eight consonants in ten are drawn as the one weighted 80', () => {
    const p = prepare(language('weights'));
    const rng = mulberry32(1);
    let l = 0;
    for (let i = 0; i < 3000; i++) if (buildStem(p, rng, 1, 1, 'end')!.text === 'la') l++;
    expect(l / 3000).toBeCloseTo(0.8, 1);
    const printed = names('weights').join('');
    expect((printed.split('l').length - 1) / (printed.length / 2)).toBeGreaterThan(0.5);
  });

  it('banned: none of the four pairs turns up, though every name has consonants meeting', () => {
    for (const n of names('banned')) {
      expect(n).not.toMatch(/kt|tk|sr|rs/);
      expect(n).toMatch(/[ktsr]{2}/);
    }
    const without = sanitise({ ...exampleById('banned')!.language, banned: '' });
    const free = generateColumn(without, 'place', 5, 0, 40).names.map((n) => fold(n.text));
    expect(free.some((n) => /kt|tk|sr|rs/.test(n))).toBe(true);
  });

  it('edges: ng always follows a vowel, and h is always followed by one', () => {
    for (const n of [...names('edges'), ...generateColumn(language('edges'), 'place', 77, 0, 60).names.map((x) => fold(x.text))]) {
      expect(n, n).not.toMatch(/^ng|[^aio]ng/);
      expect(n, n).not.toMatch(/h$|h[^aio]/);
    }
    expect(names('edges').some((n) => n.includes('ng'))).toBe(true);
    expect(names('edges').some((n) => n.startsWith('h'))).toBe(true);
  });

  it('endings: every place ends in one of the three', () => {
    for (const n of names('endings')) expect(n).toMatch(/(holm|vin|ara)$/);
    expect(new Set(names('endings').map((n) => /(holm|vin|ara)$/.exec(n)![1])).size).toBe(3);
  });

  it('given: the ending carries the gender', () => {
    const made = generateColumn(language('given'), 'given', exampleById('given')!.seed).names;
    for (const n of made) expect(n.text).toMatch(n.gender === 'feminine' ? /i?a$/ : n.gender === 'masculine' ? /(o|ir)$/ : /in$/);
    expect(new Set(made.map((n) => n.gender))).toEqual(new Set(['feminine', 'masculine', 'either']));
  });

  it('surnames: all three patterns appear, and a trade keeps its word', () => {
    const l = language('surnames');
    const made = generateColumn(l, 'surname', exampleById('surnames')!.seed).names;
    expect(new Set(made.map((n) => n.how))).toEqual(new Set(['patronymic', 'place', 'trade']));
    for (const n of made) {
      if (n.how === 'patronymic') expect(n.text).toMatch(/sen$/);
      if (n.how === 'place') expect(n.text).toMatch(/^van [A-Z]\w+(holm|vin)$/);
      if (n.how === 'trade') expect(n.text).toMatch(/ar$/);
    }
    expect(tradeWord(l, 'weaver')).toBe('silil');
    expect(exampleById('surnames')!.names).toContain('Sililar');
  });
});

describe('the glossary', () => {
  it('has about forty terms, in alphabetical order, each with its own id', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(40);
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
    const terms = GLOSSARY.map((t) => t.term);
    expect(terms).toEqual([...terms].sort((a, b) => a.localeCompare(b, 'en')));
    for (const t of GLOSSARY) expect(t.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('defines each term in a sentence or two, and points only at terms that exist', () => {
    for (const t of GLOSSARY) {
      expect(t.definition.length, t.id).toBeGreaterThan(40);
      expect(t.definition.length, t.id).toBeLessThan(320);
      expect(t.definition, t.id).toMatch(/^[A-Z"].*\.$/);
      for (const id of t.see ?? []) {
        expect(termById(id), `${t.id} -> ${id}`).toBeDefined();
        expect(id).not.toBe(t.id);
      }
    }
  });

  it('covers the words the tool itself uses', () => {
    for (const id of ['sound-palette', 'syllable-shape', 'banned-cluster', 'weight', 'seed', 'ending', 'patronymic', 'place-surname', 'trade-surname', 'preset', 'phonotactics', 'leaning', 'hiatus']) expect(termById(id), id).toBeDefined();
  });
});

describe('the sources', () => {
  it('each say who, what and where, and why the guide uses them', () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    for (const s of SOURCES) {
      for (const text of [s.by, s.title, s.where, s.note]) expect(text.length).toBeGreaterThan(3);
      expect(s.note).toMatch(/\.$/);
      if (s.url) expect(s.url).toMatch(/^https:\/\/[a-z0-9.-]+\//);
    }
    expect(sourceById('wals-syllables')?.note).toContain('486');
    expect(GUIDE_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('send people to Fantasy Name Generators for lists by theme', () => {
    expect(FANTASY_NAME_GENERATORS).toEqual({ name: 'Fantasy Name Generators', url: 'https://www.fantasynamegenerators.com/' });
  });
});

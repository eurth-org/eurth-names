import { describe, expect, it } from 'vitest';
import { KINDS, PER_COLUMN, TRADES, allNames, allowed, generate, generateColumn, join, newDraw, reroll, tradeWord } from '../src/names/generate';
import { fold, sanitise, type Language } from '../src/names/model';
import { unwanted } from '../src/names/unwanted';
import { buildStem, fillable, holdsBan, prepare } from '../src/names/word';
import { mulberry32 } from '../src/names/random';
import { coastal } from './helpers';

const texts = (l: Language, kind: (typeof KINDS)[number], seed = 4471, roll = 0) => generateColumn(l, kind, seed, roll).names.map((n) => n.text);

describe('stems', () => {
  it('are built from the palette alone, in the shapes given', () => {
    const p = prepare(sanitise({ consonants: 'k t', vowels: 'a i', shapes: 'CV' }));
    const rng = mulberry32(1);
    for (let i = 0; i < 200; i++) {
      const stem = buildStem(p, rng, 2, 3, true)!;
      expect(stem.text).toMatch(/^([kt][ai]){2,3}$/);
      expect(stem.sounds.join('')).toBe(stem.text);
    }
  });

  it('follow the weights', () => {
    const p = prepare(sanitise({ consonants: 'k*90 t*10', vowels: 'a', shapes: 'CV' }));
    const rng = mulberry32(2);
    let k = 0;
    for (let i = 0; i < 2000; i++) if (buildStem(p, rng, 1, 1, true)!.text === 'ka') k++;
    expect(k / 2000).toBeCloseTo(0.9, 1);
  });

  it('leave out a sound switched off with weight 0', () => {
    const p = prepare(sanitise({ consonants: 'k t*0', vowels: 'a', shapes: 'CV' }));
    const rng = mulberry32(3);
    for (let i = 0; i < 100; i++) expect(buildStem(p, rng, 1, 3, true)!.text).not.toContain('t');
  });

  it('never start a word with a sound that never starts one, nor end with one that never ends one', () => {
    const p = prepare(sanitise({ consonants: 'ng^0 h$0 t', vowels: 'a', shapes: 'CVC' }));
    const rng = mulberry32(4);
    for (let i = 0; i < 300; i++) {
      const { text } = buildStem(p, rng, 1, 3, true)!;
      expect(text.startsWith('ng')).toBe(false);
      expect(text.endsWith('h')).toBe(false);
    }
  });

  it('leave the end leaning out of it when an ending follows', () => {
    const p = prepare(sanitise({ consonants: 'h$0', vowels: 'a', shapes: 'VC' }));
    const rng = mulberry32(5);
    expect(buildStem(p, rng, 1, 1, true)).toBeNull();
    expect(buildStem(p, rng, 1, 1, false)!.text).toBe('ah');
  });

  it('start and end more often with sounds that lean that way', () => {
    const p = prepare(sanitise({ consonants: 's^3 t^1', vowels: 'a', shapes: 'CV' }));
    const rng = mulberry32(6);
    let s = 0;
    for (let i = 0; i < 2000; i++) if (buildStem(p, rng, 1, 1, true)!.text === 'sa') s++;
    // 3 against 0.25: twelve in thirteen.
    expect(s / 2000).toBeCloseTo(12 / 13, 1);
  });

  it('never put the same sound twice in a row inside a cluster', () => {
    const p = prepare(sanitise({ consonants: 's t', vowels: 'a e', shapes: 'CCVV' }));
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) expect(buildStem(p, rng, 1, 1, true)!.text).toMatch(/^(st|ts)(ae|ea)$/);
  });

  it('keep banned clusters out, across syllables too', () => {
    const p = prepare(sanitise({ consonants: 'k t s r', vowels: 'a', shapes: 'CVC CV VC', banned: 'kt sr tk aa' }));
    const rng = mulberry32(8);
    for (let i = 0; i < 2000; i++) {
      const stem = buildStem(p, rng, 2, 4, true);
      if (stem) expect(stem.text).not.toMatch(/kt|sr|tk|aa/);
    }
  });

  it('know which shapes can be filled', () => {
    expect(fillable({ pattern: 'CV', weight: 10 }, 1, 1)).toBe(true);
    expect(fillable({ pattern: 'CV', weight: 10 }, 0, 1)).toBe(false);
    expect(fillable({ pattern: 'CCV', weight: 10 }, 1, 1)).toBe(false);
    expect(fillable({ pattern: 'CCV', weight: 10 }, 2, 1)).toBe(true);
    expect(fillable({ pattern: '', weight: 10 }, 2, 2)).toBe(false);
  });

  it('answer null rather than loop when nothing fits', () => {
    expect(buildStem(prepare(sanitise({})), mulberry32(1), 1, 3, true)).toBeNull();
    expect(buildStem(prepare(sanitise({ consonants: 'k', vowels: 'a', shapes: 'CV', banned: 'ka' })), mulberry32(1), 1, 3, true)).toBeNull();
  });
});

describe('a batch', () => {
  it('is 24 names: eight places, eight people, eight surnames', () => {
    const batch = generate(coastal(), newDraw(4471));
    expect(batch.place.names).toHaveLength(PER_COLUMN);
    expect(batch.given.names).toHaveLength(PER_COLUMN);
    expect(batch.surname.names).toHaveLength(PER_COLUMN);
    expect(allNames(batch)).toHaveLength(24);
    expect(batch.place.names.every((n) => n.kind === 'place')).toBe(true);
  });

  it('is the same every time for the same language and seed', () => {
    expect(generate(coastal(), newDraw(4471))).toEqual(generate(coastal(), newDraw(4471)));
  });

  it('changes with the seed', () => {
    expect(texts(coastal(), 'place', 1)).not.toEqual(texts(coastal(), 'place', 2));
  });

  it('has no name twice in a column', () => {
    for (const kind of KINDS) {
      const names = generateColumn(coastal(), kind, 11, 0, 60).names.map((n) => fold(n.text));
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('gives every name a capital', () => {
    for (const name of allNames(generate(coastal(), newDraw(5)))) expect(name.text).toMatch(/^(van )?[A-Z]/);
  });

  it('re-rolls one column and leaves the other two alone', () => {
    const l = coastal();
    const first = newDraw(4471);
    const second = reroll(first, 'given');
    expect(second.rolls).toEqual({ place: 0, given: 1, surname: 0 });
    const a = generate(l, first);
    const b = generate(l, second);
    expect(b.place).toEqual(a.place);
    expect(b.surname).toEqual(a.surname);
    expect(b.given).not.toEqual(a.given);
    expect(first.rolls.given).toBe(0);
  });

  it('makes more names for a longer column, starting with the same ones', () => {
    const l = coastal();
    expect(texts(l, 'place').slice(0, 8)).toEqual(generateColumn(l, 'place', 4471, 0, 20).names.slice(0, 8).map((n) => n.text));
  });
});

describe('places', () => {
  it('end in one of the place endings, or in none', () => {
    const l = sanitise({ consonants: 'k t', vowels: 'a', shapes: 'CVC', places: { endings: 'holm vin', bare: 0 } });
    for (const name of generateColumn(l, 'place', 3, 0, 20).names) {
      expect(name.text).toMatch(/(holm|vin)$/);
      expect(name.how).toBe('ending');
    }
    const bare = sanitise({ consonants: 'k t', vowels: 'a', shapes: 'CVC', places: { endings: 'holm', bare: 100 } });
    for (const name of generateColumn(bare, 'place', 3, 0, 20).names) {
      expect(name.text).not.toMatch(/holm$/);
      expect(name.how).toBe('stem');
    }
  });

  it('use the weights of the endings', () => {
    const l = sanitise({ consonants: 'k t s m n l', vowels: 'a e i o', shapes: 'CVC', places: { endings: 'holm*90 vin', bare: 0 } });
    const names = generateColumn(l, 'place', 3, 0, 200).names;
    const holm = names.filter((n) => n.text.endsWith('holm')).length;
    expect(holm / names.length).toBeGreaterThan(0.8);
  });

  it('drop the stem vowel where it would meet the vowel of an ending', () => {
    const p = prepare(sanitise({ vowels: 'a e i o u ae' }));
    expect(join(p, 'kitu', 'ia')).toBe('kitia');
    expect(join(p, 'kitae', 'ara')).toBe('kitara');
    expect(join(p, 'kitu', 'holm')).toBe('kituholm');
    expect(join(p, 'kit', 'ia')).toBe('kitia');
    expect(join(p, 'a', 'ia')).toBe('aia');
  });
});

describe('given names', () => {
  it('say which list their ending came from, in a language with gender', () => {
    const l = sanitise({ consonants: 'k t', vowels: 'e', shapes: 'CVC', given: { gendered: true, feminine: 'a', masculine: 'o', either: 'in', bare: 0 } });
    const names = generateColumn(l, 'given', 9, 0, 40).names;
    expect(new Set(names.map((n) => n.gender))).toEqual(new Set(['feminine', 'masculine', 'either']));
    for (const n of names) expect(n.text).toMatch(n.gender === 'feminine' ? /a$/ : n.gender === 'masculine' ? /o$/ : /in$/);
  });

  it('carry no gender in a language without it', () => {
    const l = sanitise({ consonants: 'k t', vowels: 'e', shapes: 'CVC', given: { gendered: false, feminine: 'a', masculine: 'o', either: 'in', bare: 0 } });
    for (const n of generateColumn(l, 'given', 9, 0, 20).names) {
      expect(n.gender).toBeUndefined();
      expect(n.text).toMatch(/in$/);
    }
  });

  it('carry no gender when neither list has an ending to mark it', () => {
    const l = sanitise({ consonants: 'k t', vowels: 'e', shapes: 'CVC', given: { gendered: true, either: 'in' } });
    for (const n of generateColumn(l, 'given', 9).names) expect(n.gender).toBeUndefined();
  });
});

describe('surnames', () => {
  const base = { consonants: 'k t s m n l r', vowels: 'a e i o', shapes: 'CVC CV', places: { endings: 'holm', bare: 0 }, given: { either: 'in', bare: 0 } };
  const only = (pattern: string, affixes: string) => sanitise({ ...base, surnames: { [pattern]: { on: true, affixes } } });

  it('are plain stems when no pattern is on', () => {
    for (const n of generateColumn(sanitise(base), 'surname', 1).names) expect(n.how).toBe('stem');
  });

  it('build patronymics on a given name of the same language', () => {
    for (const n of generateColumn(only('patronymic', '-sen'), 'surname', 1).names) {
      expect(n.how).toBe('patronymic');
      expect(n.from).toMatch(/in$/);
      expect(n.text).toBe(`${n.from}sen`);
    }
  });

  it('put an affix before the name, with one capital', () => {
    for (const n of generateColumn(only('patronymic', 'mac-'), 'surname', 1).names) expect(n.text).toBe(`Mac${n.from!.toLowerCase()}`);
  });

  it('keep the capital of the name after an apostrophe', () => {
    for (const n of generateColumn(only('patronymic', "o'-"), 'surname', 1).names) expect(n.text).toBe(`O'${n.from}`);
  });

  it('build place surnames on a place name, with a particle as a word of its own', () => {
    for (const n of generateColumn(only('place', 'van_'), 'surname', 1).names) {
      expect(n.how).toBe('place');
      expect(n.from).toMatch(/holm$/);
      expect(n.text).toBe(`van ${n.from}`);
    }
    for (const n of generateColumn(only('place', '_dal'), 'surname', 1).names) expect(n.text).toBe(`${n.from} dal`);
  });

  it('use the bare name when a pattern has no affixes', () => {
    for (const n of generateColumn(only('place', ''), 'surname', 1).names) expect(n.text).toBe(n.from);
  });

  it('build trade surnames on the language\'s own word for the trade', () => {
    const l = only('trade', '-er');
    const names = generateColumn(l, 'surname', 1, 0, 12).names;
    expect(names.length).toBeGreaterThan(4);
    for (const n of names) {
      expect(n.how).toBe('trade');
      expect(TRADES).toContain(n.meaning);
      const word = tradeWord(l, n.meaning!)!;
      expect(fold(n.text)).toBe(join(prepare(l), word, 'er'));
    }
  });

  it('give a trade the same word whatever the seed', () => {
    const a = coastal();
    const b = coastal();
    for (const trade of TRADES) expect(tradeWord(a, trade)).toBe(tradeWord(b, trade));
    expect(new Set(TRADES.map((t) => tradeWord(a, t))).size).toBeGreaterThan(12);
  });

  it('mix the patterns by their weights', () => {
    const l = sanitise({ ...base, surnames: { patronymic: { on: true, weight: 90, affixes: '-sen' }, place: { on: true, weight: 10, affixes: 'van_' }, trade: { on: false, weight: 99 } } });
    const names = generateColumn(l, 'surname', 1, 0, 100).names;
    const how = (h: string) => names.filter((n) => n.how === h).length;
    expect(how('trade')).toBe(0);
    expect(how('patronymic')).toBeGreaterThan(how('place') * 3);
  });
});

describe('what never comes out', () => {
  it('a banned cluster, where an ending joins on', () => {
    const l = sanitise({ consonants: 'k t', vowels: 'a', shapes: 'CVC', banned: 'kh th', places: { endings: 'holm', bare: 0 } });
    // Every stem ends in k or t, and both are banned before the h of -holm.
    expect(generateColumn(l, 'place', 1).names).toEqual([]);
  });

  it('a banned cluster, in any column of a busy language', () => {
    const l = sanitise({ ...JSON.parse(JSON.stringify(coastal())), banned: 'ar in se ol nv mh ns' });
    const p = prepare(l);
    for (let seed = 0; seed < 40; seed++) {
      for (const name of allNames(generate(l, newDraw(seed)))) expect(holdsBan(name.text, p.banned), name.text).toBe(false);
    }
  });

  it('an ending that holds a banned cluster itself', () => {
    const l = sanitise({ consonants: 'k t', vowels: 'a', shapes: 'CV', banned: 'ol', places: { endings: 'holm vin', bare: 0 } });
    expect(prepare(l).placeEndings.map((e) => e.text)).toEqual(['vin']);
    for (const n of generateColumn(l, 'place', 1).names) expect(n.text).toMatch(/vin$/);
  });

  it('a sound that is banned outright', () => {
    const l = sanitise({ consonants: 'k th', vowels: 'a', shapes: 'CV', banned: 'th' });
    expect(prepare(l).consonants.map((s) => s.spelling)).toEqual(['k']);
  });

  it('a word from the short list nobody wants', () => {
    expect(unwanted('Shitara')).toBe(true);
    expect(unwanted('Selunna')).toBe(false);
    const l = sanitise({ consonants: 'sh t', vowels: 'i', shapes: 'CVC' });
    expect(allowed(prepare(l), 'Shit')).toBe(false);
    for (let seed = 0; seed < 30; seed++) for (const n of generateColumn(l, 'place', seed).names) expect(unwanted(n.text)).toBe(false);
  });
});

describe('a language that cannot fill a column', () => {
  it('gives the names it can and stops', () => {
    const l = sanitise({ consonants: 'k', vowels: 'a i', shapes: 'CV', length: { place: [1, 1] }, places: { bare: 100 } });
    const column = generateColumn(l, 'place', 1);
    expect(column.names.map((n) => n.text).sort()).toEqual(['Ka', 'Ki']);
    expect(column.wanted).toBe(8);
  });

  it('gives nothing, quickly, when it has nothing to give', () => {
    const batch = generate(sanitise({}), newDraw(1));
    expect(allNames(batch)).toEqual([]);
  });
});

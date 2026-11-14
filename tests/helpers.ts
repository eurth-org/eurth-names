import fc from 'fast-check';
import { sanitise, type Language } from '../src/names/model';

/** A small, well-behaved language for tests that need one. */
export const coastal = (): Language =>
  sanitise({
    name: 'Test coast',
    consonants: 'l*16 n*16 r*14 s*12 m*12 t k*8 v*8 d*6 p*4',
    vowels: 'a*20 e*14 i*12 o*8 u*6 ae*3',
    shapes: 'CV*60 CVC*25 V*8 VC*7',
    banned: 'aa ee ii oo uu kt sr',
    places: { endings: 'vin holm ara mar', bare: 30 },
    given: { gendered: true, feminine: 'a ia el', masculine: 'o an ir', either: 'in', bare: 20 },
    surnames: {
      patronymic: { on: true, weight: 10, affixes: "-sen mac- o'-" },
      place: { on: true, weight: 10, affixes: 'van_ -er' },
      trade: { on: true, weight: 10, affixes: '-in -ar' },
    },
  });

// Letters for made-up languages: a few plain ones (so that clusters repeat and bans bite), and
// some that test case, composition and scripts.
const plain = fc.constantFrom(...'aeioubdgklmnprstvz');
const awkward = fc.constantFrom(...'äéßıİσςǆﬁøæþñ가가яж', "'", 'é', 'A', 'TH', 'ʼ');
const letter = fc.oneof({ weight: 8, arbitrary: plain }, { weight: 1, arbitrary: awkward });
const spelling = fc.array(letter, { minLength: 1, maxLength: 3 }).map((a) => a.join(''));
const weight = fc.integer({ min: 0, max: 99 });
const leaning = fc.integer({ min: 0, max: 3 });
const sound = fc.record({ spelling, weight, start: leaning, end: leaning });
const shape = fc.record({ pattern: fc.stringMatching(/^[CV]{1,5}$/), weight });
const ending = fc.record({ text: fc.array(letter, { minLength: 1, maxLength: 5 }).map((a) => a.join('')), weight });
const affix = fc.record({ text: fc.array(letter, { minLength: 1, maxLength: 4 }).map((a) => a.join('')), weight, before: fc.boolean(), apart: fc.boolean() });
const span = fc.tuple(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 4 }));
const pattern = fc.record({ on: fc.boolean(), weight, affixes: fc.array(affix, { maxLength: 4 }) });

/** Any language at all, already through sanitise(). Bans are short and plenty, so they bite. */
export const anyLanguage: fc.Arbitrary<Language> = fc
  .record({
    name: fc.string({ maxLength: 20 }),
    consonants: fc.array(sound, { maxLength: 12 }),
    vowels: fc.array(sound, { maxLength: 8 }),
    shapes: fc.array(shape, { maxLength: 5 }),
    banned: fc.array(fc.array(letter, { minLength: 1, maxLength: 3 }).map((a) => a.join('')), { maxLength: 14 }),
    length: fc.record({ place: span, given: span, surname: span }),
    places: fc.record({ endings: fc.array(ending, { maxLength: 5 }), bare: fc.integer({ min: 0, max: 100 }) }),
    given: fc.record({
      gendered: fc.boolean(),
      feminine: fc.array(ending, { maxLength: 4 }),
      masculine: fc.array(ending, { maxLength: 4 }),
      either: fc.array(ending, { maxLength: 4 }),
      bare: fc.integer({ min: 0, max: 100 }),
    }),
    surnames: fc.record({ patronymic: pattern, place: pattern, trade: pattern }),
  })
  .map(sanitise);

export const anySeed = fc.integer({ min: 0, max: 0xffffffff });

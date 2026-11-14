import { describe, expect, it } from 'vitest';
import { sanitise } from '../src/names/model';
import { canGenerate, review } from '../src/names/review';
import { coastal } from './helpers';

const ids = (draft: Record<string, unknown>) => review(sanitise(draft)).map((n) => `${n.level}:${n.id}`);
const base = { consonants: 'k t s m n l r', vowels: 'a e i o', shapes: 'CV CVC' };

describe('the review of a language', () => {
  it('has nothing to say about a sound one', () => {
    expect(review(coastal())).toEqual([]);
    expect(canGenerate(coastal())).toBe(true);
  });

  it('asks for vowels and shapes first', () => {
    expect(ids({})).toEqual(['problem:no-vowels', 'problem:no-shapes']);
    expect(ids({ consonants: 'k', shapes: 'CV' })).toContain('problem:no-vowels');
    expect(ids({ consonants: 'k', vowels: 'a' })).toEqual(['problem:no-shapes']);
    expect(canGenerate(sanitise({}))).toBe(false);
  });

  it('counts a sound switched off as not there', () => {
    expect(ids({ consonants: 'k', vowels: 'a*0', shapes: 'CV' })).toContain('problem:no-vowels');
  });

  it('notes sounds that a banned cluster rules out', () => {
    const notes = review(sanitise({ ...base, consonants: 'k t s m n l r th', banned: 'th' }));
    expect(notes).toEqual([{ id: 'banned-sound', level: 'note', message: '"th" is a sound of this language, but a banned cluster rules it out, so it never appears.' }]);
  });

  it('notes shapes that cannot be filled', () => {
    const notes = review(sanitise({ consonants: 'k', vowels: 'a e i o u', shapes: 'CV CCV', length: { place: [3, 3], given: [3, 3], surname: [3, 3] } }));
    expect(notes).toEqual([{ id: 'shape-unfillable', level: 'note', message: 'The shape "CCV" can\'t be filled: two consonants or two vowels side by side need at least two to choose from.' }]);
    expect(ids({ consonants: 'k', vowels: 'a', shapes: 'CCV' })).toEqual(['problem:shape-unfillable']);
  });

  it('notes endings and affixes that hold a banned cluster', () => {
    const notes = review(sanitise({ ...base, banned: 'ol se', places: { endings: 'holm vin' }, given: { either: 'ol' }, surnames: { patronymic: { on: true, affixes: '-sen -ko' } } }));
    expect(notes.map((n) => n.message)).toEqual(['"-holm" and "-ol" hold banned clusters, so they are left out.', '"-sen" holds a banned cluster, so no surname is made with it.']);
  });

  it('notes gender with nothing to mark it', () => {
    expect(ids({ ...base, given: { gendered: true, either: 'in' } })).toEqual(['note:gender-unmarked']);
  });

  it('notes vowels that have to meet after all', () => {
    expect(ids({ consonants: 'k t s m', vowels: 'a e i o', shapes: 'V VC' })).toContain('note:vowels-must-meet');
    expect(ids({ consonants: 'k t s m', vowels: 'a e i o', shapes: 'V VC', vowelsMeet: true })).not.toContain('note:vowels-must-meet');
  });

  it('says which column a tight language cannot fill', () => {
    const notes = review(sanitise({ consonants: 'k', vowels: 'a i', shapes: 'CV', length: { place: [1, 1], given: [2, 3], surname: [2, 3] }, places: { bare: 100 } }));
    expect(notes).toEqual([{ id: 'few-place', level: 'problem', message: 'This language can only make 2 of the 8 places asked for. Add sounds or shapes, allow longer names, or ban less.' }]);
    expect(ids({ consonants: 'k', vowels: 'a', shapes: 'CV', banned: 'ka' })).toEqual(['problem:none-place', 'problem:none-given', 'problem:none-surname']);
  });

  it('notes a language of vowels only without calling it broken', () => {
    expect(ids({ vowels: 'a e i o u ai ou', shapes: 'V CV', vowelsMeet: true, length: { place: [2, 4], given: [2, 4], surname: [2, 4] } })).toEqual(['note:no-consonants', 'note:shape-unfillable']);
  });
});

import { describe, expect, it } from 'vitest';
import { generate, newDraw } from '../src/names/generate';
import { defaultState, linkFor, presetOf, readLink, writeLink } from '../src/names/link';
import { sanitise } from '../src/names/model';
import { PRESETS, presetById } from '../src/names/presets';
import { coastal } from './helpers';

const pack = (value: unknown, version = 1) => `d=${version}.${btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;

describe('the link', () => {
  it('is a few characters for an untouched preset', () => {
    const steppe = presetById('steppe')!;
    expect(writeLink({ language: steppe.language, draw: newDraw(4471) })).toBe('p=1.steppe.4471');
    expect(writeLink({ language: steppe.language, draw: { seed: 4471, rolls: { place: 0, given: 2, surname: 1 } } })).toBe('p=1.steppe.4471.0-2-1');
    expect(linkFor(defaultState())).toBe('https://names.eurth.org/?p=1.coastal.4471');
  });

  it('reads the short form back', () => {
    for (const p of PRESETS) {
      const state = { language: p.language, draw: { seed: 77, rolls: { place: 3, given: 0, surname: 12 } } };
      expect(readLink(writeLink(state))).toEqual({ state, found: 'ok' });
      expect(presetOf(p.language)).toBe(p);
    }
  });

  it('takes the query with or without its question mark, or as parameters', () => {
    const want = { language: presetById('north')!.language, draw: newDraw(9) };
    expect(readLink('?p=1.north.9').state).toEqual(want);
    expect(readLink('p=1.north.9').state).toEqual(want);
    expect(readLink(new URLSearchParams('p=1.north.9&utm=x')).state).toEqual(want);
  });

  it('writes the full form once a preset has been changed', () => {
    const changed = sanitise({ ...JSON.parse(JSON.stringify(presetById('coastal')!.language)), banned: 'kt sr' });
    expect(presetOf(changed)).toBeUndefined();
    const query = writeLink({ language: changed, draw: newDraw(4471) });
    expect(query).toMatch(/^d=1\.[A-Za-z0-9_-]+$/);
    expect(query.length).toBeLessThan(700);
    expect(readLink(query)).toEqual({ state: { language: changed, draw: newDraw(4471) }, found: 'ok' });
  });

  it('gives the same names at both ends', () => {
    const state = { language: coastal(), draw: { seed: 4471, rolls: { place: 1, given: 0, surname: 5 } } };
    const there = readLink(new URL(linkFor(state)).search).state;
    expect(generate(there.language, there.draw)).toEqual(generate(state.language, state.draw));
  });

  it('opens on the first preset when there is nothing in the link', () => {
    for (const query of ['', '?', '?utm_source=forum', null, undefined]) expect(readLink(query)).toEqual({ state: defaultState(), found: 'none' });
  });

  it('says so when a link is broken, and still gives a language', () => {
    const broken = ['p=', 'p=1.coastal', 'p=1.nowhere.5', 'p=1.COASTAL.5', 'p=0.coastal.5', 'p=1.coastal.5.1-2', 'p=1.coastal.99999999999', 'd=', 'd=1.!!!', 'd=1.e30x', 'd=x.e30', 'd=0.e30', pack([1, 2]), pack('text'), pack(null), `d=1.${'A'.repeat(9000)}`];
    for (const query of broken) expect(readLink(query), query).toEqual({ state: defaultState(), found: 'broken' });
  });

  it('says so when a link comes from a newer version', () => {
    expect(readLink('p=2.coastal.5').found).toBe('newer');
    expect(readLink(pack({}, 2)).found).toBe('newer');
  });

  it('clamps whatever a full link holds', () => {
    const read = readLink(pack({ n: '<b>x</b>', c: 'K! T', v: 9, h: 'cv', y: [9, 0, 'a'], p: ['<i>-holm', 500], g: ['yes'], s: 'no', d: [-4, 1e9, 'x'] }));
    expect(read.found).toBe('ok');
    const l = read.state.language;
    expect(l.name).toBe('bx/b');
    expect(l.consonants.map((s) => s.spelling)).toEqual(['k', 't']);
    expect(l.vowels).toEqual([]);
    expect(l.shapes).toEqual([{ pattern: 'CV', weight: 10 }]);
    expect(l.length.place).toEqual({ min: 6, max: 6 });
    expect(l.places).toEqual({ endings: [{ text: 'iholm', weight: 10 }], bare: 100 });
    expect(l.given.gendered).toBe(false);
    expect(l.surnames.trade.on).toBe(false);
    expect(read.state.draw).toEqual({ seed: 4471, rolls: { place: 9999, given: 0, surname: 0 } });
  });

  it('prefers the full form when a link has both', () => {
    const state = { language: coastal(), draw: newDraw(3) };
    expect(readLink(`p=1.north.9&${writeLink(state)}`).state).toEqual(state);
  });

  it('keeps vowels meeting in the link only when they do', () => {
    const meeting = sanitise({ ...JSON.parse(JSON.stringify(coastal())), vowelsMeet: true });
    const read = (query: string) => JSON.parse(atob(query.slice(4).replace(/-/g, '+').replace(/_/g, '/')));
    expect(read(writeLink({ language: meeting, draw: newDraw(1) })).m).toBe(1);
    expect('m' in read(writeLink({ language: coastal(), draw: newDraw(1) }))).toBe(false);
    expect(readLink(writeLink({ language: meeting, draw: newDraw(1) })).state.language.vowelsMeet).toBe(true);
  });
});

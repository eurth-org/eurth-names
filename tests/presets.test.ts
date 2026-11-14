import { describe, expect, it } from 'vitest';
import { KINDS, allNames, generate, newDraw } from '../src/names/generate';
import { LIMITS, sanitise } from '../src/names/model';
import { DEFAULT_PRESET, PRESETS, presetById } from '../src/names/presets';
import { review } from '../src/names/review';

describe('the presets', () => {
  it('are eight, each with its own id', () => {
    expect(PRESETS).toHaveLength(8);
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(8);
    for (const p of PRESETS) expect(p.id).toMatch(/^[a-z]{3,12}$/);
    expect(DEFAULT_PRESET.id).toBe('coastal');
    expect(presetById('steppe')?.title).toBe('Long-vowelled steppe');
    expect(presetById('nope')).toBeUndefined();
    expect(presetById(7)).toBeUndefined();
  });

  it('are described by feel, never named after a real language or people', () => {
    // "Latinate" is the brief's own word for the imperial feel, so it is the one exception.
    const real = /\b(english|french|german|norse|viking|latin\b|roman|greek|arab|persian|turk|mongol|slav|russian|celt|gael|welsh|irish|scot|finn|japan|chin|hawai|maori|polynes|elv|dwarv|ork)\w*\b/i;
    for (const p of PRESETS) {
      for (const text of [p.id, p.title, p.feel, p.about, p.language.name]) expect(text, text).not.toMatch(real);
      expect(p.about.length).toBeGreaterThan(60);
      expect(p.about).toMatch(/\.$/);
    }
  });

  it('are written within the limits, so nothing is cut off', () => {
    for (const p of PRESETS) {
      const l = p.language;
      expect(sanitise(l)).toEqual(l);
      expect(l.consonants.length).toBeLessThan(LIMITS.consonants);
      expect(l.vowels.length).toBeLessThan(LIMITS.vowels);
      expect(l.banned.length).toBeLessThan(LIMITS.banned);
      expect(l.shapes.length).toBeGreaterThan(1);
      for (const list of [l.places.endings, l.given.feminine, l.given.masculine, l.given.either]) expect(list.length).toBeLessThan(LIMITS.endings);
    }
  });

  it('pass their own review, with nothing to note', () => {
    for (const p of PRESETS) expect(review(p.language), p.id).toEqual([]);
  });

  it('fill all three columns, for a hundred seeds each', () => {
    for (const p of PRESETS) {
      for (let seed = 0; seed < 100; seed++) {
        const batch = generate(p.language, newDraw(seed));
        for (const kind of KINDS) expect(batch[kind].names.length, `${p.id} ${seed} ${kind}`).toBe(8);
      }
    }
  });

  it('sound different from one another', () => {
    const first = PRESETS.map((p) => allNames(generate(p.language, newDraw(1))).map((n) => n.text));
    for (let i = 0; i < first.length; i++) for (let j = i + 1; j < first.length; j++) expect(first[i]!.filter((name) => first[j]!.includes(name))).toEqual([]);
  });

  it('use every surname pattern', () => {
    for (const p of PRESETS) {
      const how = new Set<string>();
      for (let seed = 0; seed < 20; seed++) for (const n of generate(p.language, newDraw(seed)).surname.names) how.add(n.how);
      expect([...how].sort(), p.id).toEqual(['patronymic', 'place', 'trade']);
    }
  });

  // The names a link gives must never change. These are the first batches of every preset at
  // its own seed; if this fails, the generator has changed and every shared link with it. Don't
  // update the snapshot: keep version 1 as it was and give the new way a new link version.
  it('give the same first batch as the day they were released', () => {
    const batches = Object.fromEntries(
      PRESETS.map((p) => {
        const batch = generate(p.language, newDraw(p.seed));
        return [`${p.id} ${p.seed}`, { places: batch.place.names.map((n) => n.text), people: batch.given.names.map((n) => n.text), surnames: batch.surname.names.map((n) => n.text) }];
      }),
    );
    expect(batches).toMatchSnapshot();
  });
});

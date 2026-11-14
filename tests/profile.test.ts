import { describe, expect, it } from 'vitest';
import { generate, newDraw, allNames } from '../src/names/generate';
import { summarise } from '../src/names/describe';
import { defaultState, linkFor } from '../src/names/link';
import { fromSection, picksOf, toSection } from '../src/names/profile';
import { coastal } from './helpers';

const state = () => ({ language: coastal(), draw: newDraw(4471) });

describe('the names section of a profile', () => {
  it('is small: the link, a summary and the name of the language', () => {
    const section = toSection(state());
    expect(Object.keys(section)).toEqual(['link', 'summary', 'language']);
    expect(section.link).toBe(linkFor(state()));
    expect(section.summary).toBe(summarise(coastal()));
    expect(section.language).toBe('Test coast');
  });

  it('carries the palette, the word parts and the seed in its link', () => {
    expect(fromSection(toSection(state()))).toEqual(state());
    expect(fromSection(toSection(defaultState()))).toEqual(defaultState());
  });

  it('adds picked names only when asked', () => {
    const picks = picksOf(allNames(generate(coastal(), newDraw(4471))).filter((_, i) => i % 8 === 0));
    expect(picks.places).toHaveLength(1);
    expect(picks.people).toHaveLength(1);
    expect(picks.surnames).toHaveLength(1);
    const section = toSection(state(), { picks });
    expect(section.places).toEqual(picks.places);
    expect(section.people).toEqual(picks.people);
    expect(section.surnames).toEqual(picks.surnames);
    expect('places' in toSection(state())).toBe(false);
    expect('places' in toSection(state(), { picks: null })).toBe(false);
  });

  it('keeps what the loaded section already held, known or not', () => {
    const previous = { link: 'https://names.eurth.org/?p=1.north.1', updated: '2026-11-06T11:15:00.000Z', places: ['Haldermouth', 'Wynmere'], people: ['Ysolde'], future: { kept: true } };
    const section = toSection(state(), { previous });
    expect(section.future).toEqual({ kept: true });
    expect(section.updated).toBe('2026-11-06T11:15:00.000Z');
    expect(section.places).toEqual(['Haldermouth', 'Wynmere']);
    expect(section.link).toBe(linkFor(state()));
    expect(previous.link).toBe('https://names.eurth.org/?p=1.north.1');
  });

  it('adds picks to the lists that are there, without repeats', () => {
    const previous = { places: ['Haldermouth', 'Wynmere', 7, ''], surnames: 'not a list' };
    const section = toSection(state(), { previous, picks: { places: ['Wynmere', 'Selunna'], people: ['Teomir'], surnames: ['Varenko'] } });
    expect(section.places).toEqual(['Haldermouth', 'Wynmere', 'Selunna']);
    expect(section.people).toEqual(['Teomir']);
    expect(section.surnames).toEqual(['Varenko']);
  });

  it('keeps the lists within the profile\'s limits, newest names first to stay', () => {
    const old = Array.from({ length: 200 }, (_, i) => `Old${i}`);
    const section = toSection(state(), { previous: { places: old }, picks: { places: ['New', 'x'.repeat(100)], people: [], surnames: [] } });
    const places = section.places as string[];
    expect(places).toHaveLength(200);
    expect(places[0]).toBe('Old2');
    expect(places[198]).toBe('New');
    expect(places[199]).toHaveLength(80);
  });

  it('calls a language without a name "Unnamed"', () => {
    const l = { ...coastal(), name: '' };
    expect(toSection({ language: l, draw: newDraw(1) }).language).toBe('Unnamed');
  });

  it('reads nothing from a section without a link of its own', () => {
    const places = ['Haldermouth'];
    for (const section of [null, undefined, 'text', [], {}, { places }, { link: 7 }, { link: 'https://names.eurth.org/' }, { link: 'https://names.eurth.org/#example-calderwyn' }, { link: 'https://evil.example/?p=1.coastal.1' }, { link: 'https://names.eurth.org.evil.example/?p=1.coastal.1' }, { link: 'https://names.eurth.org/?p=1.nowhere.1' }, { link: `https://names.eurth.org/?d=1.${'A'.repeat(5000)}` }]) {
      expect(fromSection(section), JSON.stringify(section)).toBeNull();
    }
  });

  it('follows a link with other things in it', () => {
    expect(fromSection({ link: 'https://names.eurth.org/?ref=card&p=1.island.8080#top' })?.draw.seed).toBe(8080);
  });
});

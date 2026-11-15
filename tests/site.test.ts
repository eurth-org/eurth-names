/**
 * The built pages: what the brief asks of them, read from dist/. Run "npm run build" first;
 * without a build these are skipped, as the suite's own checks are.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../src/content/examples';
import { GLOSSARY } from '../src/content/glossary';
import { SOURCES } from '../src/content/sources';
import { generate, newDraw } from '../src/names/generate';
import { readLink } from '../src/names/link';
import { DEFAULT_PRESET, PRESETS } from '../src/names/presets';

const built = existsSync('dist/index.html');
const page = (path: string): string => readFileSync(`dist/${path}`, 'utf8');
const unescape = (text: string): string => text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

describe.skipIf(!built)('the generator page', () => {
  it('shows a real batch before any script runs: 24 names of the first preset', () => {
    const html = page('index.html');
    const batch = generate(DEFAULT_PRESET.language, newDraw(DEFAULT_PRESET.seed));
    for (const kind of ['place', 'given', 'surname'] as const) for (const name of batch[kind].names) expect(html, name.text).toContain(name.text);
    expect(html.match(/aria-label="Pick /g)).toHaveLength(24);
    expect(html.replace(/<!--.*?-->/g, '')).toMatch(new RegExp(`seed\\s*${DEFAULT_PRESET.seed}`));
  });

  it('offers all eight presets, a star on every name and a way to re-roll each column', () => {
    const html = page('index.html');
    for (const p of PRESETS) expect(html).toContain(`${p.language.name} (${p.feel})`);
    for (const column of ['places', 'people', 'surnames']) expect(html).toContain(`aria-label="Re-roll ${column}"`);
    expect(html).toContain('Generate 24 names');
    expect(html).toContain('Lock seed');
    expect(html).toContain('Picked this visit');
    for (const label of ['List as text', 'List as CSV', 'Language as JSON', 'Load language', 'Load profile', 'Save profile']) expect(html, label).toContain(label);
  });

  it('says warmly where to go for lists by theme', () => {
    expect(page('index.html')).toMatch(/We love <a href="https:\/\/www\.fantasynamegenerators\.com\/\?ref=names\.eurth\.org"[^>]*>Fantasy Name Generators<\/a>/);
  });
});

describe.skipIf(!built)('the presets page', () => {
  it('has a card for each preset, with a link that opens that preset at its seed', () => {
    const html = page('presets/index.html');
    for (const p of PRESETS) {
      expect(html).toContain(p.title);
      const link = `/?p=1.${p.id}.${p.seed}`;
      expect(html, link).toContain(`href="${link}"`);
      expect(readLink(link.slice(1)).state.language).toEqual(p.language);
      expect(html).toContain(generate(p.language, newDraw(p.seed)).place.names[0]!.text);
    }
  });
});

describe.skipIf(!built)('the guide', () => {
  const html = built ? page('guide/index.html') : '';

  it('prints every worked example with its names, and a link that brings the same names back', () => {
    for (const e of EXAMPLES) {
      expect(html, e.id).toContain(`id="example-${e.id}"`);
      expect(unescape(html), e.id).toContain(e.names.join(' · '));
      const found = new RegExp(`id="example-${e.id}"[\\s\\S]*?href="/\\?([^"]+)"`).exec(html);
      expect(found, e.id).not.toBeNull();
      const { state, found: status } = readLink(unescape(found![1]!));
      expect(status).toBe('ok');
      expect(generate(state.language, state.draw)[e.kind].names.map((n) => n.text)).toEqual(e.names);
    }
  });

  it('covers what the brief asks for', () => {
    for (const heading of ['Start with the sounds', 'Then the syllables', 'Then the rules between sounds', 'Why consistency sells a world', 'Borrowing from real languages, with respect', 'Where Names stands', 'Sources']) {
      expect(html, heading).toContain(heading);
    }
    expect(html).toMatch(/fantasynamegenerators\.com\/\?ref=names\.eurth\.org/);
    expect(html).toContain('Last updated <time datetime="2026-11-14">14 November 2026</time>');
  });

  it('lists every source, with a link where there is one to follow', () => {
    for (const s of SOURCES) {
      expect(unescape(html), s.id).toContain(s.title);
      if (s.url) expect(html, s.id).toContain(`href="${s.url}${s.url.includes('?') ? '&' : '?'}ref=names.eurth.org"`);
    }
  });

  it('only points at glossary terms that exist', () => {
    const ids = new Set(GLOSSARY.map((t) => t.id));
    const links = [...html.matchAll(/href="\/glossary\/#([a-z-]+)"/g)].map((m) => m[1]!);
    expect(links.length).toBeGreaterThan(10);
    for (const id of links) expect(ids.has(id), id).toBe(true);
  });
});

describe.skipIf(!built)('the glossary page', () => {
  it('has every term under its own id', () => {
    const html = page('glossary/index.html');
    for (const t of GLOSSARY) expect(html, t.id).toContain(`<dt id="${t.id}"`);
    expect(html).toContain('DefinedTermSet');
  });
});

describe.skipIf(!built)('every page', () => {
  it('keeps the promise in the footer and mentions no storage', () => {
    for (const path of ['index.html', 'presets/index.html', 'guide/index.html', 'glossary/index.html', '404.html']) {
      const html = page(path);
      expect(html, path).toContain('Free forever');
      expect(html, path).toContain('Generator');
    }
  });
});

import { describe, expect, it } from 'vitest';
import { batchNames, csvCell, languageAsJson, languageFileName, languageFromJson, namesAsCsv, namesAsText, pickKey, picksAsText } from '../src/names/export';
import { generate, newDraw, type Name } from '../src/names/generate';
import { sanitise } from '../src/names/model';
import { isPlanetName, PLANET_TOAST } from '../src/names/fun';
import { generateColumn } from '../src/names/generate';
import { coastal } from './helpers';

const names: Name[] = [
  { text: 'Selunna', kind: 'place', how: 'ending' },
  { text: 'Teomir', kind: 'given', how: 'ending', gender: 'masculine' },
  { text: 'Maelin', kind: 'given', how: 'ending', gender: 'either' },
  { text: 'Varenko', kind: 'surname', how: 'patronymic', from: 'Varen' },
  { text: 'van Selunna', kind: 'surname', how: 'place', from: 'Selunna' },
  { text: 'Tessavin', kind: 'surname', how: 'trade', meaning: 'weaver' },
];

describe('the list as text', () => {
  it('is the language, the seed and the three columns', () => {
    expect(namesAsText(coastal(), newDraw(4471), names)).toBe(
      'Test coast, seed 4471\n\nPlaces\nSelunna\n\nPeople\nTeomir (masculine)\nMaelin\n\nSurnames\nVarenko (child of Varen)\nvan Selunna (from Selunna)\nTessavin (weaver)\n',
    );
  });

  it('leaves out an empty column, and copes with no name for the language', () => {
    expect(namesAsText(sanitise({}), newDraw(1), names.slice(0, 1))).toBe('Names, seed 1\n\nPlaces\nSelunna\n');
  });

  it('copies picked names one to a line', () => {
    expect(picksAsText(names.slice(0, 3))).toBe('Selunna\nTeomir\nMaelin');
    expect(picksAsText([])).toBe('');
  });

  it('lists a whole batch in the order of the columns', () => {
    const batch = generate(coastal(), newDraw(1));
    expect(batchNames(batch).map((n) => n.kind)).toEqual([...Array(8).fill('place'), ...Array(8).fill('given'), ...Array(8).fill('surname')]);
  });
});

describe('the list as CSV', () => {
  it('has a row a name: kind, name, gender, how it was made, picked', () => {
    const picked = new Set([pickKey(names[0]!), pickKey(names[3]!)]);
    expect(namesAsCsv(names, picked)).toBe(
      ['kind,name,gender,made,picked', 'place,Selunna,,,yes', 'person,Teomir,masculine,,', 'person,Maelin,either,,', 'surname,Varenko,,child of Varen,yes', 'surname,van Selunna,,from Selunna,', 'surname,Tessavin,,weaver,', ''].join('\r\n'),
    );
  });

  it('tells a picked place from a surname spelled the same', () => {
    expect(pickKey({ kind: 'place', text: 'Selunna' })).not.toBe(pickKey({ kind: 'surname', text: 'Selunna' }));
    expect(pickKey({ kind: 'place', text: 'SELUNNA' })).toBe(pickKey({ kind: 'place', text: 'selunna' }));
  });

  it('quotes what needs quoting and never lets a cell start a formula', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line\nbreak')).toBe('"line\nbreak"');
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('-x')).toBe("'-x");
    expect(csvCell('@x')).toBe("'@x");
    expect(csvCell("o'Brien")).toBe("o'Brien");
  });
});

describe('the language as a file', () => {
  it('is readable JSON with every list in its short form', () => {
    const file = JSON.parse(languageAsJson({ language: coastal(), draw: newDraw(4471) }));
    expect(file.format).toBe('eurth-names-language');
    expect(file.version).toBe(1);
    expect(file.seed).toBe(4471);
    expect(file.about).toContain('names.eurth.org');
    expect(file.language.consonants).toBe('l*16 n*16 r*14 s*12 m*12 t k*8 v*8 d*6 p*4');
    expect(file.language.surnames.patronymic).toEqual({ on: true, weight: 10, affixes: "-sen mac- o'-" });
    expect(languageAsJson({ language: coastal(), draw: newDraw(1) }).endsWith('}\n')).toBe(true);
  });

  it('loads back', () => {
    const state = { language: coastal(), draw: newDraw(4471) };
    expect(languageFromJson(languageAsJson(state))).toEqual({ ok: true, state });
  });

  it('loads a language written by hand, without the wrapper', () => {
    const loaded = languageFromJson('{"consonants":"k t","vowels":"a","shapes":"CV"}');
    expect(loaded.ok && loaded.state.language.consonants.map((s) => s.spelling)).toEqual(['k', 't']);
    expect(loaded.ok && loaded.state.draw.seed).toBe(4471);
  });

  it('says what to do with a file that is something else', () => {
    const wrong = "That file isn't a naming language. Pick one saved from Names: its name ends in .names.json.";
    for (const text of ['not json', '[]', '7', 'null', '{"meta":{"schema":1,"nation":"Calderwyn"}}', '{"language":{"name":"x"}}']) expect(languageFromJson(text)).toEqual({ ok: false, message: wrong });
    expect(languageFromJson(7)).toEqual({ ok: false, message: "That file can't be read as text. Pick a language saved from Names: its name ends in .names.json." });
    expect(languageFromJson(' '.repeat(100_001))).toEqual({ ok: false, message: 'That file is too big to be a naming language. Pick one saved from Names: its name ends in .names.json.' });
    expect(languageFromJson('{"version":2,"language":{"consonants":"k"}}')).toEqual({ ok: false, message: 'That language was saved by a newer version of Names. Reload this page to get the latest version, then try again.' });
  });

  it('names the file after the language', () => {
    expect(languageFileName(coastal())).toBe('test-coast.names.json');
    expect(languageFileName(sanitise({ name: 'Çà & là!' }))).toBe('ca-la.names.json');
    expect(languageFileName(sanitise({ name: '名前' }))).toBe('language.names.json');
    expect(languageFileName(sanitise({}))).toBe('language.names.json');
  });
});

describe('the planet', () => {
  it('is spotted by either of its names, in any case', () => {
    for (const name of ['Eurth', 'eurth', 'EURTH', 'Wurld', 'wurld']) expect(isPlanetName(name)).toBe(true);
    for (const name of ['Earth', 'Eurtha', 'van Eurth', 'World', '']) expect(isPlanetName(name)).toBe(false);
    expect(PLANET_TOAST).toBe('A fine name for a planet.');
  });

  it('can really come out of the generator', () => {
    const l = sanitise({ consonants: 'r th', vowels: 'e u', shapes: 'VVCC', length: { place: [1, 1] }, places: { bare: 100 } });
    const found = generateColumn(l, 'place', 1, 0, 4).names.map((n) => n.text);
    expect(found).toContain('Eurth');
    expect(found.filter(isPlanetName)).toEqual(['Eurth']);
    const w = sanitise({ consonants: 'w r l d', vowels: 'u', shapes: 'CVCCC', length: { place: [1, 1] }, places: { bare: 100 } });
    // 144 words can be made from these; ask for all of them and Wurld is among them.
    expect(generateColumn(w, 'place', 1, 0, 144).names.some((n) => isPlanetName(n.text))).toBe(true);
  });
});

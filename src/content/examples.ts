/**
 * The guide's worked examples: small languages, each showing one idea, with the names they
 * give. The guide page shows them and the tests run them, so the guide can never claim
 * something the generator doesn't do.
 *
 * `names` are what the generator gives for `language`, `kind` and `seed`, written out so the
 * guide's prose can point at them. tests/examples.test.ts fails if they drift apart.
 */
import type { Kind } from '../names/generate';

export interface WorkedExample {
  id: string;
  /** What it shows, as a heading in the guide. */
  title: string;
  /** One or two sentences under the names. */
  note: string;
  /** The language, in the short written form the generator's text boxes use. */
  language: Record<string, unknown>;
  kind: Kind;
  seed: number;
  names: string[];
}

const sounds = { consonants: 'l n r s m t k v d', vowels: 'a e i o u' };

export const EXAMPLES: readonly WorkedExample[] = [
  {
    id: 'palette-soft',
    title: 'A soft palette',
    note: 'Nine consonants, most of them l, n, r, s and m, and five vowels. Nothing else has been decided yet, and it already sounds like somewhere.',
    language: { name: 'Soft', consonants: 'l*16 n*16 r*14 s*12 m*12 t*6 v*6 k*4 d*4', vowels: 'a*20 e*14 i*12 o*8 u*5', shapes: 'CV*70 CVC*30', banned: 'nm mn lr rl sr', places: { bare: 100 } },
    kind: 'place',
    seed: 8,
    names: ['Minimo', 'Vanimo', 'Mamu', 'Rodi', 'Telat', 'Nevosde', 'Nunasa', 'Misile'],
  },
  {
    id: 'palette-hard',
    title: 'A hard palette',
    note: 'The same syllable shapes and the same seed, with the consonants swapped for k, g, t, d and r. Only the palette changed, and it is a different country.',
    language: { name: 'Hard', consonants: 'k*16 r*16 g*12 t*12 d*12 n*8 b*6 m*4', vowels: 'a*18 o*14 u*10 e*6 i*4', shapes: 'CV*70 CVC*30', banned: 'kg gk td dt bd db gd dg tk kt gb bg', places: { bare: 100 } },
    kind: 'place',
    seed: 8,
    names: ['Dukudu', 'Barude', 'Dadi', 'Gumu', 'Nokan', 'Ronetmo', 'Rirata', 'Tutuko'],
  },
  {
    id: 'shapes-open',
    title: 'Open syllables only',
    note: 'One shape, CV: a consonant, then a vowel. Every syllable ends in a vowel, so every name does too.',
    language: { name: 'Open', ...sounds, shapes: 'CV', places: { bare: 100 } },
    kind: 'place',
    seed: 13,
    names: ['Laredo', 'Dumuke', 'Tavila', 'Kide', 'Taduni', 'Masu', 'Votima', 'Nedo'],
  },
  {
    id: 'shapes-closed',
    title: 'Closed syllables',
    note: 'The same sounds and the same seed with one shape, CVC. Every syllable now ends in a consonant, consonants meet in the middle of a name, and the names turn heavy.',
    language: { name: 'Closed', ...sounds, shapes: 'CVC', banned: 'nm mn lr rl sr tl dl vl vn vm kn km tn tm dn dm', length: { place: [1, 2] }, places: { bare: 100 } },
    kind: 'place',
    seed: 13,
    names: ['Talned', 'Sev', 'Kevdak', 'Salkir', 'Sutdud', 'Das', 'Ril', 'Vetvot'],
  },
  {
    id: 'weights',
    title: 'Weights',
    note: 'Three consonants and one vowel, with l weighted at 80 and k and t at 10 each. Eight consonants in ten are drawn as an l. A list never repeats a name, so k and t get a little more of the page than that.',
    language: { name: 'Weighted', consonants: 'l*80 k t', vowels: 'a', shapes: 'CV', length: { place: [3, 3] }, places: { bare: 100 } },
    kind: 'place',
    seed: 3,
    names: ['Lalata', 'Lakala', 'Lalala', 'Tatala', 'Latala', 'Kalala', 'Latata', 'Kalata'],
  },
  {
    id: 'banned',
    title: 'Banned clusters',
    note: 'The syllables are all CVC, so wherever two of them meet, two consonants meet. The pairs kt, tk, sr and rs are banned, and none of them ever turns up, inside a name or across a join.',
    language: { name: 'Banned', consonants: 'k t s r', vowels: 'a o', shapes: 'CVC', banned: 'kt tk sr rs', length: { place: [2, 2] }, places: { bare: 100 } },
    kind: 'place',
    seed: 5,
    names: ['Sotrot', 'Sakros', 'Tastos', 'Rastat', 'Katrat', 'Rottor', 'Koskat', 'Korkas'],
  },
  {
    id: 'edges',
    title: 'Sounds with a place of their own',
    note: 'Here ng never starts a word and h never ends one, as in English. Inside a word they keep to the same sides: ng always follows a vowel, and h is always followed by one.',
    language: { name: 'Edges', consonants: 'ng*30^0 h*30$0 t k m', vowels: 'a i o', shapes: 'CVC*60 CV*40', length: { place: [2, 2] }, places: { bare: 100 } },
    kind: 'place',
    seed: 10,
    names: ['Hamam', 'Kami', 'Hati', 'Tamang', 'Honghi', 'Kahing', 'Hotko', 'Hohing'],
  },
  {
    id: 'endings',
    title: 'Place endings',
    note: 'Three endings, and no place without one. After two or three of these you know a town when you see one, which is exactly what a real map teaches you to do.',
    language: { name: 'Endings', consonants: 'l*16 n*16 r*14 s*12 m*12 t*6 v*6 k*4 d*4', vowels: 'a*20 e*14 i*12 o*8 u*5', shapes: 'CV*70 CVC*30', banned: 'nm mn lr rl sr', places: { endings: 'holm vin ara', bare: 0 } },
    kind: 'place',
    seed: 22,
    names: ['Kenara', 'Rolaholm', 'Lunara', 'Sataholm', 'Linamara', 'Kikavin', 'Tesara', 'Netara'],
  },
  {
    id: 'given',
    title: 'Given names, with and without gender',
    note: 'Feminine names end in -a or -ia, masculine ones in -o or -ir, and -in is for either. The ending carries the gender, so the stems can be anything the language allows.',
    language: { name: 'Given', consonants: 'l*16 n*16 r*14 s*12 m*12 t*6 v*6 k*4 d*4', vowels: 'a*20 e*14 i*12 o*8 u*5', shapes: 'CV*70 CVC*30', banned: 'nm mn lr rl sr', given: { gendered: true, feminine: 'a ia', masculine: 'o ir', either: 'in', bare: 0 } },
    kind: 'given',
    seed: 32,
    names: ['Nelin', 'Ranunir', 'Laso', 'Ranir', 'Sinilir', 'Vesir', 'Teda', 'Rulna'],
  },
  {
    id: 'surnames',
    title: 'Three ways to make a surname',
    note: "A parent's name with -sen, a place with the particle van, or a trade with -ar. The trade words belong to the language: whoever its weavers are, they share a name.",
    language: {
      name: 'Surnames',
      consonants: 'l*16 n*16 r*14 s*12 m*12 t*6 v*6 k*4 d*4',
      vowels: 'a*20 e*14 i*12 o*8 u*5',
      shapes: 'CV*70 CVC*30',
      banned: 'nm mn lr rl sr',
      places: { endings: 'holm vin', bare: 0 },
      given: { either: 'in o a', bare: 0 },
      surnames: { patronymic: { on: true, affixes: '-sen' }, place: { on: true, affixes: 'van_' }, trade: { on: true, affixes: '-ar' } },
    },
    kind: 'surname',
    seed: 45,
    names: ['Veknosen', 'Sililar', 'Mesar', 'Letrasen', 'Sovakasen', 'van Nanevholm', 'Tatirar', 'Nirimosen'],
  },
];

export const exampleById = (id: string): WorkedExample | undefined => EXAMPLES.find((e) => e.id === id);

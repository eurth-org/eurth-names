/**
 * The glossary: the words the tool and the guide use, in a sentence or two each. The page
 * lists them in alphabetical order and gives the set to search engines as a DefinedTermSet.
 */
export interface Term {
  /** For links: lower case, hyphens. */
  id: string;
  term: string;
  definition: string;
  /** Ids of terms worth reading next. */
  see?: string[];
}

export const GLOSSARY: readonly Term[] = [
  { id: 'affix', term: 'Affix', definition: 'A piece added to a word to make another: a prefix before it, a suffix after it. The -sen of Teomirsen is an affix.', see: ['prefix', 'suffix'] },
  { id: 'banned-cluster', term: 'Banned cluster', definition: 'A run of letters a language never allows, such as kt or sr. In Names a banned cluster never appears in any name: not inside a word, not across two syllables, not where an ending joins on.', see: ['cluster', 'phonotactics'] },
  { id: 'closed-syllable', term: 'Closed syllable', definition: 'A syllable that ends in a consonant, like the "tal" of Talned. Languages with many closed syllables sound heavier and more clipped.', see: ['open-syllable', 'coda'] },
  { id: 'cluster', term: 'Cluster', definition: 'Two or more consonants in a row with no vowel between them, like the "str" of street. Which clusters a language allows is a large part of how it sounds.', see: ['banned-cluster', 'phonotactics'] },
  { id: 'coda', term: 'Coda', definition: 'The consonants that close a syllable, after the vowel: the "lm" of holm. Many languages allow no coda at all.', see: ['onset', 'nucleus'] },
  { id: 'conlang', term: 'Conlang', definition: 'A constructed language: one that somebody made on purpose, from a few names to a full grammar and dictionary.', see: ['naming-language'] },
  { id: 'consonant', term: 'Consonant', definition: 'A sound made by narrowing or closing the mouth somewhere: p, t, k, s, m, l. In a syllable shape it is written C.', see: ['vowel', 'syllable-shape'] },
  { id: 'demonym', term: 'Demonym', definition: 'The word for the people of a place: a Calderwynian is from Calderwyn. Usually the place name with an ending.', see: ['toponym'] },
  { id: 'digraph', term: 'Digraph', definition: 'Two letters that spell one sound, like sh, th or ae. In Names a digraph is typed as one sound and is never split.', see: ['spelling'] },
  { id: 'diphthong', term: 'Diphthong', definition: 'A vowel that glides from one quality to another within a single syllable, like the "ai" of Kai. Typed as one vowel, it counts as one.', see: ['vowel', 'hiatus'] },
  { id: 'elision', term: 'Elision', definition: 'Dropping a sound where two words or parts meet. When an ending that starts with a vowel joins a stem that ends in one, the stem gives up its vowel: Kitu and -ia make Kitia.', see: ['hiatus', 'ending'] },
  { id: 'ending', term: 'Ending', definition: 'A fixed piece at the end of a name that tells you what kind of name it is: -holm for a place, -a for a woman. A handful of endings does more for consistency than anything else.', see: ['suffix', 'stem'] },
  { id: 'endonym', term: 'Endonym', definition: 'The name a people use for their own place or language, as opposed to what outsiders call it. Deutschland is an endonym; Germany is not.', see: ['exonym'] },
  { id: 'exonym', term: 'Exonym', definition: "A name for a place or people used by outsiders, in the outsiders' language. Your nation's neighbours will have one for it, built from their sounds.", see: ['endonym'] },
  { id: 'fricative', term: 'Fricative', definition: 'A consonant made by forcing air through a narrow gap, so that it hisses or buzzes: f, s, sh, v, z, th. A language rich in fricatives sounds soft or breathy.', see: ['stop'] },
  { id: 'geminate', term: 'Geminate', definition: 'A consonant held for twice as long, usually written double: the "nn" of Selunna. Some languages are full of them, and others ban them.', see: ['banned-cluster'] },
  { id: 'given-name', term: 'Given name', definition: 'The name a person is given at birth, as opposed to the one they inherit. Also called a first or personal name, though not every culture puts it first.', see: ['surname'] },
  { id: 'glottal-stop', term: 'Glottal stop', definition: "The catch in the throat in the middle of uh-oh. Often written with an apostrophe, as in Ha'ari, which is why Names lets an apostrophe be a sound.", see: ['stop'] },
  { id: 'hiatus', term: 'Hiatus', definition: 'Two vowels side by side in separate syllables, as in the "ea" of Leah. Names keeps vowels apart between syllables unless the language lets them meet.', see: ['diphthong', 'elision'] },
  { id: 'leaning', term: 'Leaning', definition: 'How a sound behaves at the edges of a word in Names: it can start or end a word never, seldom, as usual or often. A sound that never starts a word always follows a vowel; one that never ends a word is always followed by one.', see: ['phonotactics'] },
  { id: 'liquid', term: 'Liquid', definition: 'The l and r sounds. They flow, they combine easily with other consonants, and a language that leans on them sounds smooth.', see: ['nasal'] },
  { id: 'matronymic', term: 'Matronymic', definition: "A name built on the mother's given name, the counterpart of a patronymic.", see: ['patronymic'] },
  { id: 'naming-language', term: 'Naming language', definition: 'Just enough of an invented language to name things with: its sounds, how they combine, and a few word parts. No grammar is needed. The term comes from the conlanging community.', see: ['conlang', 'sound-palette'] },
  { id: 'nasal', term: 'Nasal', definition: 'A consonant made with air through the nose: m, n, ng. Nearly every language has at least one.', see: ['liquid'] },
  { id: 'nucleus', term: 'Nucleus', definition: 'The heart of a syllable, almost always a vowel. The onset comes before it and the coda after.', see: ['onset', 'coda'] },
  { id: 'onset', term: 'Onset', definition: 'The consonants that open a syllable, before the vowel: the "st" of stone.', see: ['coda', 'nucleus'] },
  { id: 'open-syllable', term: 'Open syllable', definition: 'A syllable that ends in a vowel, like every syllable of Laredo. A language of open syllables only sounds light and easy to sing.', see: ['closed-syllable'] },
  { id: 'particle', term: 'Particle', definition: 'A small word of its own that links a name to what it comes from: the "van" of van Selunna, the "de" of de Valona.', see: ['place-surname', 'affix'] },
  { id: 'patronymic', term: 'Patronymic', definition: "A name built on the father's given name, usually with an affix: Teomirsen, child of Teomir. In some cultures it changes every generation, and in others it has frozen into a family name.", see: ['matronymic', 'surname'] },
  { id: 'phoneme', term: 'Phoneme', definition: 'One of the sounds a language treats as distinct, so that swapping it changes the word: the p and b of pat and bat. A sound palette is a list of phonemes, written however you like to spell them.', see: ['sound-palette'] },
  { id: 'phonology', term: 'Phonology', definition: 'The sound system of a language: which sounds it has and how they behave together.', see: ['phoneme', 'phonotactics'] },
  { id: 'phonotactics', term: 'Phonotactics', definition: 'The rules for which sounds may sit where and next to what. English allows "str" at the start of a word and never "ng"; those are phonotactic rules. They matter more to how a language feels than its list of sounds does.', see: ['banned-cluster', 'leaning', 'syllable-shape'] },
  { id: 'place-surname', term: 'Place-based surname', definition: 'A surname taken from where a family came from or lived: van Selunna, Milevinano. Name scholars call these locative or toponymic surnames.', see: ['particle', 'toponym'] },
  { id: 'prefix', term: 'Prefix', definition: 'An affix that goes before the word: the "mac" of Macbror.', see: ['suffix', 'affix'] },
  { id: 'preset', term: 'Preset', definition: 'One of the eight ready-made palettes in Names, each described by how it feels. A starting point to change, not a finished language.', see: ['sound-palette'] },
  { id: 'romanisation', term: 'Romanisation', definition: 'Writing a language in the Latin alphabet when it has, or would have, a script of its own. Every name you type for an invented nation is a romanisation, so its spelling is yours to choose.', see: ['spelling', 'digraph'] },
  { id: 'seed', term: 'Seed', definition: 'The number that decides which names a language gives. The same language and the same seed always give the same names, which is how a shared link shows everyone the same list.' },
  { id: 'sound-palette', term: 'Sound palette', definition: 'Everything a naming language is made from: its consonants and vowels with their weights, its syllable shapes and its banned clusters.', see: ['phoneme', 'weight', 'syllable-shape'] },
  { id: 'spelling', term: 'Spelling', definition: 'How a sound is written. Names works with spellings, not phonetic symbols: type "sh" or "kh" or "ae" as you want it to appear in a name.', see: ['digraph', 'romanisation'] },
  { id: 'stem', term: 'Stem', definition: 'The body of a name, built from the sound palette, before any ending or affix is added. In Selunaholm the stem is Seluna.', see: ['ending', 'affix'] },
  { id: 'stop', term: 'Stop', definition: 'A consonant that blocks the air completely for a moment and then lets go: p, t, k, b, d, g. Also called a plosive. A language heavy with stops sounds hard and percussive.', see: ['fricative', 'glottal-stop'] },
  { id: 'suffix', term: 'Suffix', definition: 'An affix that goes after the word: the -sen of Teomirsen, the -holm of Rolaholm.', see: ['prefix', 'ending'] },
  { id: 'surname', term: 'Surname', definition: "A name shared by a family and passed down. Most began as one of four things: a relative's name, a place, a trade or a nickname.", see: ['patronymic', 'place-surname', 'trade-surname'] },
  { id: 'syllable', term: 'Syllable', definition: 'A beat of a word: a vowel with the consonants that lean on it. Se-lun-na has three.', see: ['onset', 'nucleus', 'coda'] },
  { id: 'syllable-shape', term: 'Syllable shape', definition: 'A pattern for a syllable, written with C for a consonant and V for a vowel: CV, CVC, VC, CCV. The shapes a language allows, and how often it uses each, set its rhythm.', see: ['syllable', 'open-syllable', 'closed-syllable'] },
  { id: 'toponym', term: 'Toponym', definition: 'A place name. Toponyms tend to be compounds: a stem and an ending that once meant something plain, such as farm, ford or hill.', see: ['ending', 'demonym'] },
  { id: 'trade-surname', term: 'Trade-based surname', definition: "A surname taken from an occupation: Smith, Miller, Weaver. In Names each language has its own word for each trade, so its smiths share a name. Name scholars call these occupational surnames.", see: ['surname'] },
  { id: 'vowel', term: 'Vowel', definition: 'A sound made with the mouth open and the voice running: a, e, i, o, u. In a syllable shape it is written V.', see: ['consonant', 'diphthong'] },
  { id: 'weight', term: 'Weight', definition: 'How common a sound, a shape or an ending is, from 0 to 99. A sound with weight 20 turns up twice as often as one with weight 10; weight 0 switches it off without deleting it.', see: ['sound-palette'] },
];

export const termById = (id: string): Term | undefined => GLOSSARY.find((t) => t.id === id);

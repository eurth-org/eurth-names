/**
 * What the guide rests on. Books are given by title, author and year; pages that can be read
 * online have their address. Checked on the day in GUIDE_UPDATED.
 */
export interface Source {
  id: string;
  /** Who wrote it. */
  by: string;
  title: string;
  /** Publisher and year, or the site it is on. */
  where: string;
  /** Only for sources that are free to read online. */
  url?: string;
  /** What the guide takes from it. */
  note: string;
}

/** The day the guide and its sources were last checked, as an ISO date. */
export const GUIDE_UPDATED = '2026-11-14';

export const SOURCES: readonly Source[] = [
  {
    id: 'lck',
    by: 'Mark Rosenfelder',
    title: 'The Language Construction Kit',
    where: 'zompist.com, since 1996; in print from Yonagu Books, 2010',
    url: 'https://www.zompist.com/kit.html',
    note: 'The classic starting point for invented languages, and for the idea of a naming language: just enough of a language to name things with.',
  },
  {
    id: 'peterson',
    by: 'David J. Peterson',
    title: 'The Art of Language Invention',
    where: 'Penguin Books, 2015',
    note: 'Sounds, syllables and word-building from a working language creator, with the reasoning behind each choice.',
  },
  {
    id: 'wals-consonants',
    by: 'Ian Maddieson',
    title: 'Consonant Inventories',
    where: 'chapter 1 of The World Atlas of Language Structures Online',
    url: 'https://wals.info/chapter/1',
    note: 'How many consonants languages have: from 6 (Rotokas) to 122 (!Xóõ), with a typical size in the low twenties.',
  },
  {
    id: 'wals-vowels',
    by: 'Ian Maddieson',
    title: 'Vowel Quality Inventories',
    where: 'chapter 2 of The World Atlas of Language Structures Online',
    url: 'https://wals.info/chapter/2',
    note: 'How many vowel qualities languages have: from 2 to 14, most often 5, a little under 6 on average.',
  },
  {
    id: 'wals-syllables',
    by: 'Ian Maddieson',
    title: 'Syllable Structure',
    where: 'chapter 12 of The World Atlas of Language Structures Online',
    url: 'https://wals.info/chapter/12',
    note: 'CV is the one syllable every language seems to have. Of 486 languages, 61 allow nothing more than (C)V, 274 are moderately complex and 151 complex.',
  },
  {
    id: 'ladefoged',
    by: 'Peter Ladefoged and Keith Johnson',
    title: 'A Course in Phonetics',
    where: 'Cengage, 7th edition, 2014',
    note: 'The standard introduction to how speech sounds are made and described.',
  },
  {
    id: 'ipa',
    by: 'International Phonetic Association',
    title: 'The International Phonetic Alphabet chart',
    where: 'internationalphoneticassociation.org',
    url: 'https://www.internationalphoneticassociation.org/content/full-ipa-chart',
    note: 'Every sound a language can use, on one page. Useful for seeing which sounds sit close together.',
  },
  {
    id: 'tolkien',
    by: 'J.R.R. Tolkien',
    title: 'A Secret Vice',
    where: 'a lecture of 1931; in The Monsters and the Critics and Other Essays, George Allen & Unwin, 1983',
    note: 'On the pleasure of fitting sound to sense, by the writer who built his names first and his world around them.',
  },
  {
    id: 'kepn',
    by: 'Institute for Name-Studies, University of Nottingham',
    title: 'Key to English Place-Names',
    where: 'kepn.nottingham.ac.uk',
    url: 'https://kepn.nottingham.ac.uk/',
    note: 'What the pieces of English place names mean: -ton, -ham, -by, -thorpe and the rest.',
  },
  {
    id: 'fanbi',
    by: 'Patrick Hanks, Richard Coates and Peter McClure',
    title: 'The Oxford Dictionary of Family Names in Britain and Ireland',
    where: 'Oxford University Press, 2016',
    note: 'Where surnames come from: a relative, a place, an occupation or a nickname.',
  },
  {
    id: 'lcs',
    by: 'Language Creation Society',
    title: 'Resources for language creators',
    where: 'conlang.org',
    url: 'https://conlang.org/',
    note: 'The community of people who make languages, with advice on doing it well.',
  },
];

/** The site Names is glad to send people to for lists by theme. */
export const FANTASY_NAME_GENERATORS = { name: 'Fantasy Name Generators', url: 'https://www.fantasynamegenerators.com/' } as const;

export const sourceById = (id: string): Source | undefined => SOURCES.find((s) => s.id === id);

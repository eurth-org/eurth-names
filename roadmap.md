# Roadmap

Names gives a nation one consistent naming language, at names.eurth.org: you set the sounds once, and every place, person and family comes out sounding like the same country. It is door 3 of Eurth's 2026 advent calendar and opens on 12 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026.** The brief is saved, the repository exists, and this plan is written. Nothing is built. The plan is waiting for Stijn's go-ahead; the next step is Phase 1, step 1.

Waiting on others:

- **@eurth/style 1.0.0** is not released. On GitHub the repository holds only its brief: no HANDBOOK.md, starter template or tag. Phase 2 can't start until it is: check `gh release list -R eurth-org/eurth-style`. The handbook's rules are in that brief (eurth-style's CLAUDE.md), and this plan follows them.
- **@eurth/profile 1.0.0** is not released. Its draft `names` section holds a link, a summary, the language's name and three lists of picked names (`places`, `people`, `surnames`, 200 each, 80 characters a name). It has no fields for the sound palette, word parts or seed. It allows extra keys, so Names will add `palette`, `parts` and `seed` there (see Phase 1, step 8). Ask Foundations to document those keys.

Assumptions to confirm (none of them blocks step 1):

- **24 at a time** means 8 places, 8 people and 8 surnames, in the mock-up's three columns.
- **The first page is called "Generator"**, as the brief says; the mock-up's header says "Maker" and has no Presets link.
- **"Lock seed"**, not the mock-up's "Lock sounds": with the seed locked, changing a sound redraws the same 24 draws, so you can hear what the change did.
- **Sounds are typed as you'd spell them** ("ae", "th", "sh" count as one sound each). No phonetic alphabet is needed to use the tool; the guide explains the link between the two.
- **The eight presets** (see step 10).

## Next

### Phase 1: the engine and the words (needs nothing from @eurth/style)

Plain TypeScript in `src/names/`, tests in `tests/`, as Flagwright keeps its engine in `src/flag/`. Only TypeScript, Vitest and fast-check (for the property tests) are installed. Commit and push after each step.

1. **Model** (`model.ts`): a language is a name, a sound palette, word parts and a seed.
   - Sound: its spelling (one to four letters), a weight, and how it leans at the start and at the end of a word (never, seldom, as usual, often).
   - Palette: consonants, vowels, syllable shapes (a pattern of C and V such as CV, CVC, VC, CCV, each with a weight), banned clusters, and how many syllables a place, a given name and a surname may have.
   - Word parts: place endings; given-name endings in three lists (feminine, masculine, either), or gender switched off; surname patterns, each on or off with its own affixes: patronymic (a given name plus an affix, before or after), place-based (a place name plus an affix or a particle), trade-based (a trade word plus an ending).
   - Everything that arrives from a link or a file is checked and clamped: 40 consonants, 20 vowels, 12 shapes, 60 banned clusters and 24 endings a list at most; letters, apostrophes and hyphens only; text lengths capped; unknown keys dropped.
2. **Randomness** (`random.ts`): a small seeded generator of our own, so a link gives the same names in every browser and `Math.random` is never used. Weighted picks. Separate streams for each column, derived from the seed, the column and how often it has been re-rolled, so re-rolling one column leaves the other two alone.
3. **Words** (`word.ts`): a word is built syllable by syllable from the shapes and weights, with the start and end leanings applied to the first and last sound.
   - Banned clusters are matched on the spelled word, ignoring case, across syllable breaks and across the join between a stem and an ending.
   - They are avoided as the word is built (a sound that would complete a banned cluster is never offered), and every finished name is checked once more before it is returned.
   - The work is bounded: a language too tight to fill a column returns fewer names and says why. It never loops.
4. **Names** (`generate.ts`): one function from a language to a batch of 24.
   - Places: a stem plus a place ending, or a stem alone for a set share of them.
   - People: a stem plus a given-name ending; with gender on, each name says which list it came from, in a word.
   - Surnames: by the patterns that are on. Patronymics build on a given name from the same language; place-based ones on a place name; trade-based ones on a small set of trades (smith, miller, fisher, weaver and so on) whose words are made once from the language's own sounds, so the same trade always gives the same root. Each surname says how it was made ("child of Teomir", "from Selunna", "weaver").
   - No name twice in a batch. First letter capitalised.
   - Re-roll one column; a new seed for all three unless the seed is locked.
   - A short built-in list of words nobody wants in a list of names is filtered the same way as banned clusters.
5. **Checking a language** (`review.ts`): gentle notes while you edit: no vowels, a shape nothing can fill, a banned cluster that rules out a whole sound, an ending that contains a banned cluster (it is skipped, and the note says so), too few possible names to fill a column.
6. **Description** (`describe.ts`): the language in plain words ("Coastal: ten consonants and six vowels, mostly open syllables, never 'kt' or 'sr'; places end in -vin, -holm or -ara"), with a few names, for Copy description and screen readers.
7. **The link** (`link.ts`): the whole language, the seed and the re-roll counts, compact and versioned, in the query string. An untouched preset is a few characters (`?p=coastal&s=4471`); anything else is compact JSON in base64url. The version also names the generator: if the way names are built ever changes, old links keep the old way.
8. **The profile** (`profile.ts`): the `names` section: the link, a summary, the language's name, `palette`, `parts` and `seed`, and the picked names in `places`, `people` and `surnames` only if the person ticks "Add my picked names". Every other section and every unknown key is left alone.
9. **Exports** (`export.ts`): the list as text and as CSV (kind, name, gender, how it was made, picked), and the language as JSON that loads back in.
10. **Presets** (`presets.ts`): eight palettes named by feel, never after a real language or people: Soft and coastal, Hard highland, Long-vowelled steppe, Latinate imperial, Hushed forest, Dry desert, Open island, Clustered north. Each with a line on what makes it sound that way.
11. **The planet** (`fun.ts`): spot a name that spells "Eurth" or "wurld", for the gold star and the toast.
12. **Guide and glossary** (`src/content/`):
    - The guide: how naming languages work. Phonology basics, syllable structure, phonotactics, why consistency sells a world, word parts (how real place names and surnames are built), and adapting real-world patterns respectfully. Each idea with a worked example in the tool's own terms, sources, and a last-updated date.
    - Where Names stands: a warm word for Fantasy Name Generators, with a link, for anyone who wants lists by theme. Names does the other job: one sound system for everything a nation needs.
    - A glossary of about 40 terms (phoneme, onset, coda, cluster, digraph, toponym, patronymic, exonym and so on).
13. **Tests throughout**, and these in particular:
    - Property tests (fast-check): for any language and any seed, no name contains a banned cluster; every name is built only from the palette and the word parts; the same link gives the same names; generating always finishes; whatever a link or file holds, the sanitiser returns a usable language.
    - Snapshots: the first batch of every preset at a fixed seed, kept in the repository, so a change that would alter shared links fails a test.
    - The guide's worked examples run as tests.

### Phase 2: the site (only once @eurth/style 1.0.0 is released)

14. Start from the starter template in eurth-style; read HANDBOOK.md first, and where it differs from this plan, the handbook wins.
15. Pages: Generator, Guide, Glossary, Presets, with titles, descriptions, canonical links, JSON-LD, sitemap.xml, robots.txt, llms.txt and Open Graph images.
16. The tool, as a Svelte 5 island, after the mock-up: preset, consonants, vowels, shapes and place endings on the left, with weights, leanings, banned clusters, given-name endings and surname patterns behind "More"; three columns of eight names on the right with the seed, Lock seed and a re-roll on each column.
17. Picks: a star on every name ("Pick Selunna", "Unpick Selunna"), the picked list for this visit with Copy list. Nothing is stored.
18. Save and load: Copy link and the Share dialog, the profile file (file picker and drag and drop, from @eurth/profile), the language as JSON in and out.
19. Exports: the list as text and CSV, the language as JSON, Copy description.
20. Delight: a new batch types itself in, letter by letter, fast (all at once for reduced motion); a small gold star and the toast "A fine name for a planet." for Eurth or wurld; the suite's own touches from @eurth/style.
21. Offline, install, security headers, axe and Lighthouse checks, as the handbook asks.
22. CI, and the launch workflow: `LAUNCH_AT` is `2026-12-12T00:00:00+01:00`, the scheduled run starts at 22:30 UTC on 11 December, and it also runs by hand. No custom domain and no workers.dev deploy before then.
23. README (use, development, deployment), docs/feedback-log.md, and the handbook's checklist.

## Releases

None yet.

## Not planned

- **Endless lists by theme.** Fantasy Name Generators does that, and does it well. Names makes one language and everything a nation needs from it.
- **Presets named after real languages or peoples.** Presets are described by how they feel. The guide covers how to borrow real patterns with respect.
- **A full constructed language** (grammar, vocabulary, sound changes over time). Names stops at names.
- **Accounts, or languages kept on a server.** A language lives in its link or its file; picks last for the visit.

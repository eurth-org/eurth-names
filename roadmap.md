# Roadmap

Names gives a nation one consistent naming language, at names.eurth.org: you set the sounds once, and every place, person and family comes out sounding like the same country. It is door 3 of Eurth's 2026 advent calendar and opens on 12 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026, late.** Phase 1 is finished: the engine, the presets, the guide's worked examples, the glossary and the sources are written and tested (174 tests, `npm test`). @eurth/style 1.0.1 and @eurth/profile 1.0.0 are released, so Phase 2 can start. The next step is Phase 2, step 14: copy the starter template from eurth-style and put the engine behind it.

What a new session needs to know:

- **The engine is in `src/names/`** and has no dependencies. Start at `model.ts` (what a language is) and `generate.ts` (the promise about banned clusters). `src/content/` holds the guide's worked examples, the glossary and the sources as data; the guide's prose is still to be written, straight into the guide page.
- **The profile section follows the handbook, not the brief.** The brief asked for the sound palette, word parts and seed in the `names` section; the handbook says a section is small and its `link` brings the whole design back. So the link carries the palette, the word parts and the seed, and the section holds `link`, `summary`, `language` and, if the person asks, the picked names. Every language fits in a link of under 3,900 characters; a test holds it to that.
- **The link** is `?p=1.coastal.4471` for an untouched preset and `?d=1.…` for anything else. The `d` form is the same as `encodeState()` of @eurth/style writes; in Phase 2, use theirs instead of the copy in `link.ts`.
- **Never update the snapshot in `tests/__snapshots__/`** once the site is live: it pins the first batch of every preset, and a change there changes every shared link. Until launch it may still be regenerated if a preset is retuned.

Still to confirm with Stijn (none of it blocks the site):

- **24 at a time** is 8 places, 8 people and 8 surnames.
- **The first page is called "Generator"**, as the brief says; the mock-up's header says "Maker" and has no Presets link.
- **"Lock seed"**, not the mock-up's "Lock sounds".
- **"Latinate imperial"** is the brief's own name for a preset, and the one place a preset's name leans on a real language. Say if it should be "Stately imperial".
- **A short built-in list of rude words** is filtered from every batch (`unwanted.ts`, kept in ROT13). The brief didn't ask for it.

## Next

### Phase 2: the site

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

## Built, not yet released

Phase 1, 14 November 2026. This becomes the first release's section when the site launches.

- **The language model:** consonants and vowels with weights and leanings (never, seldom, as usual, often at the start and end of a word), syllable shapes with weights, banned clusters, stem lengths, place endings, given-name endings by gender or none, and three surname patterns. Every list has a short written form ("p t*14 ng^0", "CV*60 CVC", "-sen mac- van_") that the text boxes, the link and the exported file share.
- **Names from a seed:** 8 places, 8 people and 8 surnames from a generator of our own, the same in every browser. Each column has its own stream, so re-rolling one leaves the other two alone.
- **Banned clusters never appear:** kept out while a word is built and checked again on every finished name, endings and affixes included. Property-tested on thousands of made-up languages.
- **Two rules beyond the brief, to keep ban lists short:** vowels only meet between syllables when the language says so; and a sound that never starts a word always follows a vowel, while one that never ends a word is always followed by one. Clusters such as "br" and "rd" are typed as sounds and stay where they belong.
- **Joins that read naturally:** where an ending that starts with a vowel meets a stem that ends in one, the stem gives way (Kitu and -ia make Kitia).
- **Surnames three ways:** from a parent's name, from a place, or from a trade, where each language has its own word for each of 18 trades.
- **Eight presets by feel:** Soft and coastal, Hard highland, Long-vowelled steppe, Latinate imperial, Hushed forest, Dry desert, Open island, Clustered north.
- **Checks while you edit:** what stops a language making names, and what is quietly left out.
- **Saving and sharing:** the link, the profile's `names` section, the language as a JSON file that loads back in, the list as text and CSV, and a written description.
- **The planet:** a name that spells "Eurth" or "wurld" is spotted, for the gold star.
- **For the guide:** ten worked examples that the tests run, a glossary of 49 terms, and eleven sources.

## Releases

None yet.

## Not planned

- **Endless lists by theme.** Fantasy Name Generators does that, and does it well. Names makes one language and everything a nation needs from it.
- **Presets named after real languages or peoples.** Presets are described by how they feel. The guide covers how to borrow real patterns with respect.
- **A full constructed language** (grammar, vocabulary, sound changes over time). Names stops at names.
- **Accounts, or languages kept on a server.** A language lives in its link or its file; picks last for the visit.

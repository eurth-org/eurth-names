# Roadmap

Names gives a nation one consistent naming language, at names.eurth.org: you set the sounds once, and every place, person and family comes out sounding like the same country. It is door 3 of Eurth's 2026 advent calendar and opens on 12 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**15 November 2026.** The site is built and passes every check: types, 250 tests (the engine's own, the built pages, and the suite's checks from @eurth/style), and the accessibility check on all five pages in both themes. CI is green on `main`, Lighthouse and the smoke test in Chrome included. It is not deployed, and must not be before its door: the launch workflow does that on the evening of 11 December.

What a new session needs to know:

- **Use Node 22.23 or later** (CI runs Node 26). Astro refuses older ones.
- **`npm run build` before `npm test`:** the suite's checks and `tests/site.test.ts` read `dist/`.
- **The engine is in `src/names/`**, the generator in `src/tool/Generator.svelte`, the pages in `src/pages/`, and the guide's examples, glossary and sources in `src/content/`.
- **The profile section follows the handbook, not the brief.** The brief asked for the sound palette, word parts and seed in the `names` section; the handbook says a section is small and its `link` brings the whole design back. So the link carries the palette, the word parts and the seed, and the section holds `link`, `summary`, `language` and, if the person ticks the box, the picked names. Every language fits in a link of under 3,900 characters; a test holds it to that.
- **Never update the snapshot in `tests/__snapshots__/` once the site is live:** it pins the first batch of every preset, and a change there changes every shared link. Until launch it may still be regenerated if a preset is retuned.

Still to confirm with Stijn (none of it blocks the launch):

- **24 at a time** is 8 places, 8 people and 8 surnames.
- **The first page is called "Generator"**, as the brief says; the mock-up's header says "Maker" and has no Presets link.
- **"Lock seed"**, not the mock-up's "Lock sounds". Locked, the seed stays: Generate moves the three columns on under it, and a preset is heard on the same draws.
- **"Latinate imperial"** is the brief's own name for a preset, and the one place a preset's name leans on a real language. Say if it should be "Stately imperial".
- **A short built-in list of rude words** is filtered from every batch (`src/names/unwanted.ts`, kept in ROT13). The brief didn't ask for it.
- **The guide**: read it once as the person whose name is on it. Its facts are sourced and its examples are tested, but the advice on borrowing from real languages is a matter of judgement.

## Next

### Before the door (12 December 2026, 00:00 Europe/Brussels)

- **Try it on a real phone and with a screen reader** (VoiceOver): the typing effect, the stars and the "More" sections.
- **On 11 December at 22:30 UTC** the launch workflow starts by itself. If it hasn't started by 22:45 UTC, run it by hand (Actions, Launch, Run workflow).
- **After the launch:** delete `.github/workflows/launch.yml`, and move "Built, not yet released" below into a dated release section.

### After launch

- **A table for the sounds:** a row a sound with sliders for its weight and how it leans at the start and end of a word, beside the short written form. Today those are typed (`t*20`, `ng^0`, `h$0`).
- **More of what a nation names:** rivers and mountains with endings of their own, a demonym from the nation's name, and a ruler's regnal name.
- **A neighbour:** a second language derived from the first by a few sound changes, for the nation across the border.
- **Nicknames** as a fourth surname pattern, from a small set of meanings (the tall, the red, the younger).
- **Stress and pronunciation:** mark the stressed syllable, and a rough guide to saying each name.
- **Send to another tool:** open Cities or Dynasty with names from the picked list, once those tools read the profile's `names` section.

## Built, not yet released

Built on 14 and 15 November 2026. This becomes the first release's section when the site launches.

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
- **The generator page:** the controls of the mock-up (preset, consonants, vowels, syllable shapes, place endings) with the rest behind "More"; three columns of eight names with a re-roll on each; Lock seed; notes on the language as you edit it.
- **Picks:** a star on every name, a picked list for the visit with Copy list. Nothing is stored.
- **A new batch types itself in,** letter by letter, in under half a second, with two soft keys if sound is on; all at once for reduced motion. Screen readers hear one line for the batch.
- **The guide:** how naming languages work (sounds, syllables, the rules between them, word parts, why consistency sells a world, borrowing with respect), with ten worked examples that the tests run and eleven sources. A warm word and a link for Fantasy Name Generators.
- **A glossary** of 49 terms, and **a presets page** with a few names from each and a link into the generator.
- **The shell, the offline copy, the security headers and the launch workflow** from @eurth/style 1.0.1 and its starter template.

## Releases

None yet.

## Not planned

- **Endless lists by theme.** Fantasy Name Generators does that, and does it well. Names makes one language and everything a nation needs from it.
- **Presets named after real languages or peoples.** Presets are described by how they feel. The guide covers how to borrow real patterns with respect.
- **A full constructed language** (grammar, vocabulary, sound changes over time). Names stops at names.
- **Accounts, or languages kept on a server.** A language lives in its link or its file; picks last for the visit.

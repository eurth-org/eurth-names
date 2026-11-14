You're building Names (names.eurth.org), which gives a nation one consistent naming language, one of Eurth's free worldbuilding tools. Eurth (eurth.org) is a worldbuilding and roleplay community since 2004. The attached repo is eurth-org/eurth-names.

Working order (Foundations and many other tools are being built at the same time tonight):
1. Save this brief as CLAUDE.md.
2. If the repo named above doesn't exist on GitHub yet, create it as a public, empty repo in eurth-org with the gh CLI and connect this folder; if you can't, ask me.
3. Read what already exists of github.com/eurth-org/eurth-style (HANDBOOK.md) and github.com/eurth-org/eurth-profile; they may still be in progress. Write the plan and show it to me.
4. Build the tool's core logic as plain TypeScript modules with thorough tests, and its content and data (guide text, presets, examples, data snapshots). None of that needs eurth-style.
5. Only once @eurth/style 1.0.0 is released (check the releases of github.com/eurth-org/eurth-style), start the site from its starter template and carry on to the end of this brief. Until then, don't scaffold the site, pages or styles.
6. Commit and push after every finished step, and keep roadmap.md up to date with exactly where to pick up, so a new session can continue if this one stops.

Background for every step: Read HANDBOOK.md in github.com/eurth-org/eurth-style and start from its starter template; read the profile schema in github.com/eurth-org/eurth-profile; look at github.com/eurth-org/eurth-flag, the reference build. The handbook wins over this brief on everything shared. Then write a plan and show it to me before you build.

Mock-up: the "names.eurth.org, naming language" board on https://claude.ai/artifact/32RKDdVTtCfHsL6Qc6LxV6.

Position: we love Fantasy Name Generators and don't want to compete with its endless lists. Names does the job lists can't: every name a nation needs, from one sound system, so they all sound like the same place. Say so warmly in the guide, with a link to Fantasy Name Generators for anyone who wants lists by theme.

Pages: Generator, Guide, Glossary, Presets.

The generator, v1
- Sound palette: consonants and vowels (with weights), syllable shapes (CV, CVC, VC, CCV and so on, with weights), banned clusters, and how often each sound starts or ends a word.
- Word parts: place endings ("-holm", "-vin"), personal-name endings by gender or none, surname patterns (patronymic, place-based, trade-based).
- Output: places, people and surnames, 24 at a time; lock a seed; re-roll one column.
- Picks: a star on any name adds it to a picked list for this visit only, with Copy list. Nothing is stored.
- Presets: eight starting palettes described by feel (soft and coastal, hard highland, long-vowelled steppe, Latinate imperial and so on), never named after real languages or peoples.
- The language travels in the link, so a shared link generates the same names.

Guide: how naming languages work: phonology basics, syllable structure, phonotactics, why consistency sells a world, adapting real-world patterns respectfully, with sources.

Profile section "names": the sound palette, word parts and seed, plus picked names if the user chooses to add them.

Exports: the list as text and CSV, the language as JSON, Copy description.

Signature touch: a new batch of names types itself in, letter by letter, fast. Easter egg: generating a name that spells "Eurth" or "wurld" gets a small gold star and the toast "A fine name for a planet."

Done when the handbook's checklist passes and the generator never produces a banned cluster (property-tested).

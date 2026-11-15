# Names

> A friendly note: Names is part of Eurth's advent calendar, and its door opens on 12 December 2026. The code is public, the site isn't yet. Please don't spoil the surprise before the door opens.

Names gives a nation one consistent naming language: set the sounds once, and every place, person and family comes out sounding like the same country. It is one of the free worldbuilding tools by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, and will live at names.eurth.org.

We love Fantasy Name Generators and don't compete with its lists. Names does the job a list can't: everything one nation needs, from one sound system.

What's planned, where work stands and what each release added is in the [roadmap](roadmap.md). The rules every Eurth tool follows are in the handbook, `node_modules/@eurth/style/HANDBOOK.md`; on anything the tools share, the handbook wins.

## Use

1. Start from one of eight presets, described by how they feel (soft and coastal, hard highland and so on), or type your own consonants and vowels.
2. Choose syllable shapes and place endings. Behind "More" are weights, banned clusters, given-name endings and surname patterns.
3. Press Generate for 24 names: eight places, eight people, eight surnames. Re-roll one column, lock the seed, star the names you like.
4. Copy the link. It holds the whole language and the seed, so anyone who opens it sees the same names.

Lists are written in a short form, which the text boxes, the link and the exported file share:

| List | Example | Meaning |
| --- | --- | --- |
| Sounds | `p t*14 ng^0 h$0` | A spelling, then `*` its weight (10 if left out), `^` how it leans at the start of a word and `$` at the end: 0 never, 1 seldom, 2 as usual, 3 often |
| Shapes | `CV*60 CVC*30` | C is a consonant, V a vowel |
| Endings | `vin holm*20` | Letters, with an optional weight |
| Affixes | `-sen mac- van_ _dottir` | Follows the name, leads it, leads it as a word of its own, follows it as a word of its own |
| Banned | `kt sr` | Clusters that never appear in any name |

Nothing is stored in the browser. Picked names last for the visit. To keep a language, copy its link, save it as a file ("Language as JSON"), or save your nation's profile file, which carries it to the other Eurth tools.

## Development

Node 22.23 or later (CI runs on Node 26).

```sh
npm install
npm run dev          # the site while you work
npm run check        # types
npm run build        # the static site, into dist/
npm test             # the engine's tests and the suite's checks (those read dist/, so build first)
npm run axe          # accessibility: every page, both themes
npm run preview      # the built site with its real headers (wrangler dev)
npm run images       # icons and the sharing image, after changing them
```

- `eurth.config.mjs`: the tool's name, address, title and pages. Build time only.
- `src/names/`: the engine, plain TypeScript with no page in it. Start at `model.ts` (what a language is) and `generate.ts` (how names are made, and the promise that no name holds a banned cluster).
- `src/content/`: the guide's worked examples, the glossary and the sources, as data.
- `src/tool/Generator.svelte`: the generator itself. `src/pages/`: the generator, the presets, the guide, the glossary and the 404 page.
- `tests/`: the engine's own tests, property tests on made-up languages (`properties.test.ts`), the guide's examples (`content.test.ts`), the built pages (`site.test.ts`) and the checks every Eurth tool runs (`shell.test.js`).
- `LAUNCH_AT`: the moment the door opens.

Two things never to change once the site is live, because shared links depend on them: the generator and hash in `src/names/random.ts`, and the snapshot in `tests/__snapshots__/`, which pins the first batch of every preset. If the way names are built has to change, give it a new link version and keep version 1 as it is.

## Deployment

The site runs as a Cloudflare Worker serving static assets on its custom domain (`wrangler.jsonc`). Until the door opens it isn't deployed anywhere. The launch workflow opens the door at the time in `LAUNCH_AT`; after that, GitHub Actions deploys every push to `main` that passes, and a nightly run keeps `@eurth/style` and `@eurth/profile` up to date. Deploying uses the organisation secret `CLOUDFLARE_API_TOKEN`.

Release steps: move what's done out of "Next" in the [roadmap](roadmap.md) and add a dated section for the release, set the version in `package.json`, then check, build, test and push.

## Licence

Apache 2.0, see [LICENSE](LICENSE).

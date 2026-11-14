# Names

> A friendly note: Names is part of Eurth's advent calendar, and its door opens on 12 December 2026. The code is public, the site isn't yet. Please don't spoil the surprise before the door opens.

Names gives a nation one consistent naming language: set the sounds once, and every place, person and family comes out sounding like the same country. It is one of the free worldbuilding tools by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, and will live at names.eurth.org.

The engine is built and tested; the site is next. The plan, and exactly where work stands, is in [roadmap.md](roadmap.md).

## Development

Node 22 or newer.

```sh
npm install
npm run check   # types
npm test        # the engine, the presets and the guide's worked examples
```

The engine is plain TypeScript in `src/names/`, with no dependencies. The guide's worked examples, the glossary and the sources are data in `src/content/`.

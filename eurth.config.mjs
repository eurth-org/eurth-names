// What this tool is called and where it lives. Read at build time only: astro.config.mjs, the
// frontmatter of .astro pages, tests and tools/. Never import this from a Svelte component or a
// <script>: it pulls in the list of every Eurth tool, and browser code must not carry that
// (HANDBOOK.md, Launch). Hand the component what it needs as props instead.
import { defineSite } from '@eurth/style/build';

export const site = defineSite({
  // The subdomain, and the tool's id in @eurth/style's tools.json.
  id: 'names',
  name: 'Names',
  url: 'https://names.eurth.org',
  // "<Name>: free online <thing> maker for worldbuilders"
  title: 'Names: free online naming language maker for worldbuilders',
  description: 'A free name generator for worldbuilders that starts from a sound system: set the sounds once, and every place, person and family sounds like the same nation. No account needed.',
  tagline: 'One naming language per nation',
  pages: [
    { href: '/', label: 'Generator' },
    { href: '/presets/', label: 'Presets' },
    { href: '/guide/', label: 'Guide' },
    { href: '/glossary/', label: 'Glossary' },
  ],
  repo: 'https://github.com/eurth-org/eurth-names',
  ogAlt: 'Names, a naming language maker by Eurth, at names.eurth.org: the Eurth yurt beside two columns of place names and given names that sound like one place.',
  // A new batch types itself in with two soft keys, so the footer offers the sound switch.
  sound: true,
});

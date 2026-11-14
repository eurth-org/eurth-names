// Makes the pictures that aren't drawn by hand, with the Chrome on this machine: the favicon,
// the home-screen icons and the sharing image. Run it after changing the sharing image, and
// commit what it writes to public/:  npm run images
import { resolveColors } from '@eurth/style';
import { makeImages, sharingImage } from '@eurth/style/images';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { site } from '../eurth.config.mjs';

const tokens = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@eurth/style/tokens.json'), 'utf8'));

// The picture on the sharing image comes from the same code as the site (Vite reads TypeScript).
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { sharingArt } = await vite.ssrLoadModule('/src/tool/art.ts');
  const art = sharingArt(resolveColors(tokens, 'dark'), tokens.type.families.sans);
  const made = await makeImages({ sharing: [{ file: 'og.png', html: sharingImage({ site, art }) }] });
  console.log(`Made ${made.map((file) => `public/${file}`).join(', ')}`);
} finally {
  await vite.close();
}

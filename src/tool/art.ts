/**
 * The picture on the sharing image: a card with three short columns of names from the first
 * preset, drawn as SVG. An exported picture can't use custom properties, so its colours come in
 * as plain values, resolved from the suite's tokens by tools/make-images.mjs.
 */
import { generate, newDraw } from '../names/generate';
import { DEFAULT_PRESET } from '../names/presets';

const esc = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function sharingArt(colors: Record<string, string>, font: string): string {
  const batch = generate(DEFAULT_PRESET.language, newDraw(DEFAULT_PRESET.seed));
  const columns = [
    { title: 'PLACES', names: batch.place.names },
    { title: 'PEOPLE', names: batch.given.names },
  ];
  const rows = 6;
  const width = 416;
  const height = 534;
  let body = '';
  columns.forEach((column, c) => {
    const x = 32 + c * 184;
    body += `<text x="${x}" y="56" font-size="18" font-weight="700" letter-spacing="1.4" fill="${colors['ink-muted']}">${column.title}</text>`;
    column.names.slice(0, rows).forEach((name, r) => {
      const y = 84 + r * 70;
      body += `<line x1="${x}" y1="${y}" x2="${x + 152}" y2="${y}" stroke="${colors.line}" stroke-width="2"/>`;
      body += `<text x="${x}" y="${y + 44}" font-size="28" fill="${colors.ink}">${esc(name.text)}</text>`;
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="${esc(font)}"><rect width="${width}" height="${height}" rx="12" fill="${colors['surface-raised']}"/>${body}</svg>`;
}

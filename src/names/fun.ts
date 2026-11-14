/**
 * The easter egg: a batch that happens to spell the planet's own name. Eurth is the world, and
 * its people have been known to call it the wurld.
 */
import { fold } from './model';

export const PLANET_TOAST = 'A fine name for a planet.';

/** Whether a name spells "Eurth" or "wurld". */
export function isPlanetName(name: string): boolean {
  const folded = fold(name).trim();
  return folded === 'eurth' || folded === 'wurld';
}

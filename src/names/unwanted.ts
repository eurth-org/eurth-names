/**
 * A short list of words nobody wants to find in a list of names for their nation: the plainest
 * English swear words and slurs. A name that holds one is thrown away and drawn again, the same
 * way as a banned cluster.
 *
 * The list is kept in ROT13 so the words themselves aren't sitting in the source for anyone
 * searching the repository. It is deliberately short: it catches the obvious, and anything
 * else a person minds, they ban themselves. It matches inside names too, so a few innocent
 * ones go with it; with endless names to draw from, that costs nothing.
 */
import { fold } from './model';

const ROT13 = ['shpx', 'fuvg', 'phag', 'avtt', 'snttb', 'encr', 'anmv', 'uvgyre', 'xvxr', 'cravf', 'intva', 'cvff', 'fyhg', 'juber', 'gjng', 'jnax', 'cbea', 'ergneq', 'ovgpu', 'obyybp', 'jbt', 'fngna'];

const rot13 = (text: string): string => text.replace(/[a-z]/g, (ch) => String.fromCharCode(((ch.charCodeAt(0) - 97 + 13) % 26) + 97));

const WORDS = ROT13.map(rot13);

/** Whether a name holds one of the words on the list. */
export function unwanted(name: string): boolean {
  const folded = fold(name);
  return WORDS.some((word) => folded.includes(word));
}

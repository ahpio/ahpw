import { fileURLToPath } from 'node:url';
import type { Plugin } from '@ahpd/sdk';
import { staticRoute } from './static.js';

/** The plugin's id, and the path it is served under: `/plugins/web/`. */
export const name = 'web';

/** What a listing prints. */
export const title = 'Web';

/** The built page, beside this file in the package. */
const APP = fileURLToPath(new URL('../app/', import.meta.url));

/** Where the page is served. */
const PREFIX = `/plugins/${name}/`;

/** The name and the title the page sends from this plugin, when its options set neither. */
export const DEFAULT_CLIENT = { name: 'ahpd-web', title: 'ahpd web' };

/** `value` when it is a string with text, else `fallback`. */
const textOr = (value: unknown, fallback: string): string => (typeof value === 'string' && value.trim() !== '' ? value : fallback);

/**
 * What the page asks first: whether the server adds the token, and what the
 * page tells the daemon it is. The daemon adds no token, so it says so, as
 * `ahpw serve` answers the same file, rather than a 404 the browser prints as
 * an error on every load.
 */
const aboutOf = (options: Record<string, unknown>): string => JSON.stringify({
  tokenHeld: false,
  client: { name: textOr(options['clientName'], DEFAULT_CLIENT.name), title: textOr(options['clientTitle'], DEFAULT_CLIENT.title) },
});

export const apply: Plugin['apply'] = (host, options) => {
  const files = staticRoute(APP, PREFIX);
  const about = aboutOf(options);
  host.registerRoute(async (request) => {
    if (new URL(request.url).pathname !== `${PREFIX}ahpw.json`) return await files(request);
    return new Response(about, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  });
};

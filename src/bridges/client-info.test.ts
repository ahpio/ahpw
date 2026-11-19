import { afterEach, describe, expect, it, vi } from 'vitest';
import manifest from '../../package.json';

/** ahpw's version, as `package.json` says it. */
const VERSION = manifest.version;

/** The module read fresh, with `embedder` set as given and `ahpw.json` answering `served`. */
async function fresh(embedder: object | undefined, served?: unknown): Promise<typeof import('./client-info.js')> {
  vi.resetModules();
  (globalThis as { ahpwEmbedder?: object | undefined }).ahpwEmbedder = embedder;
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify(served ?? {}), { headers: { 'content-type': 'application/json' } }));
  if (served !== undefined) await (await import('../lib/api.js')).readServer();
  return await import('./client-info.js');
}

afterEach(() => {
  delete (globalThis as { ahpwEmbedder?: object }).ahpwEmbedder;
  vi.unstubAllGlobals();
});

describe('what the page tells a host it is', () => {
  it('is ahpw where the server names no client, with ahpw\'s version', async () => {
    const { clientInfoOf } = await fresh(undefined);
    expect(clientInfoOf()).toEqual({ name: 'ahpw', title: 'ahpw', version: VERSION });
  });

  it('is the client ahpw.json names', async () => {
    const { clientInfoOf } = await fresh(undefined, { tokenHeld: false, client: { name: 'ahpd-web', title: 'ahpd web' } });
    expect(clientInfoOf()).toEqual({ name: 'ahpd-web', title: 'ahpd web', version: VERSION });
  });

  it('takes a field ahpw.json leaves out, or gives empty, from the default', async () => {
    const { clientInfoOf } = await fresh(undefined, { client: { name: 'mine', title: '' } });
    expect(clientInfoOf()).toEqual({ name: 'mine', title: 'ahpw', version: VERSION });
  });

  it('is ahp-desk in an embedder that names none', async () => {
    const { clientInfoOf } = await fresh({});
    expect(clientInfoOf()).toEqual({ name: 'ahp-desk', title: 'ahp-desk', version: VERSION });
  });

  it('is the client an embedder names, field by field', async () => {
    const { clientInfoOf } = await fresh({ client: { title: 'Desk' } });
    expect(clientInfoOf()).toEqual({ name: 'ahp-desk', title: 'Desk', version: VERSION });
  });
});

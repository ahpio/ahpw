/**
 * What a plugin written in ahpw starts from: an `index.ts` with ahpd's plugin
 * contract, an `apply` export, and the `package.json` beside it. The contract
 * is ahpd's `docs/plugins/PLUGINS.md`.
 */

/** The package name a written plugin starts with: its id, or a stand-in while it has none. */
export const nameFor = (id: string): string => (id === '' ? 'my-plugin' : id);

/** The title a written plugin starts with: its id's words, capitalised. */
export function titleFor(id: string): string {
  const words = id.split('-').filter((one) => one !== '').join(' ');
  return words === '' ? 'My plugin' : words.charAt(0).toUpperCase() + words.slice(1);
}

const titleLine = (id: string): string => `export const title = '${titleFor(id).replace(/'/gu, "\\'")}';`;
const nameLine = (id: string): string => `"name": ${JSON.stringify(nameFor(id))}`;

/** The `index.ts` a written plugin starts with. */
export function starterSource(id: string): string {
  return [
    "import type { PluginHost } from '@ahpd/sdk';",
    '',
    titleLine(id),
    '',
    'export function apply(host: PluginHost, options: Record<string, unknown>): void {',
    '  // Register what this plugin adds here.',
    '}',
    '',
  ].join('\n');
}

/** The `package.json` a written plugin starts with. */
export function starterPackage(id: string): string {
  return [
    '{',
    `  ${nameLine(id)},`,
    '  "version": "0.1.0",',
    '  "type": "module",',
    '  "dependencies": {}',
    '}',
    '',
  ].join('\n');
}

/** The source with its title line moved from `before`'s to `after`'s, while it still holds the one made from `before`. */
export const sourceFollows = (text: string, before: string, after: string): string => text.replace(titleLine(before), titleLine(after));

/** The package.json with its name line moved from `before`'s to `after`'s, while it still holds the one made from `before`. */
export const packageFollows = (text: string, before: string, after: string): string => text.replace(nameLine(before), nameLine(after));

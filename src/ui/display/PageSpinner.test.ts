import { describe, expect, it } from 'vitest';

/** Every component's source, by its path from the repository root. */
const SOURCES = import.meta.glob<string>('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true });

/**
 * The lines of a source that return a bare `<Spinner>` from a page: a
 * component whose next top-level `return (` opens a `web-page` root. An inner
 * panel's spinner already sits inside a page's margins and is not one.
 */
export function barePageSpinners(text: string): number[] {
  const lines = text.split('\n');
  return lines.flatMap((line, at) => {
    if (!/return <Spinner\b/.test(line)) return [];
    const main = lines.findIndex((one, after) => after > at && one.startsWith('  return ('));
    return main !== -1 && lines[main + 1]?.includes('className="web-page') ? [at + 1] : [];
  });
}

describe('PageSpinner', () => {
  it('finds a page that returns a bare spinner, and not an inner panel', () => {
    const page = ['function A() {', '  if (x) return <Spinner label="a" />;', '  return (', '    <div className="web-page">', '  );', '}'].join('\n');
    const panel = ['function B() {', '  if (x) return <Spinner label="b" />;', '  return (', '    <div className="web-keys">', '  );', '}'].join('\n');
    expect(barePageSpinners(page)).toEqual([2]);
    expect(barePageSpinners(panel)).toEqual([]);
  });

  it('is what every page returns while it reads, so the spinner sits in the page margins', () => {
    const bare = Object.entries(SOURCES).flatMap(([path, text]) => barePageSpinners(text).map((line) => `${path}:${line}`));
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
    expect(bare).toEqual([]);
  });
});

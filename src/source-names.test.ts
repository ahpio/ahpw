import { describe, expect, it } from 'vitest';

// Lazy, so the files are listed, not loaded.
const SOURCES = Object.keys(import.meta.glob('/src/**/*.{ts,tsx}'));

describe('source file names', () => {
  // An import says `./Models.js`; Vite tries `Models.ts` before `Models.tsx`,
  // and on Windows `Models.ts` opens `models.ts`. Two names that differ only in
  // case, past the extension, load the wrong module there.
  it('differ by more than case and extension', () => {
    expect(SOURCES.length).toBeGreaterThan(0);
    const byName = new Map<string, string[]>();
    for (const path of SOURCES) {
      const name = path.replace(/\.tsx?$/, '').toLowerCase();
      byName.set(name, [...(byName.get(name) ?? []), path]);
    }
    const clashes = [...byName.values()].filter((paths) => paths.length > 1);
    expect(clashes).toEqual([]);
  });
});

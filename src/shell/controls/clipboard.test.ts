import { expect, test } from 'vitest';

/** Every source file under `src`, keyed by its path, as text. */
const SOURCES = import.meta.glob<string>('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

/** The one file that may reach the browser's clipboard. */
const OWNER = '/src/shell/controls/CopyButton.tsx';

test('only copyText reaches navigator.clipboard, so a copy works on plain http', () => {
  const callers = Object.entries(SOURCES)
    .filter(([path, text]) => path !== OWNER && !path.endsWith('.test.ts') && text.includes('navigator.clipboard'))
    .map(([path]) => path);
  expect(callers).toEqual([]);
  expect(SOURCES[OWNER]).toContain('navigator.clipboard');
});

import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';

// Every source file's text, to find what it imports.
const SOURCES = import.meta.glob<string>('/src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

describe('markdown in ahpw', () => {
  it('renders through the wrapper, so every view draws diagrams', () => {
    const direct = Object.entries(SOURCES)
      .filter(([path]) => !path.startsWith('/src/shell/markdown/'))
      .filter(([, text]) => /import\s*(?:type\s*)?\{[^}]*(?<![\w$])Markdown(?![\w$])[^}]*\}\s*from\s*'@softov\/scena\/ui'/.test(text))
      .map(([path]) => path);
    expect(direct).toEqual([]);
  });
});

// The calls MermaidDiagram makes, held to the pinned alpha: its API can change between builds.
describe('mermaid', () => {
  it('draws a flowchart as SVG in either theme', async () => {
    for (const theme of ['default', 'dark'] as const) {
      const { svg } = await mermaid.render('web-mermaid-test', 'flowchart LR\n  A --> B', { config: { theme } });
      expect(svg).toMatch(/^<svg[\s>]/);
    }
  });

  it('draws a label as text, not markup', async () => {
    const { svg } = await mermaid.render('web-mermaid-test', 'flowchart LR\n  A["<img src=x onerror=alert(1)>"] --> B');
    expect(svg).not.toMatch(/<img|<script|foreignObject/i);
  });

  it('rejects a broken diagram with a message that says where', async () => {
    await expect(mermaid.render('web-mermaid-test', 'flowchart LR\n  A -->')).rejects.toThrow(/^Error at line 2, column 8/);
  });
});

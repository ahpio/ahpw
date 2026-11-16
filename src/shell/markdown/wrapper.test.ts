import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// The diagram itself is Mermaid's: here it stands in as what the wrapper hands it.
vi.mock('./Mermaid.js', () => ({
  MermaidDiagram: ({ source, closed }: { source: string; closed: boolean }) => createElement('div', { 'data-diagram': source, 'data-closed': String(closed) }),
}));

const { Markdown } = await import('./Markdown.js');

const markup = (text: string, block?: Parameters<typeof Markdown>[0]['block']): string =>
  renderToStaticMarkup(createElement(Markdown, { text, ...(block === undefined ? {} : { block }) }));

describe('the Markdown wrapper', () => {
  it('draws a mermaid fence through scena\'s block hook, in a list item too', () => {
    expect(markup('Before\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\nAfter')).toContain('data-diagram="flowchart LR\n  A --&gt; B" data-closed="true"');
    expect(markup('- item\n\n  ```mermaid\n  pie\n  ```')).toContain('data-diagram="pie" data-closed="true"');
  });

  it('marks the fence a streaming reply ends inside as open', () => {
    expect(markup('Text\n\n```mermaid\nflowchart LR\n  A -->')).toContain('data-closed="false"');
  });

  it('leaves any other fence to scena', () => {
    const html = markup('```js\nconst a = 1;\n```');
    expect(html).not.toContain('data-diagram');
    expect(html).toContain('data-lang="js"');
  });

  it('asks the caller\'s block hook first', () => {
    const html = markup('```mermaid\npie\n```', (one) => (one.kind === 'code' ? createElement('svg', { 'data-mine': one.lang }) : undefined));
    expect(html).toContain('data-mine="mermaid"');
    expect(html).not.toContain('data-diagram');
  });
});

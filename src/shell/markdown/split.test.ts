import { describe, expect, it } from 'vitest';
import { splitMermaid } from './split.js';

describe('splitMermaid', () => {
  it('keeps a text with no diagram as one run', () => {
    expect(splitMermaid('# Hi\n\n```ts\nconst a = 1;\n```')).toEqual([{ kind: 'text', text: '# Hi\n\n```ts\nconst a = 1;\n```' }]);
  });

  it('cuts a mermaid fence out between the runs around it', () => {
    expect(splitMermaid('Before\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\nAfter')).toEqual([
      { kind: 'text', text: 'Before\n' },
      { kind: 'mermaid', source: 'flowchart LR\n  A --> B', closed: true },
      { kind: 'text', text: '\nAfter' },
    ]);
  });

  it('reads the language in any case and a tilde fence', () => {
    expect(splitMermaid('~~~Mermaid\npie\n~~~')).toEqual([{ kind: 'mermaid', source: 'pie', closed: true }]);
  });

  it('marks a fence with no closing line as open', () => {
    expect(splitMermaid('Text\n```mermaid\nflowchart LR\n  A -->')).toEqual([
      { kind: 'text', text: 'Text' },
      { kind: 'mermaid', source: 'flowchart LR\n  A -->', closed: false },
    ]);
  });

  it('leaves a mermaid fence inside another fence as text', () => {
    const text = '````md\n```mermaid\npie\n```\n````';
    expect(splitMermaid(text)).toEqual([{ kind: 'text', text }]);
  });

  it('leaves an indented mermaid fence, which may sit in a list item, as code', () => {
    const text = '- item\n  ```mermaid\n  pie\n  ```';
    expect(splitMermaid(text)).toEqual([{ kind: 'text', text }]);
  });
});

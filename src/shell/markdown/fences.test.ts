import { describe, expect, it } from 'vitest';
import { endsInFence, isOpenFence } from './fences.js';

describe('a fence still open', () => {
  it('is one the text ends inside, with no closing line', () => {
    expect(endsInFence('Text\n```mermaid\nflowchart LR\n  A -->')).toBe(true);
    expect(endsInFence('```mermaid\npie\n```')).toBe(false);
    expect(endsInFence('~~~Mermaid\npie\n~~~')).toBe(false);
  });

  it('is not closed by a shorter or a different run, as scena reads a fence', () => {
    expect(endsInFence('````md\n```mermaid\npie\n```')).toBe(true);
    expect(endsInFence('```\na\n~~~')).toBe(true);
  });

  it('is the fence whose body the text ends with, in a list item too', () => {
    const text = 'Text\n```mermaid\nflowchart LR\n  A -->';
    expect(isOpenFence(text, 'flowchart LR\n  A -->')).toBe(true);
    expect(isOpenFence('```mermaid\npie\n```\n\n```js\nlet a', 'pie')).toBe(false);
    expect(isOpenFence('- item\n  ```mermaid\n  pie', 'pie')).toBe(true);
    expect(isOpenFence('```mermaid\n', '')).toBe(true);
  });
});

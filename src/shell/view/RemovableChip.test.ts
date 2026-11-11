import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RemovableChip } from './RemovableChip.js';

const markup = (props: Parameters<typeof RemovableChip>[0]): string => renderToStaticMarkup(createElement(RemovableChip, props));

describe('RemovableChip', () => {
  it('has no ✕ without onRemove, and stays still', () => {
    const html = markup({ label: 'admin', removeLabel: 'Take admin away' });
    expect(html).not.toContain('<button');
    expect(html).toContain('data-still="true"');
    expect(markup({ label: 'admin', removeLabel: 'x', onRemove: () => undefined })).not.toContain('data-still');
  });

  it('names its ✕ with removeLabel', () => {
    const html = markup({ label: 'admin', removeLabel: 'Take admin away', onRemove: () => undefined });
    expect(html).toContain('aria-label="Take admin away"');
    expect(html).toContain('class="web-chip__remove"');
  });

  it('makes its label a button with onOpen, and is not still then', () => {
    const html = markup({ label: 'admin', removeLabel: 'x', onOpen: () => undefined });
    expect(html).toContain('class="web-chip__open"');
    expect(html).not.toContain('data-still');
    expect(markup({ label: 'admin', removeLabel: 'x' })).not.toContain('web-chip__open');
  });

  it('draws its border in its colour', () => {
    const html = markup({ label: 'admin', removeLabel: 'x', color: 'hsl(10 65% 52%)' });
    expect(html).toContain('data-colored="true"');
    expect(html).toContain('border-color:hsl(10 65% 52%)');
  });

  it('marks a held chip on, and titles it by its label unless told', () => {
    expect(markup({ label: 'ops', on: true, removeLabel: 'x' })).toContain('data-on="true"');
    expect(markup({ label: 'ops', removeLabel: 'x' })).toContain('title="ops"');
    expect(markup({ label: 'ops', title: 'ops · primary', removeLabel: 'x' })).toContain('title="ops · primary"');
  });
});

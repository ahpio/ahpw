import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PullRequestCard } from './PullRequests.js';
import { DESCRIPTION_LIMIT, plainDescription, type PullRequest } from './pull-requests.js';

const card = (pullRequest: PullRequest): string => renderToStaticMarkup(createElement(PullRequestCard, { pullRequest }));

const merged: PullRequest = {
  url: 'https://github.com/example/repo/pull/349', number: '349', repository: 'example/repo', state: 'merged',
  title: 'The host\'s instructions read apart', body: 'It **keeps** them apart.', isDraft: false, author: { login: 'octocat' },
  base: 'main', head: 'host/apart', createdAt: '2026-11-15T10:00:00Z', mergedAt: '2026-11-16T10:00:00Z',
};

describe('PullRequestCard', () => {
  it('draws the card with every part the host sent', () => {
    const html = card(merged);
    expect(html).toContain('href="https://github.com/example/repo"');
    expect(html).toContain('href="https://github.com/example/repo/pull/349"');
    expect(html).toContain('#349');
    expect(html).toContain('The host&#x27;s instructions read apart');
    expect(html).toContain('data-kind="merged"');
    expect(html).toContain('It keeps them apart.');
    expect(html).toContain('main');
    expect(html).toContain('host/apart');
    expect(html).toContain('octocat');
    expect(html).toContain('class="web-pr-card"');
  });

  it('shows an open draft as a draft', () => {
    expect(card({ ...merged, state: 'open', isDraft: true })).toContain('data-kind="draft"');
    expect(card({ ...merged, state: 'open', isDraft: false })).toContain('data-kind="open"');
  });

  it('draws no empty part for a field the host did not send', () => {
    const html = card({ url: merged.url, number: '349', repository: 'example/repo', state: 'open', author: { login: 'octocat' } });
    expect(html).not.toContain('web-pr-card__branches');
    expect(html).not.toContain('web-pr-card__title">#');
    expect(html).toContain('data-empty="true"');
  });

  it('keeps the plain card for a pull request the host sent no details for', () => {
    const html = card({ url: merged.url, number: '349', repository: 'example/repo', state: 'open', title: 'Fix the build' });
    expect(html).not.toContain('web-pr-card');
    expect(html).toContain('Fix the build');
  });

  it('shows a long description as plain text cut at 200 characters', () => {
    const body = `# Title\n\n- one *item*\n- [a link](https://example.com)\n\n\`\`\`ts\nconst x = 1;\n\`\`\`\n${'word '.repeat(80)}`;
    const shown = plainDescription(body) as string;
    expect(shown.startsWith('Title one item a link const x = 1; word')).toBe(true);
    expect(shown.endsWith('…')).toBe(true);
    expect(Array.from(shown).length).toBeLessThanOrEqual(DESCRIPTION_LIMIT + 1);
    expect(plainDescription('   ')).toBeUndefined();
    expect(plainDescription('Short.')).toBe('Short.');
  });
});

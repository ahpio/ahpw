import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HostAlert } from '../../bridges/plugins.js';
import { AlertList } from './AlertList.js';

const markup = (alerts: HostAlert[]): string => renderToStaticMarkup(createElement(AlertList, { alerts }));

describe('AlertList', () => {
  it('draws nothing with no alerts', () => {
    expect(markup([])).toBe('');
  });

  it('draws one box per level, loudest first, and skips an empty level', () => {
    const html = markup([
      { level: 'notice', text: 'fresh news' },
      { level: 'error', text: 'key missing' },
      { level: 'warning', text: 'call failed' },
    ]);
    expect(html.indexOf('key missing')).toBeLessThan(html.indexOf('call failed'));
    expect(html.indexOf('call failed')).toBeLessThan(html.indexOf('fresh news'));
    expect(html.match(/<ul class="web-alerts">/g)).toHaveLength(3);
  });

  it('keeps alerts of one level in one box, in the order given', () => {
    const html = markup([{ level: 'error', text: 'first' }, { level: 'error', text: 'second' }]);
    expect(html.match(/<ul class="web-alerts">/g)).toHaveLength(1);
    expect(html.indexOf('first')).toBeLessThan(html.indexOf('second'));
  });

  it('shows the ref and the time when the alert has them', () => {
    const html = markup([{ level: 'error', text: 'key missing', ref: 'env:API_KEY', at: '2026-11-11T12:00:00.000Z' }]);
    expect(html).toContain('<code class="web-alerts__ref">env:API_KEY</code>');
    expect(html).toContain('dateTime="2026-11-11T12:00:00.000Z"');
    const bare = markup([{ level: 'error', text: 'key missing' }]);
    expect(bare).not.toContain('web-alerts__ref');
    expect(bare).not.toContain('web-alerts__at');
  });
});

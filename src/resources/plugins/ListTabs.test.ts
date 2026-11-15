import { describe, expect, it } from 'vitest';
import { withoutBadges } from './ListTabs.js';

describe('withoutBadges', () => {
  it('takes out a line of badges, linked or not, and keeps every other line', () => {
    const readme = [
      '# @ahpd/bot',
      '',
      '[![npm](https://img.example.com/npm.svg)](https://www.npmjs.com/package/@ahpd/bot) [![CI](https://img.example.com/ci.svg)](https://ci.example.com)',
      '![license](https://img.example.com/license.svg)',
      '',
      'A bot plugin, with ![an inline image](x.png) in its text.',
    ].join('\n');
    expect(withoutBadges(readme)).toBe(['# @ahpd/bot', '', '', '', '', 'A bot plugin, with ![an inline image](x.png) in its text.'].join('\n'));
  });

  it('takes out a line of only HTML tags, and keeps a line with words around a tag', () => {
    const readme = [
      '<picture>',
      '  <source media="(prefers-color-scheme: light)" srcset="docs/media/shot-01-light.jpeg">',
      '  <img src="docs/media/shot-01-dark.jpeg" alt="ahpw with the session list">',
      '</picture>',
      'Press <kbd>Enter</kbd> to send.',
    ].join('\n');
    expect(withoutBadges(readme)).toBe(['', '', '', '', 'Press <kbd>Enter</kbd> to send.'].join('\n'));
  });
});

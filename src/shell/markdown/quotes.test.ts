import { describe, expect, it } from 'vitest';
import { quotesOf } from './quotes.js';

describe('quotesOf', () => {
  it('takes one level of > off', () => {
    expect(quotesOf('Say:\n\n> Hello **there**\n>\n> - a\n> - b\n\nok')).toEqual(['Hello **there**\n\n- a\n- b']);
  });
  it('finds each quote in order', () => {
    expect(quotesOf('> one\n\ntext\n\n> two')).toEqual(['one', 'two']);
  });
  it('keeps a nested quote inside its parent', () => {
    expect(quotesOf('> a\n>> b')).toEqual(['a\n> b']);
  });
  it('ignores a > inside a code fence', () => {
    expect(quotesOf('```\n> not\n```\n\n> yes')).toEqual(['yes']);
  });
});

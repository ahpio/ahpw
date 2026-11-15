import { describe, expect, it } from 'vitest';
import { sourceIcon, sourceWord } from './words.js';

describe('the source of a usage record', () => {
  it('shows the model gateway with its icon and its word', () => {
    expect(sourceIcon('gateway')).toBe('⇄');
    expect(sourceWord('gateway')).toBe('Gateway');
  });

  it('shows no icon for a source ahpw does not know, and its name as it is', () => {
    expect(sourceIcon('proxy')).toBe('');
    expect(sourceWord('proxy')).toBe('proxy');
  });
});

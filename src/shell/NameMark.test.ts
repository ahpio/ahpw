import { describe, expect, it } from 'vitest';
import { textToColor } from './NameMark.js';

describe('textToColor', () => {
  it('is grey for an empty name', () => {
    expect(textToColor('')).toBe('hsl(0 0% 60%)');
    expect(textToColor('   ')).toBe('hsl(0 0% 60%)');
  });

  it('ignores case, accents and the spaces around a name', () => {
    expect(textToColor(' José ')).toBe(textToColor('jose'));
  });

  it('keeps the hue of names that share their first three letters close', () => {
    const hue = (name: string): number => Number(/^hsl\((\d+) /.exec(textToColor(name))![1]);
    const gap = Math.abs(hue('developer') - hue('dev'));
    expect(Math.min(gap, 360 - gap)).toBeLessThanOrEqual(30);
  });
});

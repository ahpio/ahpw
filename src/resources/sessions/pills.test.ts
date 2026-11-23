import { describe, expect, it } from 'vitest';
import { pillCloses } from './pills.js';

describe('pillCloses', () => {
  it('closes the list on a second click on the pill that opened it', () => {
    expect(pillCloses('ahp.composer.model', 'ahp.composer.model', true)).toBe(true);
  });

  it('opens a list when another pill opened the one on screen, or none is on screen', () => {
    expect(pillCloses('ahp.composer.model', 'ahp.pullRequests', true)).toBe(false);
    expect(pillCloses('ahp.composer.model', 'ahp.composer.model', false)).toBe(false);
  });

  it('opens a list after the person typed, which leaves no pill as its opener', () => {
    expect(pillCloses(undefined, 'ahp.composer.model', true)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { marksRead } from './read-marks.js';

describe('marksRead', () => {
  it('marks a session read when it opens', () => {
    expect(marksRead(undefined, { resource: 'a', working: false })).toBe(true);
    expect(marksRead({ resource: 'a', working: false }, { resource: 'b', working: true })).toBe(true);
  });

  it('marks it read when its turn ends', () => {
    expect(marksRead({ resource: 'a', working: true }, { resource: 'a', working: false })).toBe(true);
  });

  it('leaves it while a turn runs, and when nothing ended, as after a Mark unread', () => {
    expect(marksRead({ resource: 'a', working: false }, { resource: 'a', working: true })).toBe(false);
    expect(marksRead({ resource: 'a', working: true }, { resource: 'a', working: true })).toBe(false);
    expect(marksRead({ resource: 'a', working: false }, { resource: 'a', working: false })).toBe(false);
  });
});

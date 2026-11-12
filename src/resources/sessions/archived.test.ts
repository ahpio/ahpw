import { describe, expect, it } from 'vitest';
import { closesOnArchive } from './archived.js';

describe('closesOnArchive', () => {
  it('closes a session that has just become archived', () => {
    expect(closesOnArchive(false, true, 'close')).toBe(true);
  });

  it('keeps a session that was archived when it opened', () => {
    expect(closesOnArchive(undefined, true, 'close')).toBe(false);
    expect(closesOnArchive(true, true, 'close')).toBe(false);
  });

  it('keeps a session that was unarchived, or not archived', () => {
    expect(closesOnArchive(true, false, 'close')).toBe(false);
    expect(closesOnArchive(false, false, 'close')).toBe(false);
  });

  it('keeps it when the person chose to stay', () => {
    expect(closesOnArchive(false, true, 'stay')).toBe(false);
  });
});

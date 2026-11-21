import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { isBeside, surfaceOf } from './beside.js';

describe('beside', () => {
  it('is true on the right sidebar, and false on main or in a window', () => {
    expect(isBeside('sidebar:right', false)).toBe(true);
    expect(isBeside('main', true)).toBe(false);
    expect(isBeside('window:1', true)).toBe(false);
  });

  it("holds the page's own value until the surface is found", () => {
    expect(isBeside(undefined, true)).toBe(true);
    expect(isBeside(undefined, false)).toBe(false);
  });

  it('follows a session tab as it moves', () => {
    const scena = createScena();
    scena.surfaces.open({ surface: 'main', key: 'session:h:a', resource: { component: 'SessionPage' } } as never);
    const beside = () => isBeside(surfaceOf(scena, 'session:h:a'), false);
    expect(beside()).toBe(false);
    scena.surfaces.move({ key: 'session:h:a', toSurface: 'sidebar:right' });
    expect(beside()).toBe(true);
    scena.surfaces.move({ key: 'session:h:a', toSurface: 'window:1' });
    expect(beside()).toBe(false);
  });
});

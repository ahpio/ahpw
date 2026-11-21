import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import { SURFACE_DEFAULTS } from './surfaces.js';

describe('SURFACE_DEFAULTS', () => {
  it('keeps dropped tabs and rows off the left sidebar, and its other defaults', () => {
    const scena = createScena({ surfaceDefaults: SURFACE_DEFAULTS });
    expect(scena.layout.get().surfaces['sidebar:left']).toMatchObject({ drops: false, visible: true, layout: 'single' });
    expect(scena.layout.get().surfaces['sidebar:right']).toMatchObject({ visible: true, layout: 'tab', size: 300 });
    expect(scena.layout.get().surfaces.main?.drops).toBeUndefined();
  });

  it('keeps drops off after a saved layout merges over it', async () => {
    const saved = { surfaces: { 'sidebar:left': { visible: false, size: 260 } } };
    const scena = createScena({ surfaceDefaults: SURFACE_DEFAULTS, layoutStorage: { load: async () => saved as never, save: async () => {}, clear: async () => {} } });
    await new Promise((done) => setTimeout(done, 0));
    expect(scena.layout.get().surfaces['sidebar:left']).toMatchObject({ drops: false, visible: false, size: 260 });
  });
});

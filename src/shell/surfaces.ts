import type { SurfaceLayoutState, SurfaceName } from '@softov/scena/types';
import { DEFAULT_SURFACE_LAYOUTS } from '@softov/scena/core';

/**
 * scena's surfaces as ahpw starts them. The right sidebar is open, its panes
 * as tabs: the open session's details and its changes. The left sidebar holds
 * the explorers, the app's own sections, so it takes no dropped tab or row.
 * A saved layout merges over these, so `drops: false` holds after a reload.
 */
export const SURFACE_DEFAULTS: Partial<Record<SurfaceName, SurfaceLayoutState>> = {
  ...DEFAULT_SURFACE_LAYOUTS,
  'sidebar:left': { ...DEFAULT_SURFACE_LAYOUTS['sidebar:left'], visible: DEFAULT_SURFACE_LAYOUTS['sidebar:left']?.visible ?? true, drops: false },
  'sidebar:right': { visible: true, layout: 'tab', size: 300 },
};

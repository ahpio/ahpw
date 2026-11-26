import type { BindingPath } from '@softov/scena/types';

/** The tunnel open in `main`, as `{ host, id }`. */
export const ACTIVE_TUNNEL = '$/ahp/activeTunnel' as BindingPath;

/** Whether any host this page connects to lists its tunnels; the Manage entry shows while one does. */
export const TUNNELS_SERVED = '$/ahp/tunnels/served' as BindingPath;

/** Whether the reader may run a create on any host this page connects to; the list's + shows while they may. */
export const MAY_ADD_TUNNEL = '$/ahp/tunnels/mayAdd' as BindingPath;

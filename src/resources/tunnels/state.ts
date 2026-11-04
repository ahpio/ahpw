import type { BindingPath } from '@softov/scena/types';

/** The tunnel open in `main`, as `{ host, id }`. */
export const ACTIVE_TUNNEL = '$/ahp/activeTunnel' as BindingPath;

/** Whether any host this page connects to lists its tunnels; the Manage entry shows while one does. */
export const TUNNELS_SERVED = '$/ahp/tunnels/served' as BindingPath;

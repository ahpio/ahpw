import type { BindingPath } from '@softov/scena/types';

/** The client open in `main`, as `{ host, id }`. */
export const ACTIVE_CLIENT = '$/ahp/activeClient' as BindingPath;

/** Whether any host this page connects to lists its clients; the Manage entry shows while one does. */
export const CLIENTS_SERVED = '$/ahp/clients/served' as BindingPath;

import type { BindingPath } from '@softov/scena/types';

/** Whether any host this page connects to lists its users; the activity bar entry shows while one does. */
export const USERS_SERVED = '$/ahp/users/served' as BindingPath;

/** Whether the reader may make a user on any host; a New control for one shows while they may. */
export const MAY_ADD_USER = '$/ahp/users/mayAdd' as BindingPath;

/** Whether the reader may make a role on any host; a New control for one shows while they may. */
export const MAY_ADD_ROLE = '$/ahp/roles/mayAdd' as BindingPath;

/** The user or role open in `main`, as `{ host, domain, id }`. */
export const ACTIVE_PERSON = '$/ahp/users/active' as BindingPath;

/** A user's or role's tab key: one tab each, and one for a new one. */
export const personTab = (kind: 'users' | 'roles', host: string, id: string | undefined): string => (id === undefined ? `${kind}:new` : `${kind}:${host}:${id}`);

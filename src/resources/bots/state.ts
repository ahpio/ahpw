import type { BindingPath } from '@softov/scena/types';

/** The bot open in `main`, as `{ host, slug }`. */
export const ACTIVE_BOT = '$/ahp/activeBot' as BindingPath;

/** Whether any host this page connects to serves bots; their activity bar entry and layer show while it does. */
export const BOTS_SERVED = '$/ahp/bots/served' as BindingPath;

/** The bot whose chat is being opened, as `refKey(host, slug)`, or null. */
export const BOT_CHAT_OPENING = '$/ahp/bots/chatOpening' as BindingPath;

/** The bot whose page is asked to show its edit form, as `refKey(host, slug)`, or null; the page takes it and clears it. */
export const BOT_EDIT_ASKED = '$/ahp/bots/editAsked' as BindingPath;

import { translate } from '@softov/scena';
import type { PickerAction } from '@softov/scena/types';
import type { SessionSummary, StateAction } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../bridges/data.js';
import { confirm, failed } from '../../shell/notify/index.js';
import { copyText } from '../../shell/controls/CopyButton.js';
import { EMOJIcon } from '../emojis.js';
import { isArchived, isRead } from './status.js';

/** What a session's acts are given besides the session: its pin, and what to do once it is deleted. */
export interface ActsOf {
  pinned: boolean;
  pin: () => void;
  /** Runs once the host has disposed of the session. */
  onDeleted?: () => void;
}

/**
 * What can be done to one session, in the order a menu offers it: pin, rename,
 * mark read, archive, then copy its link and delete it under *More*. The
 * session list's menu and the open session's `...` menu both draw these.
 */
export function sessionActs(host: string, session: SessionSummary, { pinned, pin, onDeleted }: ActsOf): PickerAction[] {
  const read = isRead(session.status);
  const archived = isArchived(session.status);
  const say = (action: StateAction): void => hostBridge(host).dispatch(session.resource, action);
  return [
    { title: translate(pinned ? 'sessions/explorer/unpin' : 'sessions/explorer/pin'), icon: EMOJIcon.pin, onSelect: (menu) => { menu.closeMenu(); pin(); } },
    {
      title: translate('sessions/explorer/rename'),
      onSelect: (menu) => {
        menu.closeMenu();
        const title = window.prompt(translate('sessions/explorer/renamePrompt'), session.title)?.trim();
        if (title !== undefined && title !== '' && title !== session.title) say({ type: 'session/titleChanged', title } as StateAction);
      },
    },
    { title: translate(read ? 'sessions/explorer/markUnread' : 'sessions/explorer/markRead'), onSelect: (menu) => { menu.closeMenu(); say({ type: 'session/isReadChanged', isRead: !read } as StateAction); } },
    { title: translate(archived ? 'sessions/explorer/unarchive' : 'sessions/explorer/archive'), onSelect: (menu) => { menu.closeMenu(); say({ type: 'session/isArchivedChanged', isArchived: !archived } as StateAction); } },
    { title: translate('sessions/explorer/copyLink'), group: 'more', onSelect: (menu) => { menu.closeMenu(); void copyText(session.resource); } },
    {
      title: translate('sessions/explorer/delete'),
      group: 'more',
      color: 'red',
      onSelect: (menu) => {
        menu.closeMenu();
        const title = session.title || translate('sessions/untitled');
        void confirm({ title: translate('sessions/explorer/deleteTitle', { title }), body: translate('sessions/explorer/deleteBody'), confirmLabel: translate('sessions/explorer/delete'), tone: 'danger' }).then((yes) => {
          if (!yes) return;
          hostBridge(host).request('disposeSession', { channel: session.resource }).then(
            () => onDeleted?.(),
            (error: unknown) => failed(translate('sessions/explorer/deleteFailed'), error),
          );
        });
      },
    },
  ];
}

import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { translate } from '@softov/scena';
import { droppedAt, endedOutside, openInWindow } from '@softov/scena';
import { endOpenDrag, startOpenDrag, useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Note, Spinner } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, titlePath, type Connection } from '../../bridges/data.js';
import { refKey, refOf, useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { folderLabel } from '../../bridges/words.js';
import { ExplorerList, type Dot, type Row } from '../../shell/explorer/ExplorerList.js';
import { ACTIVE_SESSION, SESSIONS_AGENT, SESSIONS_ARCHIVED, SESSIONS_GROUPING, SESSIONS_SHOW, SESSIONS_SORTING, SESSIONS_THEN_BY, type ActiveSession } from './state.js';
import { DEFAULT_SORTING, sortSessions, type Sorting } from './sorting.js';
import { SESSIONS_PINS, togglePin } from './pins.js';
import { plural, dateFormat } from '../../i18n/locales.js';
import { activityLabel, activityOf, isArchived, isRead, shows, type Activity, type SessionShow } from './status.js';
import { arrangeTwo, groupOf, type Group, type Grouping } from './grouping.js';
import { sessionActs } from './acts.js';
import { sessionKey } from './focus.js';

const sameDay = dateFormat({ hour: '2-digit', minute: '2-digit' });
const otherDay = dateFormat({ month: 'short', day: 'numeric' });

/** When a session last changed: the time today, the date before. */
function changedAt(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return (date.toDateString() === now.toDateString() ? sameDay : otherDay).format(date);
}

const DOT: Record<Activity, Dot> = { input: 'attention', running: 'working', error: 'failed', idle: 'quiet' };

/** A folder's last segment, which is what tells two sessions apart. */
const baseOf = (uri: string): string => folderLabel(uri).replace(/\/+$/, '').split('/').pop() ?? uri;

/** What the menu of a session on the host `host` offers: *Open*, then the session's acts. */
function menuOf(host: string, session: SessionSummary, open: () => void, pinned: boolean, pin: () => void): PickerAction[] {
  return [
    { title: translate('sessions/explorer/open'), onSelect: (menu) => { menu.closeMenu(); open(); } },
    ...sessionActs(host, session, { pinned, pin }),
  ];
}

/** What a session row's drag carries: the session's page, as a surface opens it. */
function rowDrag(key: string) {
  const { host, id } = refOf(key);
  return {
    key: sessionKey(host, id),
    resource: { component: 'SessionPage', host, resource: id },
    props: { title: { path: titlePath(host, id) } },
  };
}

/** One session and the host it is on. */
interface Entry {
  host: string;
  session: SessionSummary;
}

/** The sidebar: the shown hosts' sessions, newest change first. */
export default function SessionExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useShownHosts();
  const hostName = useHostNames();
  const multi = embedMode() === 'multi';
  const connections = useEach<Connection>(hosts.map((host) => ahpPaths(host).connection));
  const lists = useEach<SessionSummary[]>(hosts.map((host) => ahpPaths(host).sessions));
  const agentLists = useEach<AgentInfo[]>(hosts.map((host) => ahpPaths(host).agents));
  const active = useStore<ActiveSession>(ACTIVE_SESSION);
  const archived = useStore<boolean>(SESSIONS_ARCHIVED) === true;
  const grouping = useStore<Grouping | null>(SESSIONS_GROUPING) ?? 'none';
  const thenBy = useStore<Grouping | null>(SESSIONS_THEN_BY) ?? 'none';
  const sorting = useStore<Sorting>(SESSIONS_SORTING) ?? DEFAULT_SORTING;
  const show = useStore<SessionShow | null>(SESSIONS_SHOW) ?? 'all';
  const agent = useStore<string | null>(SESSIONS_AGENT) ?? null;
  const pins = useStore<string[]>(SESSIONS_PINS);

  const open = (key: string): void => {
    const { host, id } = refOf(key);
    void scena.commands.execute('ahp.openSession', { host, resource: id });
  };
  // Each session's row, by its summary object, so a change to one session builds one row again and
  // the list keeps the others' objects, which ExplorerList's rows compare. Anything else a row reads
  // starts a new cache.
  const built = useRef<{ inputs: readonly unknown[]; rows: WeakMap<SessionSummary, Row> }>({ inputs: [], rows: new WeakMap() });
  const rows = useMemo<Row[]>(
    () => {
      const inputs = [hosts, agentLists, archived, show, agent, grouping, thenBy, sorting, pins, hostName, t, multi, new Date().toDateString()];
      if (inputs.length !== built.current.inputs.length || inputs.some((one, at) => one !== built.current.inputs[at])) built.current = { inputs, rows: new WeakMap() };
      const cache = built.current.rows;
      const agentName = (host: string, provider: string): string => agentLists[hosts.indexOf(host)]?.find((candidate) => candidate.provider === provider)?.displayName ?? provider;
      const entries = hosts.flatMap((host, at) => (lists[at] ?? []).map((session): Entry => ({ host, session })));
      const kept = sortSessions(entries.filter((one) => (archived || !isArchived(one.session.status)) && shows(one.session.status, show) && (agent === null || one.session.provider === agent)), (one) => one.session, sorting);
      const pinned = new Set(pins ?? []);
      const isPinned = ({ host, session }: Entry): boolean => pinned.has(refKey(host, session.resource));
      const now = new Date();
      const by = (key: Grouping) => ({ host, session }: Entry) => groupOf(session, key, (provider) => agentName(host, provider), { key: host, label: hostName(host) }, now);
      const second = thenBy === 'none' || thenBy === grouping || grouping === 'none' ? undefined : by(thenBy);
      // Pinned sessions on top, whatever the grouping; with no grouping the rest go under a heading of their own, so the pinned ones read apart.
      const PINNED: Group = { key: '#pinned', label: t('sessions/grouping/pinned') };
      const OTHERS: Group = { key: '#others', label: t('sessions/grouping/others') };
      const first = (entry: Entry): Group | undefined => (grouping === 'none' ? (pinned.size === 0 ? undefined : OTHERS) : by(grouping)(entry));
      const top = kept.filter(isPinned);
      const rest = arrangeTwo(kept.filter((one) => !isPinned(one)), first, second);
      return [...top.map((entry) => ({ entry, group: PINNED as Group | undefined, sub: undefined as Group | undefined })), ...rest.map((entry) => {
        const group = first(entry);
        const inner = second?.(entry);
        return { entry, group, sub: group === undefined || inner === undefined ? undefined : { key: `${group.key}/${inner.key}`, label: inner.label } };
      })].map(({ entry, group: inGroup, sub }): Row => {
        const { host, session: one } = entry;
        // A time grouping can move a session that did not change, so its headings are checked too.
        const kept = cache.get(one);
        if (kept !== undefined && kept.group?.key === inGroup?.key && kept.subgroup?.key === sub?.key) return kept;
        const activity = activityOf(one.status);
        const unread = activity === 'idle' && !isRead(one.status);
        const agent = agentName(host, one.provider);
        const folder = one.workingDirectories?.[0];
        // In a window with every host, each row says its host first.
        const second = [multi && grouping !== 'host' ? hostName(host) : undefined, agent, folder === undefined ? undefined : baseOf(folder)].filter((bit) => bit !== undefined).join(' \u{00B7} ');
        const changes = one.changes;
        // The counts on every row that has any, and a running row's activity under them, as ahpapp shows both.
        const counts = changes !== undefined && (changes.additions ?? 0) + (changes.deletions ?? 0) > 0
          ? <><span className="web-diff--add">+{changes.additions ?? 0}</span> <span className="web-diff--remove">-{changes.deletions ?? 0}</span>{changes.files === undefined ? '' : ` \u{00B7} ${plural('sessions/explorer/files', changes.files)}`}</>
          : undefined;
        // A host clears the activity with null, since a change over JSON cannot send undefined.
        const said = one.activity ?? '';
        const doing = activity !== 'idle'
          ? `${activityLabel(activity)}${said === '' ? '' : ` \u{00B7} ${said}`}`
          : undefined;
        const row: Row = {
          key: refKey(host, one.resource),
          dot: isArchived(one.status) ? 'off' : unread ? 'fresh' : DOT[activity],
          dotLabel: isArchived(one.status) ? t('sessions/status/archived') : unread ? t('sessions/status/unread') : activityLabel(activity),
          title: one.title === '' ? t('sessions/untitled') : one.title,
          time: changedAt(one.modifiedAt),
          lines: [second, counts, doing].filter((line) => line !== undefined),
          menu: menuOf(host, one, () => open(refKey(host, one.resource)), isPinned(entry), () => togglePin(scena.store, refKey(host, one.resource))),
          strong: unread,
          ...(inGroup === undefined ? {} : { group: inGroup }),
          ...(sub === undefined ? {} : { subgroup: sub }),
        };
        cache.set(one, row);
        return row;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hosts, lists, agentLists, archived, show, agent, grouping, thenBy, sorting, pins, hostName, t],
  );

  // One host's notice in mono; in multi a host that is down says so in its own place (hosts plan 02 task 03).
  const connection = multi ? undefined : connections[0];
  const sessions = multi ? lists.find((one) => one !== undefined) : lists[0];
  const notice = connection?.status === 'failed'
    ? <Alert tone="danger" title={t('sessions/explorer/notConnected')} message={connection.error ?? t('sessions/explorer/refused')} />
    : connection?.status !== 'connected' && sessions === undefined
      ? <Spinner label={t('sessions/explorer/connecting')} />
      : rows.length === 0 ? <Note>{show !== 'all' || agent !== null ? t('sessions/explorer/noneShown') : archived ? t('sessions/explorer/none') : t('sessions/explorer/noneYet')}</Note> : null;

  return (
    <ExplorerList
      label={t('sessions/explorer/title')}
      rows={rows}
      selected={active === undefined ? null : refKey(active.host, active.resource)}
      onOpen={open}
      // A row drags onto a surface, where the session opens or its tab moves, or onto a composer as a reference.
      onRowDragStart={(event, row) => startOpenDrag(event.dataTransfer, rowDrag(row.key))}
      // Dropped outside the browser, where nothing took it, the session opens in a window of its own there, as a tab dragged out does.
      onRowDragEnd={(event, row) => {
        endOpenDrag();
        const win = event.currentTarget.ownerDocument.defaultView;
        if (win === null || !endedOutside(win, event)) return;
        openInWindow(scena, rowDrag(row.key), droppedAt(win, event.screenX, event.screenY));
      }}
      notice={notice}
      filterLabel={t('sessions/explorer/filter')}
      hostLines={multi}
    />
  );
}

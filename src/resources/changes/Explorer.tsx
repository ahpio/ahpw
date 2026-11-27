import { useMemo, useState, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, ContextMenu, Divider, Note, Panel, Segments, Spinner, Toolbar, Tree, type TreeNode } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';
import { sessionReducer, type ChangesetOperation, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge, summaryPath } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { ACTIVE_SESSION, type ActiveSession } from '../sessions/state.js';
import { openAsItems, viewersOf } from '../files/viewers.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { copyText } from '../../ui/control/CopyButton.js';
import { done, failed } from '../../shell/notify/index.js';
import { iconOf, openChange, scoped, toneOf, useChangeset } from './changeset.js';
import { ChangesetForms } from './Forms.js';
import { changeCopies, firstScope, folderCopies, folderTree, groupChanges, letterOf, relativeDir, scopesOf, sortChanges, type Change, type ChangeFolder, type ChangeGrouping, type ChangeSort, type CopyTexts } from './words.js';
import '../files/diff-page.css';
import '../../shell/explorer/explorer-list.css';
import './explorer.css';

/** How the files are drawn: one row each with its folder beside it, or under their folders. */
type View = 'list' | 'tree';

const VIEW_KEY = 'ahpd-web.changes-view';
const GROUPING_KEY = 'ahpd-web.changes-grouping';
const SORT_KEY = 'ahpd-web.changes-sort';
const SORTS: readonly ChangeSort[] = ['name', 'path', 'status'];


function readKept<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const held = localStorage.getItem(key);
    return allowed.find((one) => one === held) ?? null;
  } catch {
    return null;
  }
}

function keep(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not kept, which only means the next visit starts from the default.
  }
}

/** The message each letter is read as. */
const WORD: Record<ReturnType<typeof letterOf>, string> = { A: 'changes/status/added', M: 'changes/status/modified', D: 'changes/status/deleted', U: 'changes/status/untracked' };

/** The sidebar: what the open session changed, by file, with the host's operations on it. */
export default function ChangesExplorer(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const opened = useStore<ActiveSession>(ACTIVE_SESSION);
  // The active session's host; nothing is read while no session is open.
  const at = opened?.host ?? '';
  const active = opened?.resource;
  const summary = useStore<SessionSummary>(active === undefined ? undefined : summaryPath(at, active));
  const session = useChannel<SessionState>(at, active, sessionReducer);
  const scopes = useMemo(() => scopesOf(session.state?.changesets), [session.state?.changesets]);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const scope = scopes.find((one) => one.uri === chosen) ?? firstScope(scopes);
  const changes = useChangeset(at, scope?.uri);
  const { files, operations } = changes;
  const workspace = summary?.workingDirectories?.[0] ?? null;

  const [view, setView] = useState<View>(() => readKept<View>(VIEW_KEY, ['list', 'tree']) ?? 'list');
  const [picked, setPicked] = useState<ChangeGrouping | null>(() => readKept<ChangeGrouping>(GROUPING_KEY, ['review', 'staging', 'none']));
  const review = scope?.review === true;
  const staging = files.some((one) => one.staged || one.unstaged);
  const groupings: ChangeGrouping[] = [...(review ? ['review' as const] : []), ...(staging ? ['staging' as const] : []), 'none'];
  const grouping = picked !== null && groupings.includes(picked) ? picked : groupings[0] ?? 'none';
  const [sort, setSort] = useState<ChangeSort>(() => readKept<ChangeSort>(SORT_KEY, SORTS) ?? 'path');

  const [filter, setFilter] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: PickerAction[] } | null>(null);

  const fileOps = operations.filter((one) => scoped(one, 'resource'));
  // Create PR prepares before it asks, so Prepare PR beside it would open the same form.
  const offersCreate = operations.some((one) => one.id === 'create-pr');
  const whole = operations.filter((one) => scoped(one, 'changeset') && !(offersCreate && one.id === 'prepare-pull-request'));
  const busy = (operation: ChangesetOperation): boolean => String(operation.status) === 'running';

  /** Copy name, Copy path and Copy relative path, the last only inside the session's folder. */
  const copyItems = (texts: CopyTexts): PickerAction[] => {
    const item = (kind: 'name' | 'path' | 'relative', text: string): PickerAction => ({
      title: t(`changes/copy/${kind}`),
      icon: kind === 'name' ? EMOJIcon.copyText : EMOJIcon.link,
      onSelect: (host) => {
        host.closeMenu();
        void copyText(text).then((copied) => (copied ? done(t(`changes/copied/${kind}`)) : failed(t('changes/copyFailed'), new Error('copy'), { source: 'changes.copy' })));
      },
    });
    return [item('name', texts.name), item('path', texts.path), ...(texts.relative === null ? [] : [item('relative', texts.relative)])];
  };

  const menuOf = (change: Change): PickerAction[] => {
    const items: PickerAction[] = [{ title: t('changes/openChange'), onSelect: (host) => { host.closeMenu(); openChange(scena, at, change, scope?.uri, review); } }];
    if (change.status !== 'deleted') {
      items.push({ title: t('changes/openFile'), onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.openFile', { uri: change.file }); } });
      items.push(...openAsItems(scena, at, change.file, viewersOf(scena, change.file)[0]?.component ?? null));
    }
    items.push(...copyItems(changeCopies(change, workspace)));
    if (review) {
      items.push({ title: t(change.reviewed ? 'changes/markNotReviewed' : 'changes/markReviewed'), onSelect: (host) => { host.closeMenu(); changes.review([change], !change.reviewed); } });
    }
    for (const operation of fileOps) {
      items.push({
        title: operation.label,
        ...(operation.description === undefined ? {} : { tooltip: operation.description }),
        group: 'file',
        ...(operation.confirmation === undefined ? {} : { color: 'red' }),
        onSelect: (host) => { host.closeMenu(); void changes.run(operation, change); },
      });
    }
    return items;
  };

  /** A row's end: counts and letter, which a hover swaps for the row's actions. */
  const endOf = (change: Change): ReactNode => {
    const letter = letterOf(change);
    const act = (event: MouseEvent, then: () => void): void => {
      event.stopPropagation();
      then();
    };
    return (
      <span className="web-change__end">
        <span className="web-change__actions">
          {review ? (
            <Button variant="subtle" shape="icon" size="xs" title={t(change.reviewed ? 'changes/markNotReviewed' : 'changes/markReviewed')} ariaLabel={t(change.reviewed ? 'changes/markNotReviewed' : 'changes/markReviewed')} pressed={change.reviewed} onClick={(event) => act(event, () => changes.review([change], !change.reviewed))}>
              {EMOJIcon.check}
            </Button>
          ) : null}
          {change.status === 'deleted' ? null : (
            <Button variant="subtle" shape="icon" size="xs" title={t('changes/openFile')} ariaLabel={t('changes/openFile')} onClick={(event) => act(event, () => void scena.commands.execute('ahp.openFile', { uri: change.file }))}>
              {EMOJIcon.file}
            </Button>
          )}
          {fileOps.map((operation) => (
            <Button variant="subtle" shape="icon" size="xs" key={operation.id} title={operation.label} ariaLabel={operation.label} disabled={busy(operation)} onClick={(event) => act(event, () => void changes.run(operation, change))}>
              {iconOf(operation)}
            </Button>
          ))}
        </span>
        <span className="web-change__counts">
          {change.added === undefined && change.removed === undefined ? null : <><span className="web-diff--add">+{change.added ?? 0}</span> <Note inline tone="danger">-{change.removed ?? 0}</Note></>}
        </span>
        <span className="web-change__letter" data-letter={letter} title={t(WORD[letter])}>{letter}</span>
      </span>
    );
  };

  const needle = filter.trim().toLowerCase();
  const shown = needle === '' ? files : files.filter((one) => `${relativeDir(one.dir, workspace)}/${one.name}`.toLowerCase().includes(needle));
  const groups = groupChanges(sortChanges(shown, sort, workspace), grouping);

  // The rows, and which change or folder each row stands for, for its menu.
  const byKey = new Map<string, Change>();
  const folderByKey = new Map<string, ChangeFolder>();
  const nodes = ((): TreeNode<Change>[] => {
    const fileNode = (change: Change, group: string): TreeNode<Change> => {
      const key = `${group}|${change.id}`;
      byKey.set(key, change);
      const dir = relativeDir(change.dir, workspace);
      return {
        key,
        label: (
          <span className="web-change" data-reviewed={change.reviewed ? 'true' : 'false'} data-deleted={change.status === 'deleted' ? 'true' : 'false'} title={`${dir}/${change.name}`}>
            <span className="web-change__name">{change.name}</span>
            {view === 'list' && dir !== '.' ? <span className="web-change__dir">{dir}</span> : null}
          </span>
        ),
        icon: viewersOf(scena, change.file)[0]?.opens?.icon ?? EMOJIcon.file,
        trailing: endOf(change),
        data: change,
      };
    };
    const folderNode = (folder: ChangeFolder, group: string): TreeNode<Change> => {
      const key = `${group}|dir:${folder.path}`;
      folderByKey.set(key, folder);
      return {
        key,
        label: <span className="web-change__name" title={folder.path}>{folder.name}</span>,
        icon: EMOJIcon.folder,
        children: [...folder.folders.map((one) => folderNode(one, group)), ...folder.changes.map((one) => fileNode(one, group))],
      };
    };
    const bodyOf = (list: Change[], group: string): TreeNode<Change>[] => {
      if (view === 'list') return list.map((one) => fileNode(one, group));
      const root = folderTree(list, workspace);
      return [...root.folders.map((one) => folderNode(one, group)), ...root.changes.map((one) => fileNode(one, group))];
    };
    return grouping === 'none'
      ? bodyOf(groups[0]?.changes ?? [], 'all')
      : groups.map((group): TreeNode<Change> => ({
        key: `group:${group.key}`,
        icon: '',
        label: <span className="web-change__group">{group.label}</span>,
        trailing: <span className="web-explorer__count">{group.changes.length}</span>,
        children: bodyOf(group.changes, group.key),
      }));
  })();

  // Every group and folder starts open; what is kept is what a person closed.
  const branches: string[] = [];
  const walk = (list: TreeNode<Change>[]): void => {
    for (const node of list) {
      if (node.children === undefined) continue;
      branches.push(node.key);
      walk(node.children);
    }
  };
  walk(nodes);
  const expanded = new Set(branches.filter((key) => !collapsed.has(key)));

  const openMenu = (event: MouseEvent<HTMLElement>): void => {
    const key = (event.target as HTMLElement).closest<HTMLElement>('[data-key]')?.dataset.key;
    if (key === undefined) return;
    const change = byKey.get(key);
    const folder = folderByKey.get(key);
    const items = change !== undefined ? menuOf(change) : folder !== undefined ? copyItems(folderCopies(folder, workspace)) : null;
    if (items === null) return;
    event.preventDefault();
    setSelected(key);
    setMenu({ x: event.clientX, y: event.clientY, items });
  };

  const status = String(changes.state?.status ?? '');
  const notice = (
    <>
        {active === undefined ? <Note inset>{t('changes/noSession')}</Note> : null}
        {active !== undefined && session.state !== undefined && scopes.length === 0 ? <Note inset>{t('changes/untracked')}</Note> : null}
        {changes.said === null ? null : <Alert tone={changes.said.tone} message={changes.said.text} />}
        {changes.error === null ? null : <Alert tone="danger" title={t('changes/notReadable')} message={changes.error} />}
        {changes.state?.error === undefined ? null : <Alert tone="danger" message={changes.state.error.message} />}
        {scope !== undefined && (changes.state === undefined || status === 'computing') && changes.error === null ? <Spinner label={t('changes/computing')} /> : null}
        {changes.state !== undefined && status !== 'computing' && files.length === 0 ? <Note inset>{t('changes/none')}</Note> : null}
      </>
    );

    const headButton = (icon: string, label: string, run: (event: MouseEvent<HTMLButtonElement>) => void, extra?: { on?: boolean; busy?: boolean; disabled?: boolean; tone?: 'blue' | 'yellow' | 'red' | null }): ReactElement => (
      <Button variant="subtle" shape="icon" key={label} title={label} ariaLabel={label} pressed={extra?.on} busy={extra?.busy === true} tone={extra?.tone ?? undefined} disabled={extra?.disabled} onClick={run}>
        {icon}
      </Button>
    );

    const showAs = (next: View): void => {
      setView(next);
      keep(VIEW_KEY, next);
    };

    const openScopes = (event: MouseEvent<HTMLButtonElement>): void => {
      const box = event.currentTarget.getBoundingClientRect();
      const items: PickerAction[] = scopes.map((one) => ({
        title: one.label,
        icon: one.uri === scope?.uri ? EMOJIcon.check : '',
        onSelect: (host) => { host.closeMenu(); setChosen(one.uri); },
      }));
      setMenu({ x: box.left, y: box.bottom, items });
    };

    const openOptions = (event: MouseEvent<HTMLButtonElement>): void => {
      const box = event.currentTarget.getBoundingClientRect();
      const mark = (on: boolean): { icon: string } => ({ icon: on ? EMOJIcon.check : '' });
      const items: PickerAction[] = whole.map((operation) => {
        const tone = toneOf(operation);
        return {
          title: operation.label,
          ...(operation.description === undefined ? {} : { tooltip: operation.description }),
          group: 'changes',
          icon: iconOf(operation),
          ...(tone === null ? {} : { color: tone }),
          disabled: busy(operation),
          onSelect: (host) => { host.closeMenu(); void changes.run(operation); },
        };
      });
      items.push(
        { title: t('changes/view/list'), group: 'view', ...mark(view === 'list'), onSelect: (host) => { host.closeMenu(); showAs('list'); } },
        { title: t('changes/view/tree'), group: 'view', ...mark(view === 'tree'), onSelect: (host) => { host.closeMenu(); showAs('tree'); } },
      );
      if (groupings.length > 1) {
        for (const one of groupings) {
          items.push({ title: t(`changes/grouping/${one}`), group: 'group', ...mark(one === grouping), onSelect: (host) => { host.closeMenu(); setPicked(one); keep(GROUPING_KEY, one); } });
        }
      }
      for (const one of SORTS) {
        items.push({ title: t(`changes/sort/${one}`), group: 'sort', ...mark(one === sort), onSelect: (host) => { host.closeMenu(); setSort(one); keep(SORT_KEY, one); } });
      }
      if (branches.length > 0) {
        items.push({ title: t('changes/expandAll'), group: 'folders', icon: '', onSelect: (host) => { host.closeMenu(); setCollapsed(new Set()); } });
        items.push({ title: t('changes/collapseAll'), group: 'folders', icon: '', onSelect: (host) => { host.closeMenu(); setCollapsed(new Set(branches)); } });
      }
      setMenu({ x: Math.max(0, box.right - 200), y: box.bottom, items });
    };

    const added = files.reduce((sum, one) => sum + (one.added ?? 0), 0);
    const removed = files.reduce((sum, one) => sum + (one.removed ?? 0), 0);

    return (
      <>
      <Panel
        title={summary === undefined ? t('changes/title') : t('changes/titleOf', { title: summary.title || t('changes/untitled') })}
        {...(summary === undefined ? {} : { titleHint: summary.title })}
        actions={scope === undefined ? null : (
          <>
            {whole.map((operation) => headButton(iconOf(operation), operation.label, () => void changes.run(operation), {
              busy: busy(operation),
              disabled: busy(operation),
              tone: toneOf(operation),
            }))}
            {whole.length === 0 ? null : <Divider axis="vertical" />}
            {headButton(EMOJIcon.reload, t('common/reload'), () => void hostBridge(at).refresh(scope.uri))}
            {headButton(EMOJIcon.more, t('changes/viewOptions'), openOptions)}
          </>
        )}
        bars={scope === undefined ? null : (
          <Toolbar>
            {scopes.length > 1 ? (
              <Button variant="tool" title={scope.description ?? scope.label} hasPopup="menu" onClick={openScopes}>
                {scope.label} <span aria-hidden="true">{EMOJIcon.caretDown}</span>
              </Button>
            ) : (
              <span className="web-changes__scope web-changes__scope--only" title={scope.description ?? scope.label}>{scope.label}</span>
            )}
            {files.length === 0 ? null : (
              // A narrow pane has room for the file icon and the count; the words are its tip.
              <span className="web-changes__totals" title={plural('changes/files', files.length)}>
                <span aria-label={plural('changes/files', files.length)}><span aria-hidden="true">{EMOJIcon.file}</span> {files.length}</span>
                {' '}<span className="web-diff--add">+{added}</span> <Note inline tone="danger">{'\u{2212}'}{removed}</Note>
              </span>
            )}
            <Segments
              label={t('changes/view/showAs')}
              options={[{ id: 'list', label: t('changes/view/list'), icon: EMOJIcon.log }, { id: 'tree', label: t('changes/view/tree'), icon: EMOJIcon.tree }] as const}
              value={view}
              onChange={showAs}
            />
          </Toolbar>
        )}
        {...(files.length === 0 ? {} : { filter: { value: filter, label: t('changes/filter'), onChange: setFilter } })}
        notice={notice}
        onContextMenu={openMenu}
      >
        <Tree<Change>
          nodes={nodes}
          selectedKey={selected}
          expanded={expanded}
          onExpandedChange={(next) => setCollapsed(new Set(branches.filter((key) => !next.has(key))))}
          onSelect={(node) => {
            if (node.data === undefined) {
              setCollapsed((held) => {
                const next = new Set(held);
                if (!next.delete(node.key)) next.add(node.key);
                return next;
              });
              return;
            }
            setSelected(node.key);
            openChange(scena, at, node.data, scope?.uri, review);
          }}
        />
        {needle !== '' && shown.length === 0 ? <Note inset>{t('changes/noMatch')}</Note> : null}
      </Panel>
      <ChangesetForms form={changes.form} files={files} onCommit={changes.commit} onPullRequest={changes.pullRequest} onClose={changes.closeForm} />
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </>
  );
}

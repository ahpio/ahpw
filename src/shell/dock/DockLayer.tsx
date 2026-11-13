import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import type { HostCtx, PickerAction, ScenaLayout } from '@softov/scena/types';
import type { SessionSummary } from '@microsoft/agent-host-protocol';
import { randomTransit, type BoodTransit } from '@cofold/bood';
import { canonicalShortcut, ContextMenu } from '@softov/scena/ui';
import { useChannelOnEach } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { refKey, refOf, useEach, useShownHosts } from '../../bridges/hosts.js';
import { useServingHosts } from '../../bridges/served.js';
import { Bood } from '../../resources/bots/Bood.js';
import { BOTS, BOTS_SCHEME, botsReducer, type BotRecord, type BotsState } from '../../resources/bots/catalogue.js';
import { BotPopover } from '../../resources/bots/layer/BotPopover.js';
import { botsInShownChats, shownMountKeys } from '../../resources/bots/layer/shown.js';
import { done } from '../notify/say.js';
import { ACTION_GROUPS, ACTION_HOME, actionOf, DOCK_ACTIONS, DOCKS_PATH, docksOf, isAction, setDocks, type DockAction } from './actions.js';
import { BOT_HOME, fillDocks, isFloating, isRow, joinDock, moveDock, snapDock, splitCluster, takeOut, type Dock, type DockPlace, type Edge } from './docks.js';
import { isMovable, isShownItem, leaveGroup, moveGroupOf, joinGroup, newDockId } from './moves.js';
import './dock.css';

/** How wide a floating bot is drawn. */
const WIDTH = 48;
/** How far the pointer moves before a press is a drag, not a click. */
const DRAG_PX = 6;
/** How long a press is held before a drag takes the whole dock. */
const HOLD_MS = 300;
/** How long a press held still is, at least, to open the item's menu when it lets go. */
const MENU_HOLD_MS = 550;
/** How long a dropped item takes to show at its new place, as ahpapp. */
const ARRIVE_MS = 1300;
/** Below this window width, the palette button drops its keys and most of its words. */
const NARROW_PX = 700;

interface Opened {
  key: string;
  x: number;
  y: number;
}

/** A press on an item, and the drag it may become. */
interface Press {
  key: string;
  dock: Dock;
  x: number;
  y: number;
  at: number;
  timer: number;
  /** The items it moves, once it is a drag, and whether they are the whole dock. */
  items?: string[];
  whole?: boolean;
}

interface Drag {
  items: string[];
  x: number;
  y: number;
  /** The dock it would join, and where among the items it keeps. */
  target: { dock: string; index: number } | null;
  /** Where it would rest when it joins no dock. */
  place: DockPlace | null;
}

/** The popover's size, as its CSS draws it, so it opens clear of the dock it came from. */
const POPOVER = { width: 320, height: 132 };

/** Where a popover opens: off the dock's edge, toward the middle of the window. */
function besideOf(box: DOMRect, place: DockPlace): { x: number; y: number } {
  if (isFloating(place)) return { x: box.left, y: box.bottom + 8 };
  switch (place.edge) {
    case 'right':
      return { x: box.left - POPOVER.width - 8, y: box.top };
    case 'left':
      return { x: box.right + 8, y: box.top };
    case 'bottom':
      return { x: box.left, y: box.top - POPOVER.height - 8 };
    case 'top':
      return { x: box.left, y: box.bottom + 8 };
  }
}

const PLUS = (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
const FIND = (
  <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M9.2 9.2L12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
);
const LOCK = (
  <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><rect x="1.5" y="4.5" width="7" height="5" rx="1" fill="currentColor" /><path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
);

function useWindowWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const resized = (): void => setWidth(window.innerWidth);
    window.addEventListener('resize', resized);
    return () => window.removeEventListener('resize', resized);
  }, []);
  return width;
}

/**
 * The docks at the window's edges and over it: the shown hosts' bots and the
 * dock's actions. A bot does what it did in its pucks: hovering one makes it
 * look up, opening one makes it glad and lets a person talk to it. An action
 * runs its command on a click. Either drags out and rests on the nearest
 * edge, or joins the dock it is dropped on where the caret shows; held
 * first, the whole dock moves; an action dropped away from the edges floats.
 * A right click or a press held still opens the item's menu. Where they rest
 * is kept in this browser.
 */
export default function DockLayer(): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  const hosts = useServingHosts(useShownHosts(), BOTS_SCHEME);
  const { states } = useChannelOnEach<BotsState>(hosts, BOTS, botsReducer);
  // Read for their changes; each value is read through its choice below.
  useStore(DOCKS_PATH);
  useStore(ACTION_GROUPS.path);
  for (const one of DOCK_ACTIONS) {
    // DOCK_ACTIONS does not change, so the hooks keep their order.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useStore(one.shown.path);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useStore(one.position.path);
  }
  const width = useWindowWidth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [menu, setMenu] = useState<Opened | null>(null);
  const [overflow, setOverflow] = useState<{ x: number; y: number; bots: string[] } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [refused, setRefused] = useState<string | null>(null);
  // The items just dropped, each bot with the transit it shows with; the `at` tells a drop from the last one.
  const [arriving, setArriving] = useState<{ items: ReadonlyMap<string, BoodTransit>; at: number } | null>(null);
  useEffect(() => {
    if (arriving === null) return;
    const timer = window.setTimeout(() => setArriving((held) => (held === arriving ? null : held)), ARRIVE_MS);
    return () => window.clearTimeout(timer);
  }, [arriving]);
  useEffect(() => {
    if (refused === null) return;
    const timer = window.setTimeout(() => setRefused(null), 900);
    return () => window.clearTimeout(timer);
  }, [refused]);
  const [layout, setLayout] = useState<ScenaLayout>(() => scena.layout.get());
  useEffect(() => {
    setLayout(scena.layout.get());
    const watch = scena.layout.subscribe(setLayout);
    return () => watch.dispose();
  }, [scena]);
  // A closed tab can leave the layout as it was, so a mount's open and close count too.
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    const bump = (): void => setMounted((count) => count + 1);
    const opened = scena.events.on('scena:mount:opened', bump);
    const closed = scena.events.on('scena:mount:closed', bump);
    return () => {
      opened.dispose();
      closed.dispose();
    };
  }, [scena]);
  const sessionLists = useEach<SessionSummary[]>(hosts.map((host) => ahpPaths(host).sessions));
  const away = useMemo(
    () => botsInShownChats(shownMountKeys(layout, (surface) => scena.surfaces.listAt(surface).map((mount) => mount.key)), hosts, sessionLists),
    // `mounted` changes as `scena.surfaces` does, which the memo reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scena, layout, mounted, hosts, sessionLists],
  );
  const press = useRef<Press | null>(null);
  const dockBoxes = useRef(new Map<string, HTMLDivElement>());
  const itemBoxes = useRef(new Map<string, HTMLElement>());

  const bots = useMemo(() => {
    const all = new Map<string, BotRecord>();
    hosts.forEach((host, at) => {
      for (const bot of states[at]?.bots ?? []) all.set(refKey(host, bot.id), bot);
    });
    return all;
  }, [hosts, states]);
  const stored = docksOf(scena.store);
  const laid = useMemo(
    () => fillDocks([...bots.keys(), ...DOCK_ACTIONS.map((one) => one.key)], (key) => (isAction(key) ? ACTION_HOME : BOT_HOME), stored),
    [bots, stored],
  );
  const pill = ACTION_GROUPS.read(scena.store) === 'pill';
  const shownOf = (dock: Dock): string[] => dock.items.filter((item) => isShownItem(scena.store, item));
  const isBot = (key: string): boolean => bots.has(key);
  const keep = (next: Dock[], moved: readonly string[]): void => {
    setDocks(scena.store, next);
    setArriving({ items: new Map(moved.map((key) => [key, randomTransit()])), at: Date.now() });
  };

  /** The dock under a point, other than one the drag empties, and where among its items the drop lands. */
  const dockAt = (x: number, y: number, moving: readonly string[]): Drag['target'] => {
    for (const dock of laid) {
      const shown = shownOf(dock);
      if (shown.length === 0 || shown.every((item) => moving.includes(item))) continue;
      const box = dockBoxes.current.get(dock.id)?.getBoundingClientRect();
      if (box === undefined || x < box.left - 8 || x > box.right + 8 || y < box.top - 8 || y > box.bottom + 8) continue;
      const row = isRow(dock.place);
      const rest = dock.items.filter((item) => !moving.includes(item));
      const before = shown.filter((item) => !moving.includes(item)).find((item) => {
        const one = itemBoxes.current.get(item)?.getBoundingClientRect();
        return one !== undefined && (row ? x < one.left + one.width / 2 : y < one.top + one.height / 2);
      });
      return { dock: dock.id, index: before === undefined ? rest.length : rest.indexOf(before) };
    }
    return null;
  };

  const down = (event: PointerEvent<HTMLElement>, key: string, dock: Dock): void => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // Held a while, a dock of more than one is ready to carry, and its ring says so.
    const timer = shownOf(dock).length > 1 ? window.setTimeout(() => setArmed(dock.id), HOLD_MS) : 0;
    press.current = { key, dock, x: event.clientX, y: event.clientY, at: Date.now(), timer };
  };
  const move = (event: PointerEvent<HTMLElement>): void => {
    const held = press.current;
    if (held === null) return;
    if (held.items === undefined) {
      if (Math.hypot(event.clientX - held.x, event.clientY - held.y) < DRAG_PX) return;
      window.clearTimeout(held.timer);
      setArmed(null);
      const shown = shownOf(held.dock);
      const whole = Date.now() - held.at >= HOLD_MS || shown.length === 1;
      const movable = (whole ? shown : [held.key]).filter((item) => isMovable(scena.store, item));
      if (movable.length === 0 || (!whole && !isMovable(scena.store, held.key))) {
        // A locked action stays, and shows its lock.
        press.current = null;
        setRefused(held.key);
        return;
      }
      // A whole dock that moves together takes its hidden actions along.
      held.whole = whole && movable.length === shown.length;
      held.items = held.whole ? held.dock.items : movable;
      setOpened(null);
    }
    const target = dockAt(event.clientX, event.clientY, held.items);
    const mayFloat = !held.items.some(isBot);
    setDrag({ items: held.items, x: event.clientX, y: event.clientY, target, place: target === null ? snapDock(event.clientX, event.clientY, window.innerWidth, window.innerHeight, mayFloat) : null });
  };
  const up = (event: PointerEvent<HTMLElement>): void => {
    const held = press.current;
    press.current = null;
    if (held === null) return;
    window.clearTimeout(held.timer);
    setArmed(null);
    if (held.items === undefined) {
      // Held still a while: the item's menu, where the press let go.
      if (Date.now() - held.at >= MENU_HOLD_MS) {
        setOpened(null);
        setMenu({ key: held.key, x: event.clientX, y: event.clientY });
        return;
      }
      run(held.key, event.currentTarget.getBoundingClientRect(), held.dock.place);
      return;
    }
    const target = dockAt(event.clientX, event.clientY, held.items);
    const mayFloat = !held.items.some(isBot);
    const place = snapDock(event.clientX, event.clientY, window.innerWidth, window.innerHeight, mayFloat);
    const next = target !== null
      ? joinDock(laid, held.items, target.dock, target.index)
      : held.whole === true ? moveDock(laid, held.dock.id, place) : takeOut(laid, held.items, newDockId(), place);
    setDrag(null);
    keep(next, held.items);
  };
  const cancel = (): void => {
    if (press.current !== null) window.clearTimeout(press.current.timer);
    press.current = null;
    setArmed(null);
    setDrag(null);
  };

  /** A click: a bot opens, or closes when it is open; an action runs its command. */
  const run = (key: string, box: DOMRect, place: DockPlace): void => {
    const one = actionOf(key);
    if (one !== undefined) {
      void scena.commands.execute(one.command);
      return;
    }
    setOpened(opened?.key === key ? null : { key, ...besideOf(box, place) });
  };

  const drawn = laid.map((dock) => ({ dock, shown: shownOf(dock) })).filter((one) => one.shown.length > 0);
  if (drawn.length === 0) return null;
  const openedBot = opened === null ? undefined : bots.get(opened.key);
  const menuBot = menu === null ? undefined : bots.get(menu.key);
  const menuAction = menu === null ? undefined : actionOf(menu.key);
  const ghostKey = drag?.items.find((item) => isShownItem(scena.store, item));
  const ghostBot = ghostKey === undefined ? undefined : bots.get(ghostKey);
  const ghostAction = ghostKey === undefined ? undefined : actionOf(ghostKey);
  const nameOf = (key: string): string => bots.get(key)?.name ?? (actionOf(key) === undefined ? key : t(`shell/dock/${actionOf(key)!.id}`));
  const keysOf = (one: DockAction): string => canonicalShortcut(typeof one.keys === 'string' ? one.keys : one.keys[0]) ?? '';

  /** The palette button's look where it rests: a search field, a short one, or a square. */
  const lookOf = (dock: Dock, shown: readonly string[]): 'wide' | 'short' | 'icon' => {
    if (!isRow(dock.place)) return 'icon';
    if (width < NARROW_PX) return shown.some(isBot) ? 'icon' : 'short';
    return 'wide';
  };

  const caret = ((): CSSProperties | null => {
    const target = drag?.target;
    if (target == null) return null;
    const dock = laid.find((one) => one.id === target.dock);
    const box = dockBoxes.current.get(target.dock)?.getBoundingClientRect();
    if (dock === undefined || box === undefined) return null;
    const row = isRow(dock.place);
    const rest = dock.items.filter((item) => !drag!.items.includes(item));
    const before = rest[target.index];
    const shownRest = shownOf(dock).filter((item) => !drag!.items.includes(item));
    const anchor = before !== undefined && shownRest.includes(before) ? itemBoxes.current.get(before)?.getBoundingClientRect() : undefined;
    const last = shownRest.at(-1);
    const after = anchor === undefined && last !== undefined ? itemBoxes.current.get(last)?.getBoundingClientRect() : undefined;
    const at = anchor !== undefined ? (row ? anchor.left - 2 : anchor.top - 2) : after !== undefined ? (row ? after.right + 2 : after.bottom + 2) : (row ? box.left + box.width / 2 : box.top + box.height / 2);
    return row
      ? { left: at - 1, top: box.top + 4, width: 2, height: box.height - 8 }
      : { left: box.left + 4, top: at - 1, width: box.width - 8, height: 2 };
  })();

  /** The entries that move the dock of `key`, opened from its menu. */
  const moveList = (key: string, x: number, y: number): PickerAction[] => {
    const dock = laid.find((one) => one.items.includes(key));
    if (dock === undefined) return [];
    const now = isFloating(dock.place) ? 'floating' : dock.place.edge;
    const to = (place: DockPlace) => (host: HostCtx): void => {
      host.closeMenu();
      moveGroupOf(scena.store, key, place);
    };
    const group = shownOf(dock).length > 1 ? t('shell/dock/moveGroup') : t('shell/dock/moveOne', { name: nameOf(key) });
    const edges: [Edge, string][] = [['top', 'shell/dock/top'], ['right', 'shell/dock/right'], ['bottom', 'shell/dock/bottom'], ['left', 'shell/dock/left']];
    const others = drawn.filter((one) => one.dock.id !== dock.id);
    return [
      ...edges.map(([edge, word]): PickerAction => ({ title: t(word), group, active: now === edge, onSelect: to({ edge, at: edge === 'left' || edge === 'right' ? 0.3 : 0.5 }) })),
      ...(dock.items.some(isBot) ? [] : [{ title: t('shell/dock/floatHere'), group, active: now === 'floating', onSelect: to({ float: { x: x / window.innerWidth, y: y / window.innerHeight } }) }]),
      ...others.map((one): PickerAction => ({
        title: t('shell/dock/with', { names: one.shown.map(nameOf).join(', ') }),
        group: t('shell/dock/join'),
        onSelect: (host) => {
          host.closeMenu();
          joinGroup(scena.store, key, one.dock.id);
        },
      })),
    ];
  };

  const actionMenu = (one: DockAction, at: Opened): PickerAction[] => {
    const dock = laid.find((held) => held.items.includes(one.key));
    const grouped = dock !== undefined && shownOf(dock).length > 1;
    const locked = one.position.read(scena.store) === 'locked';
    const name = t(`shell/dock/${one.id}`);
    const own: PickerAction[] = one.id === 'newSession'
      ? [
          { title: t('shell/dock/newSession'), icon: '+', keys: keysOf(one), group: name, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.newSession'); } },
          { title: t('shell/dock/newSessionRight'), icon: '▣', group: name, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.newSession', { place: 'right' }); } },
        ]
      : [
          { title: t('shell/dock/openPalette'), icon: '⌕', keys: keysOf(one), group: name, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('workbench.showCommands'); } },
        ];
    const place = t('shell/dock/placeGroup');
    return [
      ...own,
      { title: t('shell/dock/move'), icon: '✥', group: place, onSelect: (host) => host.pushList({ title: t('shell/dock/back'), items: moveList(one.key, at.x, at.y) }) },
      ...(grouped ? [{ title: t('shell/dock/takeOut'), icon: '⇱', group: place, onSelect: (host: HostCtx) => { host.closeMenu(); leaveGroup(scena.store, one.key); } }] : []),
      { title: t(locked ? 'shell/dock/unlock' : 'shell/dock/lock'), icon: locked ? '🔓︎' : '🔒︎', group: place, onSelect: (host) => { host.closeMenu(); one.position.set(scena.store, locked ? 'movable' : 'locked'); } },
      {
        title: t('shell/dock/hide'), icon: '⊘', group: place,
        onSelect: (host) => {
          host.closeMenu();
          one.shown.set(scena.store, 'hidden');
          done(t('shell/dock/hidden', { name }), {
            description: t('shell/dock/hiddenHow'),
            actions: [
              { label: t('shell/dock/undo'), command: 'dock.showAction', args: { id: one.id } },
              { label: t('shell/dock/settings'), command: 'ahp.openInterfaceSettings' },
            ],
          });
        },
      },
      { title: t('shell/dock/settings'), icon: '⚙︎', group: place, onSelect: (host) => { host.closeMenu(); void scena.commands.execute('ahp.openInterfaceSettings'); } },
    ];
  };

  return (
    <div className="web-bots web-dock-layer" data-dragging={drag === null ? 'false' : 'true'}>
      {drawn.map(({ dock, shown }) => {
        const { shown: drawnItems, more } = splitCluster(shown, isBot);
        const look = lookOf(dock, shown);
        return (
          <div
            key={dock.id}
            ref={(element) => {
              if (element === null) dockBoxes.current.delete(dock.id);
              else dockBoxes.current.set(dock.id, element);
            }}
            className="web-bot-puck web-dock"
            data-edge={isFloating(dock.place) ? 'float' : dock.place.edge}
            data-target={drag?.target?.dock === dock.id ? 'true' : 'false'}
            data-armed={armed === dock.id ? 'true' : 'false'}
            data-pill={pill && shown.length > 1 && shown.some(isAction) ? 'true' : 'false'}
            data-alone={shown.length === 1 ? 'true' : 'false'}
            data-bots={shown.some(isBot) ? 'true' : 'false'}
            style={(isFloating(dock.place) ? { left: `${dock.place.float.x * 100}%`, top: `${dock.place.float.y * 100}%` } : { '--at': dock.place.at }) as CSSProperties}
          >
            {drawnItems.map((key) => {
              const moving = drag?.items.includes(key) === true;
              const keep = (element: HTMLElement | null): void => {
                if (element === null) itemBoxes.current.delete(key);
                else itemBoxes.current.set(key, element);
              };
              const handlers = {
                onPointerDown: (event: PointerEvent<HTMLButtonElement>) => down(event, key, dock),
                onPointerMove: move,
                onPointerUp: up,
                onPointerCancel: cancel,
                onContextMenu: (event: MouseEvent<HTMLButtonElement>) => {
                  // A right click, or a touch screen's own long press: the menu, and no click or drag after it.
                  event.preventDefault();
                  cancel();
                  setOpened(null);
                  setMenu({ key, x: event.clientX, y: event.clientY });
                },
              };
              const one = actionOf(key);
              if (one !== undefined) {
                const label = `${t(`shell/dock/${one.id}`)} (${keysOf(one)})`;
                return (
                  <button
                    key={key}
                    ref={keep}
                    type="button"
                    className={`web-act web-act--${one.id}`}
                    data-moving={moving ? 'true' : 'false'}
                    data-locked={one.position.read(scena.store) === 'locked' ? 'true' : 'false'}
                    data-refused={refused === key ? 'true' : 'false'}
                    data-arrive={arriving?.items.has(key) === true ? String(arriving.at) : undefined}
                    data-open={menu?.key === key ? 'true' : 'false'}
                    data-look={one.id === 'palette' ? look : undefined}
                    title={label}
                    aria-label={label}
                    {...handlers}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      void scena.commands.execute(one.command);
                    }}
                  >
                    {one.id === 'newSession' ? PLUS : (
                      <>
                        <span className="web-act__find">{FIND}</span>
                        <span className="web-act__text web-act__long">{t('shell/dock/searchLong')}</span>
                        <span className="web-act__text web-act__short">{t('shell/dock/searchShort')}</span>
                        <kbd className="web-act__keys">{keysOf(one)}</kbd>
                      </>
                    )}
                    <span className="web-act__lock" aria-hidden="true">{LOCK}</span>
                  </button>
                );
              }
              const bot = bots.get(key)!;
              const mood = moving ? 'observing' : opened?.key === key ? 'happy' : hovered === key ? 'observing' : 'idle';
              const transit = arriving?.items.get(key);
              return (
                <button
                  key={key}
                  ref={keep}
                  type="button"
                  className="web-bot-puck__bot"
                  data-open={opened?.key === key ? 'true' : 'false'}
                  data-moving={moving ? 'true' : 'false'}
                  data-away={away.has(key) ? 'true' : 'false'}
                  tabIndex={away.has(key) ? -1 : undefined}
                  title={bot.name}
                  aria-label={bot.name}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered((held) => (held === key ? null : held))}
                  {...handlers}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setOpened(opened?.key === key ? null : { key, ...besideOf(event.currentTarget.getBoundingClientRect(), dock.place) });
                  }}
                >
                  <Bood body={bot.body} color={bot.color} mood={mood} width={WIDTH} arrive={transit === undefined ? undefined : { transit, at: arriving!.at }} away={away.has(key)} />
                </button>
              );
            })}
            {more.length === 0 ? null : (
              <button
                type="button"
                className="web-bot-puck__more"
                aria-label={t('bots/layer/more', { count: more.length })}
                title={t('bots/layer/more', { count: more.length })}
                onClick={(event) => setOverflow({ ...besideOf(event.currentTarget.getBoundingClientRect(), dock.place), bots: more })}
              >
                {`+${more.length}`}
              </button>
            )}
          </div>
        );
      })}
      {caret === null ? null : <div className="web-dock__caret" style={caret} aria-hidden="true" />}
      {drag?.place == null || isFloating(drag.place) ? null : (
        <div className="web-dock__snap" data-edge={drag.place.edge} style={{ '--at': drag.place.at } as CSSProperties} aria-hidden="true" />
      )}
      {drag === null || ghostKey === undefined ? null : (
        <div className="web-bot-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          {ghostBot !== undefined
            ? <Bood body={ghostBot.body} color={ghostBot.color} mood="observing" width={WIDTH} still />
            : <span className="web-dock__ghost">{ghostAction?.id === 'newSession' ? PLUS : FIND}</span>}
          {drag.items.filter((item) => isShownItem(scena.store, item)).length > 1
            ? <span className="web-bot-puck__more">{`+${drag.items.filter((item) => isShownItem(scena.store, item)).length - 1}`}</span>
            : null}
        </div>
      )}
      {overflow === null ? null : (
        <ContextMenu
          spec={{ items: overflow.bots.map((key) => ({ title: bots.get(key)?.name ?? key, onSelect: (picked) => { picked.closeMenu(); setOpened({ key, x: overflow.x, y: overflow.y }); } })) }}
          x={overflow.x}
          y={overflow.y}
          onClose={() => setOverflow(null)}
        />
      )}
      {menu === null || menuAction === undefined ? null : (
        <ContextMenu spec={{ items: actionMenu(menuAction, menu) }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />
      )}
      {menu === null || menuBot === undefined ? null : (
        <ContextMenu
          spec={{
            items: ([
              ['ahp.chatWithBot', 'bots/actions/openMain', 'main'],
              ['ahp.chatWithBot', 'bots/actions/openRight', 'right'],
              ['ahp.openBot', 'bots/commands/open'],
              ['ahp.editBot', 'bots/actions/edit'],
              ['ahp.deleteBot', 'bots/actions/delete'],
            ] as const).map(([command, word, place]) => ({
              title: t(word),
              // The group's label heads the menu, so it says which bot it is for.
              group: menuBot.name,
              onSelect: (picked: HostCtx) => {
                picked.closeMenu();
                const { host, id } = refOf(menu.key);
                void scena.commands.execute(command, { host, slug: id, name: menuBot.name, ...(place === undefined ? {} : { place }) });
              },
            })),
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
      {opened === null || openedBot === undefined ? null : (
        <BotPopover host={refOf(opened.key).host} bot={openedBot} x={opened.x} y={opened.y} onClose={() => setOpened(null)} />
      )}
    </div>
  );
}

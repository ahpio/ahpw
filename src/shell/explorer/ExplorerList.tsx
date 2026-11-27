import { Fragment, memo, useMemo, useRef, useState, type DragEvent, type ReactElement, type ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, ContextMenu, Note, Panel, RowButton, StatusDot, type StatusDotTone } from '../../ui/index.js';
import type { PickerAction } from '@softov/scena/types';
import type { Icon } from '../../bridges/icons.js';
import { HostIcon, useHostIcon } from '../HostIcon.js';
import { NameMark } from '../NameMark.js';
import { HostLines } from './HostLines.js';

/** The colour of a row's dot, by meaning. */
export type Dot = 'attention' | 'working' | 'failed' | 'fresh' | 'ok' | 'quiet' | 'off';

/** One row: a dot, a title with its time, up to two lines under it, and what its menu offers. */
export interface Row {
  key: string;
  dot: Dot;
  dotLabel: string;
  /** Drawn in place of the dot, such as a bot's figure; `dotLabel` still names it. */
  icon?: ReactNode;
  /** A host's icon for what the row names, drawn with the dot as a badge on its corner; without `icon`. */
  icons?: readonly Icon[];
  /** An emoji drawn in the icon's place, with the dot on its corner, while `icons` has none to draw. */
  emoji?: string;
  /** A name drawn as two letters in a circle of its colour, in the icon's place, before `emoji`; a `quiet` dot is not drawn on it, so it hides no letter. */
  initials?: string;
  title: string;
  time?: string;
  lines: ReactNode[];
  menu: PickerAction[];
  /** Drawn bold: something a person has not looked at yet. */
  strong?: boolean;
  /** The group the row is listed under; rows come grouped already, in order. */
  group?: { key: string; label: string; icons?: readonly Icon[] };
  /** A group inside `group`, drawn as an indented heading; its key is unique across the list. */
  subgroup?: { key: string; label: string };
  /** An icon button on the row, beside its time. */
  action?: { icon: string; label: string; run: () => void };
  /** Draws the row's icon with no dot on its corner, for a row that has no state to show, such as a plugin not installed. */
  bare?: boolean;
  /** A text button on the row, beside its title, such as Install; `busy` draws it disabled while its work runs. */
  button?: { label: string; run: () => void; busy?: boolean };
}

/**
 * The rows a list draws for what is typed in its filter: every row with no
 * search; with one, the rows whose words have it, and then the search rows
 * that do, as one flat list with no group headings.
 */
export function shownRows(rows: readonly Row[], searchRows: readonly Row[] | undefined, needle: string): Row[] {
  if (needle === '') return [...rows];
  const matches = (row: Row): boolean => [row.title, ...row.lines.filter((line) => typeof line === 'string')].join(' ').toLowerCase().includes(needle);
  if (searchRows === undefined) return rows.filter(matches);
  return [...rows, ...searchRows].filter(matches).map(({ group: _group, subgroup: _subgroup, ...rest }) => rest);
}

interface Menu {
  x: number;
  y: number;
  items: PickerAction[];
}

/**
 * A sidebar list: a filter, and rows that open on click and offer a menu on
 * right-click. Its section's title and buttons are scena's header, declared on
 * the section's component; `label` only names the list for assistive tech.
 */
export function ExplorerList({ label, rows, searchRows, selected, onOpen, onRowDragStart, onRowDragEnd, notice, filterLabel, hostLines }: {
  label: string;
  rows: Row[];
  /**
   * Rows shown only while a search is typed, after the matching `rows`, as
   * VS Code's Extensions view adds the marketplace to a search. The list is
   * then one flat list, with no group headings.
   */
  searchRows?: Row[] | undefined;
  selected: string | null;
  onOpen: (key: string) => void;
  /** With it, a row drags: it fills the drag's data, as a session row starts scena's open drag. */
  onRowDragStart?: (event: DragEvent<HTMLElement>, row: Row) => void;
  /** Called when a row's drag ends, taken or not, as a session row opens a window when dropped outside the browser. */
  onRowDragEnd?: (event: DragEvent<HTMLElement>, row: Row) => void;
  notice?: ReactNode;
  filterLabel?: string;
  /** With every host, a line above the rows for each shown host that is not connected. */
  hostLines?: boolean;
}): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [filter, setFilter] = useState('');
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const fold = (key: string): void => setFolded((held) => {
    const next = new Set(held);
    if (!next.delete(key)) next.add(key);
    return next;
  });
  const needle = filter.trim().toLowerCase();
  const shown = shownRows(rows, searchRows, needle);

  // The latest callbacks, read when a row calls, so the rows keep one `acts`.
  const latest = useRef({ onOpen, onRowDragStart, onRowDragEnd });
  latest.current = { onOpen, onRowDragStart, onRowDragEnd };
  const acts = useMemo<RowActs>(() => ({
    open: (key) => latest.current.onOpen(key),
    dragStart: (event, row) => latest.current.onRowDragStart?.(event, row),
    dragEnd: (event, row) => latest.current.onRowDragEnd?.(event, row),
    menu: (x, y, row) => setMenu({ x, y, items: row.menu }),
  }), []);

  return (
    <>
      <Panel {...(filterLabel === undefined ? {} : { filter: { value: filter, label: filterLabel, onChange: setFilter } })} top={hostLines === true ? <HostLines /> : null} notice={notice}>
        <ul className="web-explorer__list" role="listbox" aria-label={label}>
          {shown.map((row, index) => {
            const group = row.group;
            const opens = group !== undefined && shown[index - 1]?.group?.key !== group.key;
            const count = opens ? shown.filter((one) => one.group?.key === group.key).length : 0;
            const sub = row.subgroup;
            const subOpens = sub !== undefined && (opens || shown[index - 1]?.subgroup?.key !== sub.key);
            const subCount = subOpens ? shown.filter((one) => one.subgroup?.key === sub.key).length : 0;
            const groupHidden = group !== undefined && folded.has(group.key);
            const hidden = groupHidden || (sub !== undefined && folded.has(sub.key));
            return (
              <Fragment key={row.key}>
                {opens ? (
                  <li className="web-explorer__group" role="presentation">
                    <RowButton expanded={!hidden} onClick={() => fold(group.key)}>
                      <HostIcon icons={group.icons} size={16} className="web-explorer__group-icon" />
                      <span className="web-explorer__group-label">{group.label}</span>
                      <span className="web-explorer__count">{count}</span>
                    </RowButton>
                  </li>
                ) : null}
                {subOpens && !groupHidden ? (
                  <li className="web-explorer__group web-explorer__group--sub" role="presentation">
                    <RowButton expanded={!folded.has(sub.key)} onClick={() => fold(sub.key)}>
                      <span className="web-explorer__group-label">{sub.label}</span>
                      <span className="web-explorer__count">{subCount}</span>
                    </RowButton>
                  </li>
                ) : null}
                {hidden ? null : (
                  <ListRow row={row} selected={row.key === selected} drags={onRowDragStart !== undefined} acts={acts} />
                )}
              </Fragment>
            );
          })}
        </ul>
        {needle !== '' && shown.length === 0 ? <Note inset>{t('shell/explorer/noMatch')}</Note> : null}
      </Panel>
      {menu === null ? null : <ContextMenu spec={{ items: menu.items }} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </>
  );
}

/** What a row calls; one object for the list's life, so a row redraws only when its own props change. */
interface RowActs {
  open: (key: string) => void;
  dragStart: (event: DragEvent<HTMLElement>, row: Row) => void;
  dragEnd: (event: DragEvent<HTMLElement>, row: Row) => void;
  menu: (x: number, y: number, row: Row) => void;
}

/**
 * One row. Memoised: a click that selects a row redraws that row and the one
 * it unselects, not the whole list. A row redraws when its `Row` object
 * changes, so a caller that builds its rows in a `useMemo` keeps the rest.
 */
const ListRow = memo(function ListRow({ row, selected, drags, acts }: { row: Row; selected: boolean; drags: boolean; acts: RowActs }): ReactElement {
  return (
    <li
      role="option"
      aria-selected={selected}
      tabIndex={0}
      className="web-row"
      data-selected={selected ? 'true' : 'false'}
      onClick={() => acts.open(row.key)}
      {...(drags ? { draggable: true, onDragStart: (event: DragEvent<HTMLElement>) => acts.dragStart(event, row), onDragEnd: (event: DragEvent<HTMLElement>) => acts.dragEnd(event, row) } : {})}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          acts.open(row.key);
        }
        if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
          event.preventDefault();
          const box = event.currentTarget.getBoundingClientRect();
          acts.menu(box.left + 24, box.bottom, row);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        acts.menu(event.clientX, event.clientY, row);
      }}
    >
      {row.icon !== undefined
        ? <span className="web-row__icon" title={row.dotLabel} aria-label={row.dotLabel}>{row.icon}</span>
        : <RowMark row={row} />}
      <span className="web-row__body">
        <span className="web-row__head">
          <span className="web-row__title" data-strong={row.strong === true ? 'true' : 'false'}>{row.title}</span>
          {row.time === undefined ? null : <span className="web-row__time">{row.time}</span>}
          {row.button === undefined ? null : (
            <Button
              variant="primary"
              size="xs"
              disabled={row.button.busy === true}
              busy={row.button.busy === true}
              onClick={(event) => {
                event.stopPropagation();
                row.button?.run();
              }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {row.button.label}
            </Button>
          )}
          {row.action === undefined ? null : (
            <Button variant="subtle" size="xs" tone="accent" title={row.action.label} ariaLabel={row.action.label} onClick={(event) => {
                event.stopPropagation();
                row.action?.run();
              }} onKeyDown={(event) => event.stopPropagation()}>
              {row.action.icon}
            </Button>
          )}
        </span>
        {row.lines.map((line, index) => <span key={index} className="web-row__line">{line}</span>)}
      </span>
    </li>
  );
});

/** The colour of each state's dot. */
const DOT_TONE: Record<Dot, StatusDotTone> = { attention: 'warning', working: 'default', failed: 'danger', fresh: 'accent', ok: 'success', quiet: 'default', off: 'default' };

/** A row's dot, or its host icon with the dot as a badge on its corner. */
function RowMark({ row }: { row: Row }): ReactElement {
  const icon = useHostIcon(row.icons);
  const dot = <StatusDot tone={DOT_TONE[row.dot]} outline={row.dot === 'off'} working={row.dot === 'working'} title={row.dotLabel} />;
  if (icon === undefined && row.initials === undefined && row.emoji === undefined) return dot;
  return (
    <span className="web-row__mark">
      {icon !== undefined
        ? <img className="web-host-icon" src={icon.src} width={20} height={20} alt="" draggable={false} />
        : row.initials !== undefined
          ? <NameMark name={row.initials} size={20} />
          : <span className="web-row__emoji" aria-hidden="true">{row.emoji}</span>}
      {row.bare === true || (icon === undefined && row.initials !== undefined && row.dot === 'quiet') ? null : dot}
    </span>
  );
}

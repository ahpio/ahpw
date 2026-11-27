import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { RowButton } from '../control/RowButton.js';
import './ItemRow.css';

// ahpw component: one item of a list, as a line of facts. A mark leads, the
// title and its meta make the first line, a muted line follows, and what acts
// on the item trails at the end. Rows next to each other are divided by a line.
export interface ItemRowProps {
  // An icon, a status, a check box: before the text, in a fixed column.
  lead?: ReactNode;
  title: ReactNode;
  // After the title on its line, muted, such as an id.
  meta?: ReactNode;
  // A second line, muted, cut to one line.
  line?: ReactNode;
  // A second line, muted, wrapped in full; with `line` too, it comes first.
  text?: ReactNode;
  // At the end of the row: facts and the buttons that act on the item.
  trail?: ReactNode;
  // Shown under the row, such as what an open row holds.
  children?: ReactNode;
  // The item is off: its title is muted.
  off?: boolean;
  // A click on the text opens the item; with `expanded`, it folds `children`.
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  expanded?: boolean;
  // The item open now, or the one the keyboard is on.
  current?: boolean;
  // A tooltip over the text.
  hint?: string;
  // Space each side, for a row inside a card or a box.
  inset?: boolean;
  // Items aligned on their tops, for a row whose text wraps.
  top?: boolean;
  style?: CSSProperties;
}

export function ItemRow({ lead, title, meta, line, text, trail, children, off, onClick, expanded, current, hint, inset, top, style }: ItemRowProps) {
  const body = (
    <span className="oo-item-row__main">
      <span className="oo-item-row__l1">
        <span className="oo-item-row__title">{title}</span>
        {meta === undefined || meta === null ? null : <span className="oo-item-row__meta">{meta}</span>}
      </span>
      {text === undefined || text === null || text === '' ? null : <span className="oo-item-row__text">{text}</span>}
      {line === undefined || line === null || line === '' ? null : <span className="oo-item-row__line">{line}</span>}
    </span>
  );
  return (
    <div className="oo-item-row" data-off={off === true ? 'true' : undefined} data-inset={inset === true ? 'true' : undefined} data-top={top === true ? 'true' : undefined} style={style}>
      <div className="oo-item-row__head">
        {lead === undefined || lead === null ? null : <span className="oo-item-row__lead">{lead}</span>}
        {onClick === undefined
          ? <span className="oo-item-row__body" title={hint}>{body}</span>
          : (
            <RowButton {...(expanded === undefined ? {} : { expanded })} {...(current === undefined ? {} : { current })} {...(hint === undefined ? {} : { title: hint })} onClick={onClick}>
              {body}
            </RowButton>
          )}
        {trail === undefined || trail === null ? null : <span className="oo-item-row__trail">{trail}</span>}
      </div>
      {children}
    </div>
  );
}

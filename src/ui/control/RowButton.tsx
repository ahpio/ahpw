import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import './RowButton.css';

// ahpw component: a line of a list or a panel that is a button, drawn as text,
// not as a control. With `expanded`, it folds what follows it: a caret leads,
// and `aria-expanded` says whether that part shows.
export interface RowButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  ariaLabel?: string;
  // Whether the part this row folds shows; the row has no caret without it.
  expanded?: boolean;
  // Leaves the caret out of a row that folds (`false`), or draws it after the text, shown on hover and while open (`end`).
  caret?: boolean | 'end';
  // The item open now, drawn selected.
  current?: boolean;
  // As wide as its text, not the whole line.
  fit?: boolean;
  // Muted text, full on hover.
  muted?: boolean;
  // Muted at half strength, for a quiet line: full on hover, the accent while open.
  faint?: boolean;
  // The small font size.
  small?: boolean;
  // Items aligned on their centres, not their text baselines.
  center?: boolean;
  // An item of a menu or a picker: padded, rounded, tinted on hover and while `focused`.
  inset?: boolean;
  // The item the keyboard is on, in a menu or a picker.
  focused?: boolean;
  // Whether the item is the one chosen, in a list that keeps one.
  selected?: boolean;
  disabled?: boolean;
  role?: string;
  tabIndex?: number;
  ref?: Ref<HTMLButtonElement>;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

const CLOSED = '\u{25B8}';
const OPEN = '\u{25BE}';

export function RowButton({ children, onClick, title, ariaLabel, expanded, caret = true, current, fit, muted, faint, small, center, inset, focused, selected, disabled, role, tabIndex, ref, onKeyDown, onMouseEnter, style }: RowButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className="oo-row-button"
      data-fit={fit === true ? 'true' : undefined}
      data-muted={muted === true ? 'true' : undefined}
      data-faint={faint === true ? 'true' : undefined}
      data-small={small === true ? 'true' : undefined}
      data-center={center === true ? 'true' : undefined}
      data-inset={inset === true ? 'true' : undefined}
      data-focus={focused === true ? 'true' : undefined}
      aria-selected={selected}
      aria-expanded={expanded}
      aria-current={current === true ? 'true' : undefined}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      role={role}
      tabIndex={tabIndex}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
    >
      {expanded === undefined || caret !== true ? null : <span className="oo-row-button__caret" aria-hidden="true">{expanded ? OPEN : CLOSED}</span>}
      {children}
      {expanded === undefined || caret !== 'end' ? null : <span className="oo-row-button__caret" data-end="true" aria-hidden="true">{expanded ? OPEN : CLOSED}</span>}
    </button>
  );
}

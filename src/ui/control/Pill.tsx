import type { CSSProperties, ReactNode } from 'react';
import './Pill.css';

// ahpw component. scena's `Chip` toggles one value; a pill shows a fact, opens
// what it names, opens a menu, or removes what it names.
export interface PillProps {
  // The text drawn, the tooltip when `title` is not given, and the accessible name.
  label: string;
  title?: string;
  // Drawn with the accent fill, as a held value is.
  on?: boolean;
  // Drawn in place of `label` in a narrow `pills` container: `short` below 40rem, `icon` below 28rem.
  short?: string;
  icon?: string;
  // An image before the label, such as an agent's icon.
  image?: string | undefined;
  // A mark before the label, such as a glyph in a state's colour.
  lead?: ReactNode;
  // Drawn after the label, such as a text box.
  children?: ReactNode;
  // A click on the pill, or on its label when it also has `onRemove`.
  onClick?: () => void;
  // The pill opens a menu: a caret after the label, and `aria-haspopup`.
  menu?: boolean;
  // Whether the part the pill opens is open.
  expanded?: boolean;
  // A pill whose click does nothing now.
  disabled?: boolean;
  // Called by the ✕; without it the pill has no ✕.
  onRemove?: () => void;
  // The ✕'s name, for a screen reader and its tooltip.
  removeLabel?: string;
  // The border's colour, with the label in the full text colour.
  color?: string;
  style?: CSSProperties;
}

const CARET = '\u{25BE}';

export function Pill({ label, title, on = false, short, icon, image, lead, children, onClick, menu = false, expanded, disabled, onRemove, removeLabel, color, style }: PillProps) {
  const look: CSSProperties | undefined = color === undefined ? style : { ...style, borderColor: color };
  const content = (
    <>
      {image === undefined ? null : <img className="oo-pill__image" src={image} alt="" />}
      {lead}
      <span className="oo-pill__long">{label}</span>
      {short === undefined ? null : <span className="oo-pill__short">{short}</span>}
      {icon === undefined ? null : <span className="oo-pill__icon">{icon}</span>}
      {children}
      {menu ? <span aria-hidden="true">{CARET}</span> : null}
    </>
  );
  const marks = {
    'data-on': on ? 'true' : undefined,
    'data-short': short === undefined ? undefined : 'true',
    'data-icon': icon === undefined ? undefined : 'true',
    'data-colored': color === undefined ? undefined : 'true',
  };
  if (onRemove === undefined && onClick !== undefined) {
    return (
      <button
        type="button"
        className="oo-pill"
        {...marks}
        title={title ?? label}
        aria-label={label}
        aria-haspopup={menu ? 'menu' : undefined}
        aria-expanded={expanded}
        disabled={disabled}
        style={look}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return (
    <span className="oo-pill" {...marks} data-still={onClick === undefined && onRemove === undefined ? 'true' : undefined} title={title ?? label} style={look}>
      {onClick === undefined ? content : <button type="button" className="oo-pill__open" onClick={onClick}>{content}</button>}
      {onRemove === undefined ? null : (
        <button type="button" className="oo-pill__remove" aria-label={removeLabel ?? label} title={removeLabel ?? label} onClick={onRemove}>{'\u{00D7}'}</button>
      )}
    </span>
  );
}

export interface TextPillProps {
  label: string;
  title?: string;
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  // The text box's width in pixels; 110 when not given.
  width?: number;
}

// ahpw component: a pill with a text box in it.
export function TextPill({ label, title, value, placeholder, onChange, width }: TextPillProps) {
  return (
    <Pill label={label} {...(title === undefined ? {} : { title })}>
      <input aria-label={label} value={value} placeholder={placeholder ?? ''} style={{ width: width ?? 110 }} onChange={(event) => onChange(event.currentTarget.value)} />
    </Pill>
  );
}

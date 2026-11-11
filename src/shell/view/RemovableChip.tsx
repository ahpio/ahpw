import type { CSSProperties, ReactElement } from 'react';
import './removable-chip.css';

interface RemovableChipProps {
  label: string;
  /** The pill's tooltip; its label when not given. */
  title?: string;
  /** Drawn with the accent fill, as a held chip is. */
  on?: boolean;
  /** The ✕'s name, for a screen reader and its tooltip. */
  removeLabel: string;
  /** Called by the ✕; without it the pill has no ✕. */
  onRemove?: () => void;
  /** Called by the label, which is then a button that opens what the pill names. */
  onOpen?: () => void;
  /** The border's colour, drawn with the full text colour; the muted look without it. */
  color?: string;
}

/**
 * A pill with a ✕ that removes what it names, as a role on a user or a
 * membership on a team. scena's `Chip` is a toggle and holds nothing else, so
 * this is ahpw's until it is validated and moves to scena.
 */
export function RemovableChip({ label, title, on = false, removeLabel, onRemove, onOpen, color }: RemovableChipProps): ReactElement {
  const style: CSSProperties | undefined = color === undefined ? undefined : { borderColor: color };
  return (
    <span
      className="web-chip"
      data-on={on ? 'true' : undefined}
      data-still={onRemove === undefined && onOpen === undefined ? 'true' : undefined}
      data-colored={color === undefined ? undefined : 'true'}
      style={style}
      title={title ?? label}
    >
      {onOpen === undefined ? label : <button type="button" className="web-chip__open" onClick={onOpen}>{label}</button>}
      {onRemove === undefined ? null : (
        <button type="button" className="web-chip__remove" aria-label={removeLabel} title={removeLabel} onClick={onRemove}>{'\u{00D7}'}</button>
      )}
    </span>
  );
}

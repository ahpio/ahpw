import type { ReactNode } from 'react';
import './Swatches.css';

// ahpw component: a choice of one among things seen rather than read, such as
// colours or pictures, drawn as a row of tiles that wraps. Each tile is a radio.
export interface Swatch<T extends string> {
  id: T;
  // The tile's tooltip and accessible name.
  label: string;
  // A colour drawn as a round tile.
  color?: string;
  // A picture drawn in a square tile, when `color` is not given.
  content?: ReactNode;
}

export interface SwatchesProps<T extends string> {
  // What the tiles choose, for a screen reader.
  label: string;
  options: readonly Swatch<T>[];
  value: string;
  onChange: (next: T) => void;
}

export function Swatches<T extends string>({ label, options, value, onChange }: SwatchesProps<T>) {
  return (
    <div className="oo-swatches" role="radiogroup" aria-label={label}>
      {options.map((one) => (
        <button
          key={one.id}
          type="button"
          role="radio"
          className="oo-swatches__item"
          data-color={one.color === undefined ? undefined : 'true'}
          aria-checked={one.id === value}
          aria-label={one.label}
          title={one.label}
          style={one.color === undefined ? undefined : { background: one.color }}
          onClick={() => onChange(one.id)}
        >
          {one.color === undefined ? one.content : null}
        </button>
      ))}
    </div>
  );
}

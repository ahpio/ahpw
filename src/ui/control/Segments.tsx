import './Segments.css';

// ahpw component: a small set of choices drawn as one bordered strip, one of
// them on, such as how a list shows. Each choice is a toggle button.
export interface SegmentOption<T extends string> {
  id: T;
  // The choice's name: its text, or its tooltip and accessible name when `icon` is given.
  label: string;
  // A glyph drawn in place of the label.
  icon?: string;
}

export interface SegmentsProps<T extends string> {
  // What the choices choose, for a screen reader.
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
}

export function Segments<T extends string>({ label, options, value, onChange }: SegmentsProps<T>) {
  return (
    <span className="oo-segments" role="group" aria-label={label}>
      {options.map((one) => (
        <button
          key={one.id}
          type="button"
          className="oo-segments__item"
          aria-pressed={one.id === value}
          title={one.label}
          aria-label={one.icon === undefined ? undefined : one.label}
          onClick={() => onChange(one.id)}
        >
          {one.icon ?? one.label}
        </button>
      ))}
    </span>
  );
}

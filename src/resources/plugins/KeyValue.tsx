import type { ReactElement } from 'react';
import './keyvalue.css';

/** A view's `KeyValue`: one line, its label at the start and its value at the end. */
export default function KeyValue({ label, value }: { label?: unknown; value?: unknown }): ReactElement {
  return (
    <div className="web-keyvalue">
      <span className="web-keyvalue__label">{textOf(label)}</span>
      <span className="web-keyvalue__value">{textOf(value)}</span>
    </div>
  );
}

/** A prop as the text it reads, or nothing for a value a binding did not fill. */
export function textOf(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

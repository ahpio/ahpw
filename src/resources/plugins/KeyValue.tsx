import type { ReactElement, ReactNode } from 'react';
import './keyvalue.css';
import { Note } from '../../ui/index.js';

/**
 * A view's `KeyValue`: one line, its label at the start and its value at the
 * end. A `child`, such as a `DateTime`, is drawn as the value in place of
 * `value`.
 */
export default function KeyValue({ label, value, child }: { label?: unknown; value?: unknown; child?: ReactNode }): ReactElement {
  return (
    <div className="web-keyvalue">
      <Note inline>{textOf(label)}</Note>
      <span className="web-keyvalue__value">{child === undefined || child === null ? textOf(value) : child}</span>
    </div>
  );
}

/** A prop as the text it reads, or nothing for a value a binding did not fill. */
export function textOf(value: unknown): string {
  return typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

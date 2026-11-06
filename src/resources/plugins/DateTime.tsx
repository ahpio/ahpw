import type { ReactElement } from 'react';
import { dateFormat } from '../../i18n/locales.js';

/** How a view's `DateTime` shows its time, as ahpd checks its `format`. */
export type DateTimeFormat = 'time' | 'date' | 'datetime' | 'auto';

/** The hour and the minute. */
const TIME = dateFormat({ hour: '2-digit', minute: '2-digit' });
/** The weekday and the day. */
const DATE = dateFormat({ weekday: 'short', month: 'short', day: 'numeric' });
/** The weekday, the day, the hour and the minute. */
const BOTH = dateFormat({ weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * An ISO time as the reader reads it, in this browser's zone and the chosen
 * language. `auto`, the default, is the hour on the reader's today and the
 * weekday, the day and the hour on another day. A value that is not a time is
 * empty, so a view whose data has none draws nothing.
 */
export function dateTimeText(value: unknown, format: unknown = 'auto', now: Date = new Date()): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  switch (format) {
    case 'time': return TIME.format(date);
    case 'date': return DATE.format(date);
    case 'datetime': return BOTH.format(date);
    default: return date.toDateString() === now.toDateString() ? TIME.format(date) : BOTH.format(date);
  }
}

/**
 * A view's `DateTime`: a time the host sends in UTC, shown in the reader's own
 * zone, after its `label` when it has one, as `Resets 05:10 AM`.
 */
export default function DateTime({ value, format, label }: { value?: unknown; format?: unknown; label?: unknown }): ReactElement | null {
  const text = dateTimeText(value, format);
  if (text === '') return null;
  return <span>{typeof label === 'string' && label !== '' ? `${label} ${text}` : text}</span>;
}

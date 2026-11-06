import { describe, expect, it } from 'vitest';
import { getLocale } from '@softov/scena';
import { dateTimeText } from './DateTime.js';

describe('a view DateTime', () => {
  const now = new Date(2026, 10, 6, 1, 0);
  const today = new Date(2026, 10, 6, 5, 10).toISOString();
  const later = new Date(2026, 10, 12, 4, 0).toISOString();

  it('shows the hour of a time today, and the day with the hour of another day, when auto', () => {
    expect(dateTimeText(today, 'auto', now)).toBe(dateTimeText(today, 'time', now));
    expect(dateTimeText(later, 'auto', now)).toBe(dateTimeText(later, 'datetime', now));
    expect(dateTimeText(later, undefined, now)).toBe(dateTimeText(later, 'datetime', now));
  });

  it('shows the time in the reader\'s zone, not the UTC the host sent', () => {
    const utc = new Date(Date.UTC(2026, 10, 6, 9, 10)).toISOString();
    const local = new Date(utc).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
    expect(dateTimeText(utc, 'time', now)).toBe(local);
  });

  it('is empty for a value that is not a time', () => {
    expect(dateTimeText(undefined)).toBe('');
    expect(dateTimeText('tomorrow')).toBe('');
    expect(dateTimeText({ path: '/reset' })).toBe('');
  });
});

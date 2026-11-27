import type { CSSProperties } from 'react';

// Copied from scena `ui/_utils.ts`.
export function weightStyle(weight?: number): CSSProperties {
  if (typeof weight !== 'number') return {};
  return { flex: `${weight}`, minWidth: 0, minHeight: 0 };
}

import type { ReactElement } from 'react';

/** A pull request's state as its card shows it: GitHub's three, and an open draft. */
export type PullRequestKind = 'open' | 'draft' | 'merged' | 'closed';

/** The 16 by 16 path of each kind's icon, GitHub's shapes, as VS Code's card draws them. */
const PATHS: Record<PullRequestKind, string> = {
  open: 'M4.75 1.5a2.25 2.25 0 0 0-.75 4.37v4.26a2.25 2.25 0 1 0 1.5 0V5.87A2.25 2.25 0 0 0 4.75 1.5Zm0 1.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm0 8.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm6.5-.13V6.5A2.75 2.75 0 0 0 8.5 3.75H7.31l.97-.97-1.06-1.06L4.44 4.5l2.78 2.78 1.06-1.06-.97-.97H8.5c.69 0 1.25.56 1.25 1.25v4.37a2.25 2.25 0 1 0 1.5 0Zm-.75 1.63a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z',
  merged: 'M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.12a2.25 2.25 0 1 0-1.5 0v5.26a2.25 2.25 0 1 0 1.5 0V8.06c.93.78 2.12 1.19 3.38 1.19h1.75a2.25 2.25 0 1 0 0-1.5H8.38A3.38 3.38 0 0 1 5 4.37Zm-.75 6.38a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm8-3.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z',
  draft: 'M3.25 1A2.25 2.25 0 0 1 4 5.37v5.26a2.25 2.25 0 1 1-1.5 0V5.37A2.25 2.25 0 0 1 3.25 1Zm0 10.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0-9a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM12.75 10a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 1.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0-5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Zm0-3a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z',
  closed: 'M3.25 1A2.25 2.25 0 0 1 4 5.37v5.26a2.25 2.25 0 1 1-1.5 0V5.37A2.25 2.25 0 0 1 3.25 1Zm0 10.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0-9a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.5 7.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 1.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM10.1 2.04l1.65 1.65 1.65-1.65 1.06 1.06-1.65 1.65 1.65 1.65-1.06 1.06-1.65-1.65-1.65 1.65-1.06-1.06 1.65-1.65-1.65-1.65Z',
};

/** Each kind's colour, as a scena colour name, which the theme turns light or dark. */
export const KIND_COLOR: Record<PullRequestKind, string> = { open: 'green', draft: 'gray', merged: 'purple', closed: 'red' };

/**
 * Each kind's colour for an icon drawn as an image, which no theme reaches: a
 * picker row takes an icon as `iconSrc`. Mid tones that read on light and dark.
 */
const IMAGE_COLOR: Record<PullRequestKind, string> = { open: '#2da44e', draft: '#8b949e', merged: '#8957e5', closed: '#e5534b' };

/** A kind's icon, in the theme's colour for it unless `plain`, which leaves the colour to the parent. */
export function PullRequestIcon({ kind, size = 14, plain }: { kind: PullRequestKind; size?: number; plain?: boolean }): ReactElement {
  return (
    <svg
      className="web-pr-icon"
      data-kind={kind}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      {...(plain === true ? {} : { style: { color: `var(--oo-color-${KIND_COLOR[kind]})` } })}
    >
      <path fill="currentColor" d={PATHS[kind]} />
    </svg>
  );
}

/** A kind's icon as a `data:` URI, for a picker row. */
export function pullRequestIconSrc(kind: PullRequestKind): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="${IMAGE_COLOR[kind]}" d="${PATHS[kind]}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

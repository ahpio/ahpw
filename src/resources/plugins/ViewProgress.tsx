import type { ReactElement, ReactNode } from 'react';
import { Progress } from '@softov/scena/ui';
import { textOf } from './KeyValue.js';
import './viewprogress.css';

/**
 * A view's `Progress`: scena's bar as it is, with its label and its value, and
 * the `child` below it as a small footer, as the usage view's notes are.
 *
 * A value a binding did not fill draws an empty bar with no share: a window
 * nobody measured yet has no share, not a share of 0.
 */
export default function ViewProgress({ label, value, max, display, child }: {
  label?: unknown;
  value?: unknown;
  max?: unknown;
  display?: unknown;
  child?: ReactNode;
}): ReactElement {
  const measured = typeof value === 'number' && Number.isFinite(value);
  return (
    <div className="web-view-progress">
      <Progress
        value={measured ? value : 0}
        {...(typeof max === 'number' && max > 0 ? { max } : {})}
        {...(textOf(label) === '' ? {} : { label: textOf(label) })}
        {...(measured && typeof display === 'string' ? { display } : {})}
      />
      {child === undefined || child === null ? null : <div className="web-note">{child}</div>}
    </div>
  );
}

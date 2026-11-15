import type { ReactElement } from 'react';
import { Text } from '@softov/scena/ui';
import './section.css';

/** A section's heading on a page: its icon, its title, and how many rows it holds when it lists any. */
export function Section({ icon, title, count }: { icon: string; title: string; count?: number }): ReactElement {
  return (
    <div className="web-section">
      <span className="web-section__icon" aria-hidden="true">{icon}</span>
      <Text variant="h3" text={title} />
      {count === undefined ? null : <span className="web-section__count">{`(${String(count)})`}</span>}
    </div>
  );
}

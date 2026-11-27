import type { ReactElement, ReactNode } from 'react';
import { Text } from '@softov/scena/ui';
import { RowButton } from '../control/RowButton.js';
import './Section.css';

// ahpw component: a section's heading on a page or in a panel.
export interface SectionProps {
  title: string;
  // A glyph in a fixed column before the title.
  icon?: string;
  // How many rows the section holds, or a fact such as "3 of 5 on", after the title.
  count?: number | string;
  // The small bold heading of a panel, in place of a page's.
  small?: boolean;
  // With `onFold`, the heading is a button that folds the section, with a caret.
  folded?: boolean;
  onFold?: () => void;
}

export function Section({ title, icon, count, small, folded, onFold }: SectionProps): ReactElement {
  const content = (
    <>
      {icon === undefined ? null : <span className="oo-section__icon" aria-hidden="true">{icon}</span>}
      {small === true ? <span className="oo-section__title">{title}</span> : <Text variant="h3" text={title} />}
      {count === undefined ? null : <span className="oo-section__count">{typeof count === 'number' ? `(${String(count)})` : count}</span>}
    </>
  );
  return (
    <div className="oo-section" data-small={small === true ? 'true' : undefined}>
      {onFold === undefined ? content : <RowButton expanded={folded !== true} center onClick={onFold}>{content}</RowButton>}
    </div>
  );
}

// ahpw component: a part of a page under its section heading, with a line
// above it to set it off from the part before; the first part has no line.
export function Group({ title, icon, children }: { title: string; icon?: string | undefined; children: ReactNode }): ReactElement {
  return (
    <section className="oo-group" aria-label={title}>
      <Section title={title} {...(icon === undefined ? {} : { icon })} />
      {children}
    </section>
  );
}

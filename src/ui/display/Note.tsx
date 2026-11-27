import type { ReactNode } from 'react';
import './Note.css';

// ahpw component: a short muted line, such as what an empty list means or what
// a field does. Inset, it has the padding of a list it stands in for.
export interface NoteProps {
  children: ReactNode;
  inset?: boolean;
  // Inside a line of text, as a span.
  inline?: boolean;
  tone?: 'danger';
  role?: string;
  title?: string;
}

export function Note({ children, inset, inline, tone, role, title }: NoteProps) {
  const Tag = inline === true ? 'span' : 'p';
  return (
    <Tag className="oo-note" data-inset={inset === true ? 'true' : undefined} data-tone={tone} role={role} title={title}>
      {children}
    </Tag>
  );
}

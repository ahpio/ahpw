import type { ReactNode } from 'react';
import './Page.css';

// ahpw component: a page of the main area. It spans the surface, so its scroll
// bar is on the surface's edge, and centres each part in a gutter; tabs span the
// surface too, with the strip as a band under the head.
export function Page({ children }: { children: ReactNode }) {
  return <div className="oo-page">{children}</div>;
}

// ahpw component: a page's head, such as its title and what it is.
export function PageHead({ children }: { children: ReactNode }) {
  return <header className="oo-page__head">{children}</header>;
}

// ahpw component: a page's buttons, in a row.
export function PageActions({ children }: { children: ReactNode }) {
  return <div className="oo-page__actions">{children}</div>;
}

// ahpw component: a page's blocks, one under another, apart by the medium space
// and with that space above them, as a tab's content or a form. A section after
// another keeps a line of space over its heading; blocks inside blocks add no
// space of their own above.
export function Blocks({ children }: { children: ReactNode }) {
  return <div className="oo-blocks">{children}</div>;
}
